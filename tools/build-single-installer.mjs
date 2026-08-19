import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdirSync, createReadStream, createWriteStream, statSync, copyFileSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { appRoot } from "../server/paths.mjs";

const root = appRoot;
const hasDriveE = existsSync("E:\\");
const stagingDir = hasDriveE ? "E:\\Temp_Milo_Full_Build" : join(root, "dist");
const payloadZip = join(stagingDir, "payload_full.zip");
const installerDir = join(root, "windows-launcher-src", "milo-installer");
const tempPublishDir = join(installerDir, "bin", "publish_stub");

if (!existsSync(stagingDir)) mkdirSync(stagingDir, { recursive: true });

console.log("=== ĐÓNG GÓI BẢN ĐẦY ĐỦ 100% TÀI NGUYÊN BÀI HỌC (MILO_SETUP.EXE) ===");
console.log(`📁 Thư mục làm việc tạm: ${stagingDir}`);

// 1. Compile Installer Stub
console.log("1. Đang biên dịch Installer Stub...");
const csproj = join(installerDir, "MiloInstaller.csproj");
const buildRun = spawnSync(
  "dotnet",
  [
    "publish",
    csproj,
    "-c",
    "Release",
    "-r",
    "win-x64",
    "--self-contained",
    "true",
    "-p:PublishSingleFile=true",
    "-p:IncludeNativeLibrariesForSelfExtract=true",
    "-o",
    tempPublishDir,
  ],
  { stdio: "inherit" }
);

if (buildRun.status !== 0) {
  console.error("Lỗi khi biên dịch dotnet!");
  process.exit(1);
}

const stubExe = join(tempPublishDir, "Milo_Setup_Stub.exe");

// 2. Chuẩn bị Node.js Portable Runtime vào RUNTIME_NOI_BO để máy người nhận không cần cài Node.js
const internalNodeDir = join(root, "RUNTIME_NOI_BO");
const internalNodeExe = join(internalNodeDir, "node.exe");
const systemNodeExe = process.execPath;
let embeddedNode = false;

if (existsSync(systemNodeExe)) {
  console.log("2.1. Đang nhúng Node.js Portable Runtime nội bộ...");
  if (!existsSync(internalNodeDir)) mkdirSync(internalNodeDir, { recursive: true });
  try {
    copyFileSync(systemNodeExe, internalNodeExe);
    embeddedNode = true;
    console.log("   ✅ Đã nhúng Node.js Portable vào RUNTIME_NOI_BO/node.exe");
  } catch (err) {
    console.warn("   ⚠️ Không thể copy node.exe:", err.message);
  }
}

// 2.2. Compress FULL PAYLOAD (Retaining 100% flashcards, lessons, content, pet-assets, public, server, runtime)
// Only exclude developer test reports, git history, and dev-only OCR CLI tools.
console.log("2.2. Đang đóng gói 100% toàn bộ tài nguyên bài học, hình ảnh, âm thanh, flashcards, runtime...");
if (existsSync(payloadZip)) rmSync(payloadZip, { force: true });

const tarRun = spawnSync(
  "tar.exe",
  [
    "-a",
    "-c",
    "-f",
    payloadZip,
    "--exclude=assets/anhmoi_extracted",
    "--exclude=assets/anhmoi",
    "assets",
    "bin",
    "content",
    "data",
    "pet-assets",
    "public",
    "server",
    "RUNTIME_NOI_BO",
    "package.json",
    "windows-launcher-src/milo-student.ico",
  ],
  {
    cwd: root,
    stdio: "inherit",
  }
);

// Dọn dẹp node.exe tạm khỏi thư mục workspace để duy trì tính toàn vẹn của mã nguồn
if (embeddedNode && existsSync(internalNodeExe)) {
  try {
    rmSync(internalNodeExe, { force: true });
  } catch {}
}

if (tarRun.status !== 0 || !existsSync(payloadZip)) {
  console.error("Lỗi khi nén payload_full.zip!");
  process.exit(1);
}

// 3. Concatenate Stub + Full Payload + 8-byte Trailer (zipOffset)
console.log("3. Đang ghép tạo file cài đặt hoàn chỉnh 100% Milo_Setup.exe...");
const finalExe = hasDriveE ? "E:\\Milo_Setup.exe" : join(root, "Milo_Setup.exe");
const stubStat = statSync(stubExe);
const stubLength = stubStat.size;

