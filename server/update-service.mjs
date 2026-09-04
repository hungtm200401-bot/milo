import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync, readFileSync, createReadStream, createWriteStream } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { execSync } from "node:child_process";
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
  version: "60.25.18",
  releaseDate: new Date().toISOString(),
  title: "Bản nâng cấp V60.25.18",
  changelog: [
    "• Cập nhật và tối ưu hóa hệ thống"
  ],
  hasUpdate: true,
};

// Try to load persisted release state on module load
try {
  const relPath = join(root, "data", "latest-release.json");
  if (existsSync(relPath)) {
    const saved = JSON.parse(readFileSync(relPath, "utf8"));
    if (saved && saved.version) {
      activeRelease = saved;
    }
  }
} catch {}

const DEFAULT_REMOTE_RELEASE_URL = process.env.MILO_REMOTE_UPDATE_URL || "";

export function createUpdateService({ rootDir = root } = {}) {
  async function getStatus() {
    let currentVersion = "60.25.10";
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

    const isNewer = compareVersions(activeRelease.version, currentVersion) > 0 || activeRelease.hasUpdate;
    const contentReady = checkContentReady(rootDir);

    return {
      currentVersion,
      latestVersion: activeRelease.version,
      hasUpdate: Boolean(isNewer),
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
    const newVer = payload.version || activeRelease.version;
    activeRelease = {
      version: newVer,
      releaseDate: new Date().toISOString(),
      title: payload.title || `Bản nâng cấp V${newVer}`,
      changelog: Array.isArray(payload.changelog)
        ? payload.changelog
        : [payload.description || "Cập nhật bài học và cải tiến hệ thống"],
      hasUpdate: true,
      downloadUrl: payload.downloadUrl || "",
    };

    // Save to data/latest-release.json so it persists
    try {
      const dataDir = join(rootDir, "data");
      await mkdir(dataDir, { recursive: true });
      await writeFile(join(dataDir, "latest-release.json"), JSON.stringify(activeRelease, null, 2), "utf8");
    } catch {}

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
  function getPendingChanges() {
    try {
      const output = execSync("git status --porcelain", { cwd: rootDir, encoding: "utf8" });
      const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);
      const changes = [];
      const changelog = [];

      for (const line of lines) {
        const file = line.replace(/^[A-Z?\s]+\s+/, "").trim();
        if (file.includes("data/backups/") || file.includes("reports/") || file.endsWith(".log") || (file.endsWith(".json") && file.includes("TASK_UNIQUENESS")) || file.includes("latest-release.json")) {
          continue;
        }
        changes.push(file);
        
        const lower = file.toLowerCase();
        const basename = file.split(/[/\\]/).pop();

        if (lower.includes("update-manager")) {
          changelog.push(`• Cập nhật tệp ${basename}: Tự động quét tệp vừa sửa và phát tín hiệu 1-Click.`);
        } else if (lower.includes("update-client")) {
          changelog.push(`• Cập nhật tệp ${basename}: Tự động hiển thị thông báo bản mới trên App Học Viên.`);
        } else if (lower.includes("admin-ai-connection")) {
          changelog.push(`• Cập nhật tệp ${basename}: Kiểm tra kết nối và đo độ trễ AI real-time.`);
        } else if (lower.includes("admin-vip-pro-max") || lower.includes("admin.html")) {
          changelog.push(`• Cập nhật tệp ${basename}: Loại bỏ nhãn PRO MAX và tối ưu cỡ chữ 12px-14px.`);
        } else if (lower.includes("server.mjs")) {
          changelog.push(`• Cập nhật tệp ${basename}: Tối ưu máy chủ và quyền phát hành mượt mà.`);
        } else if (lower.includes("update-service.mjs")) {
          changelog.push(`• Cập nhật tệp ${basename}: Quản lý lưu trữ phiên bản và quét tệp sửa đổi.`);
        } else if (lower.includes("package.json")) {
          changelog.push(`• Cập nhật tệp ${basename}: Cập nhật số phiên bản ứng dụng.`);
        } else if (lower.includes("changelog.md")) {
          changelog.push(`• Cập nhật tệp ${basename}: Ghi nhật ký thay đổi hệ thống.`);
        } else if (lower.includes("run-all.mjs")) {
          changelog.push(`• Cập nhật tệp ${basename}: Cải tiến và tối ưu logic mã nguồn kiểm thử.`);
        } else if (lower.startsWith("content/") || lower.includes("/content/") || lower.includes("flashcard")) {
          changelog.push(`• Cập nhật bài học tệp ${basename}: Cập nhật nội dung dữ liệu bài học.`);
        } else {
          changelog.push(`• Cập nhật tệp ${basename}: Tối ưu mã nguồn và cấu hình.`);
        }
      }

      const uniqueChangelog = Array.from(new Set(changelog));

      return {
        count: changes.length,
        files: changes,
        changelog: uniqueChangelog,
      };
    } catch {
      return {
        count: 0,
        files: [],
        changelog: [],
      };
    }
  }

  return {
    getStatus,
    setLatestRelease,
    getPendingChanges,
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
