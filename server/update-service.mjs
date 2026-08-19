import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync, readFileSync, createReadStream, createWriteStream } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { appRoot } from "./paths.mjs";

const root = appRoot;
const versionFile = join(root, "package.json");

export function getAppVersion() {
  try {
    if (existsSync(versionFile)) {
      const data = JSON.parse(readFileSync(versionFile, "utf8"));
      return data.version || "60.24.4";
    }
  } catch {
    // fallback
  }
  return "60.24.4";
}

let activeRelease = {
  version: "60.25.7",
  releaseDate: new Date().toISOString(),
  title: "Bản sửa lỗi V60.25.7 (Ưu tiên Runtime nội bộ tuyệt đối + Tăng tốc khởi động máy cũ)",
  changelog: [
    "Sửa triệt để lỗi FindNode: Ưu tiên tuyệt đối RUNTIME_NOI_BO nội bộ, không bị PATH system đè lên",
    "Tăng timeout khởi động lên 35 giây để hỗ trợ máy cũ/yếu của phụ huynh",
    "Sửa đường dẫn icon Desktop shortcut chính xác",
    "Ghi log chi tiết từng bước tìm kiếm node.exe để dễ chẩn đoán lỗi tương lai"
  ],
  hasUpdate: true,
};

const DEFAULT_REMOTE_RELEASE_URL = process.env.MILO_REMOTE_UPDATE_URL || "";

export function createUpdateService({ rootDir = root } = {}) {
  async function getStatus() {
    let currentVersion = "60.24.4";
    try {
      const pkg = JSON.parse(await readFile(join(rootDir, "package.json"), "utf8"));
      currentVersion = pkg.version || currentVersion;
    } catch {}

    // Thử kiểm tra cập nhật trực tuyến từ Cloud Release Server nếu có cấu hình
    if (DEFAULT_REMOTE_RELEASE_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const remoteRes = await fetch(DEFAULT_REMOTE_RELEASE_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (remoteRes.ok) {
          const remoteData = await remoteRes.json();
          if (remoteData && remoteData.version) {
            activeRelease = {
              version: remoteData.version,
              releaseDate: remoteData.releaseDate || new Date().toISOString(),
              title: remoteData.title || `Bản nâng cấp V${remoteData.version}`,
              changelog: Array.isArray(remoteData.changelog) ? remoteData.changelog : ["Cập nhật bài học mới"],
              hasUpdate: compareVersions(remoteData.version, currentVersion) > 0,
              downloadUrl: remoteData.downloadUrl || "",
            };
          }
        }
      } catch {
        // Nếu offline thì dùng activeRelease cục bộ
      }
    }

    const isNewer = compareVersions(activeRelease.version, currentVersion) > 0;
    const contentReady = checkContentReady(rootDir);

    return {
      currentVersion,
      latestVersion: activeRelease.version,
      hasUpdate: isNewer,
      contentReady,
      releaseDate: activeRelease.releaseDate,
      title: activeRelease.title,
      changelog: activeRelease.changelog,
      downloadUrl: activeRelease.downloadUrl || "",
    };
  }

  function checkContentReady(dir) {
    const flashcardsDir = join(dir, "assets", "flashcards");
    const contentDir = join(dir, "content");
    return existsSync(flashcardsDir) || existsSync(contentDir);
  }

  async function setLatestRelease(payload = {}) {
    activeRelease = {
      version: payload.version || activeRelease.version,
      releaseDate: new Date().toISOString(),
      title: payload.title || `Bản cập nhật V${payload.version}`,
      changelog: Array.isArray(payload.changelog)
        ? payload.changelog
        : [payload.description || "Cập nhật bài học và cải tiến hệ thống"],
      hasUpdate: true,
      downloadUrl: payload.downloadUrl || "",
    };
    return activeRelease;
  }

  async function applyPatchFromData(patchData) {
    if (!patchData || typeof patchData !== "object") {
      throw new Error("Gói cập nhật không hợp lệ.");
    }
    const { version, files, title } = patchData;
    const appliedFiles = [];

    if (Array.isArray(files) && files.length > 0) {
      for (const item of files) {
        if (!item.path || typeof item.content !== "string") continue;
        const targetPath = resolve(rootDir, item.path);
        if (!targetPath.startsWith(rootDir)) continue;
        
        await mkdir(dirname(targetPath), { recursive: true });
        const buffer = item.encoding === "base64" 
          ? Buffer.from(item.content, "base64")
          : Buffer.from(item.content, "utf8");
        await writeFile(targetPath, buffer);
        appliedFiles.push(item.path);
      }
    }

    // Always update package.json version if a version is provided
    const targetVersion = version || (patchData.latestVersion);
    if (targetVersion) {
      try {
        const pkgPath = join(rootDir, "package.json");
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
          // Only update if the new version is >= current
          const cv = compareVersions(targetVersion, pkg.version || "0");
          if (cv >= 0) {
            pkg.version = targetVersion;
            await writeFile(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
            // Also update activeRelease so subsequent status calls reflect the new version
            activeRelease = { ...activeRelease, version: targetVersion, hasUpdate: false };
          }
        }
      } catch {}
    }

    return {
      ok: true,
      updatedVersion: targetVersion || activeRelease.version,
      appliedCount: appliedFiles.length,
      files: appliedFiles,
      message: `Đã cập nhật thành công${appliedFiles.length > 0 ? ` ${appliedFiles.length} tệp` : ""} lên phiên bản ${targetVersion || ""}.`,
    };
  }


  async function createPatchBundle({ version, filesToInclude = [], changelog = [] } = {}) {
    const targetFiles = [];
    const scanDirs = filesToInclude.length > 0 ? filesToInclude : ["content", "public", "server"];

    for (const sub of scanDirs) {
      const full = join(rootDir, sub);
      if (!existsSync(full)) continue;
      const fileList = await listAllFiles(full);
      for (const f of fileList) {
        const rel = relative(rootDir, f).replace(/\\/g, "/");
        const statInfo = await stat(f);
        if (statInfo.size > 5 * 1024 * 1024) continue;
        
        const isText = /\.(js|mjs|json|html|css|txt|md|svg)$/i.test(f);
        const buf = await readFile(f);
        targetFiles.push({
          path: rel,
          content: isText ? buf.toString("utf8") : buf.toString("base64"),
          encoding: isText ? "utf8" : "base64",
          size: statInfo.size,
        });
      }
    }

    return {
      format: "milo-patch-v1",
      version: version || "60.25.0",
      createdAt: new Date().toISOString(),
      changelog: changelog.length > 0 ? changelog : ["Cập nhật bài học và dữ liệu mới nhất"],
      filesCount: targetFiles.length,
      files: targetFiles,
    };
  }

  async function applyRemotePatch(url) {
    if (!url) throw new Error("URL cập nhật không hợp lệ.");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không thể tải gói cập nhật từ máy chủ (HTTP ${res.status}).`);
    const patchData = await res.json();
    return applyPatchFromData(patchData);
  }

  return {
    getStatus,
    setLatestRelease,
    applyPatchFromData,
    applyRemotePatch,
    createPatchBundle,
    checkContentReady,
  };
}

async function listAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listAllFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

function compareVersions(v1, v2) {
  const parse = (v) => String(v || "0.0.0").replace(/^v/i, "").split(/[-+.]/).map((n) => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
