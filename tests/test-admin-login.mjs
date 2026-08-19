import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

console.log("=== RUNNING ADMIN LOGIN TESTS ===");

// 1. Verify .env location & loading logic in paths.mjs & server.mjs
const pathsCode = readFileSync(join(root, "server", "paths.mjs"), "utf8");
assert.match(pathsCode, /export const envPath = join\(appRoot, "\.env"\)/);

const serverCode = readFileSync(join(root, "server", "server.mjs"), "utf8");
assert.match(serverCode, /import \{ appRoot, envPath \} from "\.\/paths\.mjs"/);
assert.match(serverCode, /const envFile = envPath/);

// 2. Verify requireAdmin error contract in commerce-server.mjs
const commerceCode = readFileSync(join(root, "server", "commerce-server.mjs"), "utf8");
assert.match(commerceCode, /ADMIN_PASSWORD_REQUIRED/);
assert.match(commerceCode, /INVALID_CREDENTIALS/);
assert.match(commerceCode, /req\.headers\["x-milo-admin"\]/);

// 3. Verify frontend admin JS error handling & DOM updates
const adminJsCode = readFileSync(join(root, "src", "js", "admin-vip-pro-max-v60-7.js"), "utf8");
assert.match(adminJsCode, /Không thể kết nối tới máy chủ/);
assert.match(adminJsCode, /Vui lòng nhập mật khẩu quản trị/);
assert.match(adminJsCode, /Đang đăng nhập…/);

console.log("PASS: Admin login source structure and error contracts verified.");
