import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
export const serverDir = currentDir;
export const appRoot = resolve(process.env.MILO_APP_ROOT || join(currentDir, ".."));

export const publicDir = join(appRoot, "public");
export const contentDir = join(appRoot, "content");
export const assetsDir = join(appRoot, "assets");
export const dataDir = join(appRoot, "data");
export const logsDir = join(appRoot, "logs");
export const envPath = join(appRoot, ".env");
export const desktopRuntimeDir = join(appRoot, "desktop-runtime");
export const internalRuntimeDir = join(appRoot, "RUNTIME_NOI_BO");

export function resolveResourcePath(relativeName) {
  return join(appRoot, relativeName);
}
