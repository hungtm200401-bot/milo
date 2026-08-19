import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createCommerceApi } from "./commerce-server.mjs";
import { createUpdateService } from "./update-service.mjs";
import { buildTutorPrompt, difficultyOf } from "./tutor-prompt.mjs";
import { normalizeTutorResponse } from "./tutor-response.mjs";
import { appRoot, envPath } from "./paths.mjs";

const root = appRoot;
const envFile = envPath;
const updateService = createUpdateService({ rootDir: root });
const appRuntime = Object.freeze({
  name: "milo-english-adventure",
  version: "60.24.4",
  build: "V60.24.4-ADMIN-EXACT-NAV-REAL-DATA",
  launcher: "windows-native-app",
  contentVersion: "60.25.7-fix-launch",
});
const tutorModel = ["gem", "ini-3.1-flash-lite"].join("");
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".gif":"image/gif", ".svg":"image/svg+xml", ".ico":"image/x-icon" };
function env() { const out = {}; if (!existsSync(envFile)) return out; for (const line of requireText(envFile).split(/\r?\n/)) { const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (match && !match[1].startsWith("#")) out[match[1]] = match[2].replace(/^['"]|['"]$/g, ""); } return out; }
function requireText(path) { try { return readFileSync(path, "utf8"); } catch { return ""; } }
function config() {
  const e = env();
  return {
    apiKey: process.env.MILO_AI_API_KEY || e.MILO_AI_API_KEY || "",
    model: tutorModel,
    adminPassword:
      process.env.MILO_ADMIN_PASSWORD ||
      e.MILO_ADMIN_PASSWORD ||
      "",
    bankName: process.env.MILO_BANK_NAME || e.MILO_BANK_NAME || "",
    bankQrImage:
      process.env.MILO_BANK_QR_IMAGE || e.MILO_BANK_QR_IMAGE || "",
    bankAccountLabel:
      process.env.MILO_BANK_ACCOUNT_NAME ||
      e.MILO_BANK_ACCOUNT_NAME ||
      process.env.MILO_BANK_ACCOUNT_LABEL ||
      e.MILO_BANK_ACCOUNT_LABEL ||
      "",
    bankAccountNumber:
      process.env.MILO_BANK_ACCOUNT_NUMBER ||
      e.MILO_BANK_ACCOUNT_NUMBER ||
      "",
    databaseDirectory: process.env.MILO_DATABASE_DIR || e.MILO_DATABASE_DIR || "",
  };
}
function maskSecret(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const tail = text.slice(-4);
  return `${"•".repeat(Math.min(8, Math.max(4, text.length - 4)))}${tail}`;
}
function configurationStatus(cfg = config()) {
  const source = String(cfg.bankQrImage || "").trim();
  const suffixes = ["", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
  const qrExists = source
    ? suffixes.some((suffix) => {
        const file = suffix ? `${source}${suffix}` : source;
        return (
          existsSync(join(root, file)) ||
          existsSync(join(root, "src", "assets", file)) ||
          existsSync(join(root, "public", file))
        );
      })
    : false;
  return {
    aiConfigured: Boolean(cfg.apiKey),
    paymentConfigured: Boolean(
      cfg.bankName && cfg.bankAccountLabel && cfg.bankAccountNumber
    ),
    adminConfigured: Boolean(cfg.adminPassword),
  };
}
function adminConnectionStatus(cfg = config()) {
  const status = configurationStatus(cfg);
  const lastCheck = lastAiConnectionCheck || null;
  return {
    provider: "Google Gemini",
    configured: status.aiConfigured,
    aiConfigured: status.aiConfigured,
    aiConfiguredLabel: status.aiConfigured ? "Đã cấu hình" : "Chưa cấu hình",
    paymentConfigured: status.paymentConfigured,
    paymentConfiguredLabel: status.paymentConfigured ? "Đã cấu hình" : "Chưa cấu hình",
    adminConfigured: status.adminConfigured,
    adminConfiguredLabel: status.adminConfigured ? "Đã cấu hình" : "Chưa cấu hình",
    checkedAt: lastCheck?.checkedAt || "",
    ok: lastCheck ? Boolean(lastCheck.ok) : null,
    connectionLabel: lastCheck ? (lastCheck.ok ? "Kết nối thành công" : "Kết nối thất bại") : "Chưa kiểm tra",
    serviceLabel: status.aiConfigured ? (lastCheck?.ok ? "Hoạt động bình thường" : "Chờ kiểm tra thực tế") : "Chưa thể hoạt động",
  };
}
function sanitizeHeader(value) {
  return String(value || "")
    .trim()
    .replace(/^bearer\s+/i, "");
}
function getProvidedAdminSecret(req) {
  const querySecret = new URL(req.url, "http://localhost").searchParams.get(
    "adminSecret"
  );
  if (querySecret) return querySecret.trim();
  const authHeader = sanitizeHeader(req.headers.authorization);
  if (authHeader) return authHeader;
  const customHeader =
    req.headers["x-milo-admin"] || req.headers["x-milo-admin-secret"];
  if (customHeader) return String(customHeader).trim();
  return "";
}
function isAuthorizedAdminRequest(req, cfg = config()) {
  const expectedSecret = String(cfg.adminPassword || "").trim();
  if (!expectedSecret) return false;
  const providedSecret = getProvidedAdminSecret(req);
  if (!providedSecret) return false;
  const expectedBuffer = Buffer.from(expectedSecret);
  const providedBuffer = Buffer.from(providedSecret);
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}
function requireAdminConnectionAccess(req, res, cfg = config()) {
  if (!isAuthorizedAdminRequest(req, cfg)) {
    json(res, 401, {
      ...adminConnectionStatus(cfg),
      ok: false,
      error: "UNAUTHORIZED_ADMIN",
      message: "Vui lòng nhập đúng mật khẩu quản trị.",
    });
    return false;
  }
  return true;
}
let lastAiConnectionCheck = null;
async function testAiConnection(cfg = config()) {
  if (!cfg.apiKey) {
    const error = new Error("Thiếu GEMINI_API_KEY");
    error.status = 400;
    throw error;
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${tutorModel}:generateContent?key=${cfg.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Ping connection test. Reply with exact JSON: {\"status\":\"ok\"}",
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`AI HTTP ${response.status}: ${detail.slice(0, 180)}`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  const outputText =
    payload?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const checkedAt = new Date().toISOString();
  return { checkedAt, rawResponse: outputText };
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const commerce = createCommerceApi({
  root,
  json,
  readBody,
  databaseDirectory: config().databaseDirectory,
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const cfg = config();
    if (url.pathname === "/api/health" && req.method === "GET") {
      return json(res, 200, {
        status: "ok",
        version: appRuntime.version,
        build: appRuntime.build,
        server: "online",
        database: "online",
        frontend: "online",
        timestamp: new Date().toISOString(),
      });
    }
    if (url.pathname === "/api/runtime" && req.method === "GET") {
      return json(res, 200, appRuntime);
    }
    if (url.pathname === "/api/update/status" && req.method === "GET") {
      const status = await updateService.getStatus();
      return json(res, 200, status);
    }
    if (url.pathname === "/api/update/publish" && req.method === "POST") {
      if (!requireAdminConnectionAccess(req, res, cfg)) return;
      const body = await readBody(req);
      const result = await updateService.setLatestRelease(body);
      return json(res, 200, { ok: true, release: result });
    }
    if (url.pathname === "/api/update/export-patch" && req.method === "POST") {
      if (!requireAdminConnectionAccess(req, res, cfg)) return;
      const body = await readBody(req);
      const patch = await updateService.createPatchBundle(body);
      return json(res, 200, { ok: true, patch });
    }
    if (url.pathname === "/api/update/apply" && req.method === "POST") {
      const body = await readBody(req);
      try {
        let result;
        if (body.url || body.downloadUrl) {
          result = await updateService.applyRemotePatch(body.url || body.downloadUrl);
        } else {
          result = await updateService.applyPatchFromData(body.patch || body);
        }
        return json(res, 200, result);
      } catch (err) {
        return json(res, 400, { ok: false, error: err.message || "Lỗi khi áp dụng bản cập nhật" });
      }
    }
    if (url.pathname === "/api/config/status" && req.method === "GET") {
      if (!requireAdminConnectionAccess(req, res, cfg)) return;
      return json(res, 200, adminConnectionStatus(cfg));
    }
    if (url.pathname === "/api/config/test-ai" && req.method === "POST") {
      if (!requireAdminConnectionAccess(req, res, cfg)) return;
      try {
        const result = await testAiConnection(cfg);
        lastAiConnectionCheck = Object.freeze({ checkedAt: result.checkedAt, ok: true });
        return json(res, 200, { ...adminConnectionStatus(cfg), ok: true });
      } catch (error) {
        const checkedAt = new Date().toISOString();
        lastAiConnectionCheck = Object.freeze({ checkedAt, ok: false });
        console.error(`[admin-ai-check ${checkedAt}]`, error?.stack || error?.message || error);
        return json(res, Number(error.status) || 502, {
          ...adminConnectionStatus(cfg),
          ok: false,
          message: "Kết nối thất bại. Xem log quản trị để biết chi tiết.",
        });
      }
    }
    if (url.pathname === "/api/tutor" && req.method === "GET") {
      const access = await commerce.authorize(req);
      return json(res, 200, {
        tutorModel: cfg.model,
        difficulty: difficultyOf("guided-step"),
        systemInstructions: buildTutorPrompt({ difficulty: "guided-step" }),
        accessLevel: access.aiAccess.accessLevel,
      });
    }
    if (url.pathname === "/api/tutor" && req.method === "POST") {
      const access = await commerce.authorize(req);
      if (!access.aiAccess.allowed) {
        return json(res, 403, {
          error: "PAYWALL_UPGRADE_REQUIRED",
          accessLevel: access.aiAccess.accessLevel,
          message: access.aiAccess.reason,
        });
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const input = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const prompt = buildTutorPrompt(input);
      if (!cfg.apiKey) {
        const fallback = normalizeTutorResponse(
          JSON.stringify({
            assessment: "Milo nhận được bài rồi!",
            bilingualSpeech: "Con làm tốt lắm. Hãy tiếp tục luyện tập nhé!",
            speechRate: 0.9,
            actions: ["Try Again", "Next Step"],
          })
        );
        return json(res, 200, {
          ...fallback,
          difficulty: difficultyOf(fallback.skill || input.difficulty),
          accessLevel: access.aiAccess.accessLevel,
        });
      }
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          }),
        }
      );
      if (!response.ok) {
        return json(res, 502, {
          error: "AI_SERVICE_UNAVAILABLE",
          accessLevel: access.aiAccess.accessLevel,
        });
      }
      const payload = await response.json();
      const rawText =
        payload?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const result = normalizeTutorResponse(rawText);
      return json(res, 200, {
        ...result,
        difficulty: difficultyOf(result.skill || input.difficulty),
        accessLevel: access.aiAccess.accessLevel,
      });
    }
    if (await commerce.handle(req, res, url, cfg)) return;

    const staticPath = url.pathname.toLowerCase();
    const privatePath =
      staticPath.split("/").some((segment) => segment.startsWith(".")) ||
      staticPath.startsWith("/data/") ||
      staticPath.startsWith("/desktop-runtime/") ||
      staticPath.startsWith("/node_modules/") ||
      staticPath.endsWith(".mjs") ||
      staticPath.endsWith(".txt") ||
      staticPath.endsWith(".bat") ||
      staticPath.endsWith(".cmd") ||
      staticPath.endsWith(".ps1") ||
      staticPath.endsWith(".exe") ||
      staticPath === "/package.json" ||
      staticPath === "/package-lock.json";
    if (privatePath) return json(res, 404, { error: "Not found" });
    const requested = normalize(
      url.pathname === "/" ? "index.html" : url.pathname.replace(/^[\\/]+/, "")
    ).replace(/^([.][.][\\/])+/, "");
    const candidates = [
      join(root, requested),
      join(root, "public", requested),
      join(root, "content", requested),
      join(root, "src", requested),
      join(root, "src", "js", requested),
      join(root, "src", "css", requested),
      join(root, "src", "data", requested),
      join(root, "src", "assets", requested),
    ];
    let resolvedPath = null;
    for (const cand of candidates) {
      if (cand.toLowerCase().startsWith(root.toLowerCase()) && existsSync(cand) && !statSync(cand).isDirectory()) {
        resolvedPath = cand;
        break;
      }
    }
    if (!resolvedPath) return json(res, 404, { error: "Not found" });
    const file = await readFile(resolvedPath);
    const extension = extname(resolvedPath).toLowerCase();
    const alwaysFresh = new Set([".html", ".js", ".css", ".json", ".webmanifest"]);
    res.writeHead(200, {
      "Content-Type":
        mime[extension] || "application/octet-stream",
      "Cache-Control": alwaysFresh.has(extension)
        ? "no-store, no-cache, must-revalidate, max-age=0"
        : "public, max-age=86400",
      ...(alwaysFresh.has(extension) ? { Pragma: "no-cache", Expires: "0" } : {}),
    });
    res.end(file);
  } catch (error) {
    json(res, 404, { error: error.message || "Not found" });
  }
});
server.on("error", (err) => {
  console.error("SERVER ERROR:", err);
});
server.listen(8787,"127.0.0.1",()=>{
  const cfg=config();
  const status=configurationStatus(cfg);
  console.log("Milo Content V60.24.4 chạy tại http://127.0.0.1:8787");
  console.log(`Kiểm tra cấu hình: AI=${status.aiConfigured?"sẵn sàng":"offline"}; thanh toán=${status.paymentConfigured?"sẵn sàng":"chưa đủ"}; quản trị=${status.adminConfigured?"đã đặt mật khẩu":"cần cấu hình"}`);
});
const shutdown = () => { server.close(() => process.exit(0)); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
