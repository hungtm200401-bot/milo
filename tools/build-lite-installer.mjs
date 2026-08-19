import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdirSync, createReadStream, createWriteStream, statSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { appRoot } from "../server/paths.mjs";

const root = appRoot;
const hasDriveE = existsSync("E:\\");
const stagingDir = hasDriveE ? "E:\\Temp_Milo_Lite_Build" : join(root, "dist");
const payloadZip = join(stagingDir, "payload_lite.zip");
const installerDir = join(root, "windows-launcher-src", "milo-installer");
const tempPublishDir = join(installerDir, "bin", "publish_stub");

if (!existsSync(stagingDir)) mkdirSync(stagingDir, { recursive: true });

console.log("=== ĐÓNG GÓI BẢN SIÊU NHẸ (LITE WEB INSTALLER ~20MB) ===");
console.log(`📁 Thư mục làm việc tạm: ${stagingDir}`);

// 1. Compile Stub
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

// 2. Compress Lite Payload
console.log("2. Đang nén dữ liệu cốt lõi (Lite Package)...");
if (existsSync(payloadZip)) rmSync(payloadZip, { force: true });

const tarRun = spawnSync(
  "tar.exe",
  [
    "-a",
    "-c",
    "-f",
    payloadZip,
    "--exclude=.git",
    "--exclude=dist",
    "--exclude=windows-launcher-src",
    "--exclude=updates",
    "--exclude=.codex",
    "--exclude=reports",
    "--exclude=src",
    "--exclude=assets/anhmoi",
    "--exclude=assets/anhmoi_extracted",
    "--exclude=assets/flashcards",
    "--exclude=node_modules",
    "--exclude=Milo_Setup.exe",
    "--exclude=Milo_Lite_Setup.exe",
    "--exclude=Milo_Full_Setup.exe",
    "*",
  ],
  {
    cwd: root,
    stdio: "inherit",
  }
);

if (tarRun.status !== 0 || !existsSync(payloadZip)) {
  console.error("Lỗi khi nén payload_lite.zip!");
  process.exit(1);
}

// 3. Concatenate Stub + Payload + 8-byte Trailer (zipOffset)
console.log("3. Đang ghép tạo file cài đặt siêu nhẹ Milo_Lite_Setup.exe...");
const finalExe = hasDriveE ? "E:\\Milo_Lite_Setup.exe" : join(root, "Milo_Lite_Setup.exe");
const stubStat = statSync(stubExe);
const stubLength = stubStat.size;

const lenBuf = Buffer.alloc(8);
lenBuf.writeBigInt64LE(BigInt(stubLength), 0);

const ws = createWriteStream(finalExe);
await pipeline(createReadStream(stubExe), ws, { end: false });
const ws2 = createWriteStream(finalExe, { flags: "a" });
await pipeline(createReadStream(payloadZip), ws2, { end: false });
const ws3 = createWriteStream(finalExe, { flags: "a" });
ws3.write(lenBuf);
ws3.end();

// 4. Cleanup
if (existsSync(payloadZip)) rmSync(payloadZip, { force: true });
if (existsSync(stagingDir) && stagingDir !== "E:\\") rmSync(stagingDir, { recursive: true, force: true });
if (existsSync(tempPublishDir)) rmSync(tempPublishDir, { recursive: true, force: true });
rmSync(join(installerDir, "bin"), { recursive: true, force: true });
rmSync(join(installerDir, "obj"), { recursive: true, force: true });

console.log(`\n🎉 ĐÓNG GÓI BẢN SIÊU NHẸ THÀNH CÔNG!`);
console.log(`👉 File cài đặt siêu nhẹ sẵn sàng gửi qua Zalo/Telegram:`);
console.log(`   ${finalExe}`);