const lenBuf = Buffer.alloc(8);
lenBuf.writeBigInt64LE(BigInt(stubLength), 0);

writeFileSync(finalExe, readFileSync(stubExe));
appendFileSync(finalExe, readFileSync(payloadZip));
appendFileSync(finalExe, lenBuf);

// 4. Tạo file ZIP cài đặt hoàn chỉnh để gửi cho người khác
console.log("4. Đang nén file cài đặt thành gói ZIP hoàn chỉnh (Dễ gửi qua Zalo, Drive, Gmail)...");
const zipDir = join(root, "dist");
if (!existsSync(zipDir)) mkdirSync(zipDir, { recursive: true });

const distZip = join(zipDir, "Milo_English_Adventure_Setup.zip");
const driveEZip = hasDriveE ? "E:\\Milo_English_Adventure_Setup.zip" : null;

// Viết file hướng dẫn sử dụng kèm theo
const readmeText = `======================================================
     MILO ENGLISH ADVENTURE - HƯỚNG DẪN CÀI ĐẶT
======================================================

Xin chào bạn! Đây là bộ cài đặt trọn gói Milo English Adventure (Tiếng Anh Tiểu Học Lớp 2-5).

👉 CÁCH CÀI ĐẶT (CHỈ 1 CLICK):
1. Giải nén file ZIP này (nếu chưa giải nén).
2. Nhấp đúp chuột vào file: Milo_Setup.exe
3. Chờ 5 - 10 giây để chương trình tự động chuẩn bị dữ liệu bài học.
4. Ứng dụng sẽ tự động tạo biểu tượng "Milo English Adventure" ngoài màn hình Desktop và tự mở ứng dụng lên học ngay!

✅ Không cần cài đặt thêm bất kỳ phần mềm hay môi trường nào khác.
✅ Đã tích hợp đầy đủ 100% bài học, hình ảnh flashcard 3D, trợ lý AI và âm thanh.

Chúc các bạn nhỏ có những giờ học Tiếng Anh thật vui vẻ và bổ ích cùng Milo!
======================================================
`;

const tempZipFolder = hasDriveE ? "E:\\Temp_Milo_Zip_Pkg" : join(zipDir, "temp_pkg");
if (existsSync(tempZipFolder)) rmSync(tempZipFolder, { recursive: true, force: true });
mkdirSync(tempZipFolder, { recursive: true });

import("node:fs").then(fs => {
  // Đồng bộ hoàn tất
});
const fs = await import("node:fs");
fs.writeFileSync(join(tempZipFolder, "HUONG_DAN_CAI_DAT.txt"), readmeText, "utf8");
fs.copyFileSync(finalExe, join(tempZipFolder, "Milo_Setup.exe"));

if (existsSync(distZip)) rmSync(distZip, { force: true });
if (driveEZip && existsSync(driveEZip)) rmSync(driveEZip, { force: true });

spawnSync("tar.exe", ["-a", "-c", "-f", distZip, "*"], { cwd: tempZipFolder, stdio: "inherit" });
if (driveEZip) {
  try {
    fs.copyFileSync(distZip, driveEZip);
  } catch {}
}

if (existsSync(tempZipFolder)) rmSync(tempZipFolder, { recursive: true, force: true });

// 5. Cleanup temp files
if (existsSync(payloadZip)) rmSync(payloadZip, { force: true });
if (existsSync(stagingDir) && stagingDir !== "E:\\") rmSync(stagingDir, { recursive: true, force: true });
if (existsSync(tempPublishDir)) rmSync(tempPublishDir, { recursive: true, force: true });
rmSync(join(installerDir, "bin"), { recursive: true, force: true });
rmSync(join(installerDir, "obj"), { recursive: true, force: true });

console.log(`\n🎉 ĐÓNG GÓI BẢN ĐẦY ĐỦ 100% TÀI NGUYÊN THÀNH CÔNG!`);
console.log(`👉 File cài đặt 100% đầy đủ mọi dữ liệu bài học (EXE):`);
console.log(`   ${finalExe}`);
if (driveEZip) {
  console.log(`👉 File ZIP nén sẵn sàng gửi cho người khác (Ổ E):`);
  console.log(`   ${driveEZip}`);
}
console.log(`👉 File ZIP nén sẵn sàng gửi cho người khác (Thư mục dự án dist):`);
console.log(`   ${distZip}\n`);
