import { test } from "node:test";
import assert from "node:assert/strict";
import { createUpdateService } from "../server/update-service.mjs";
import { appRoot } from "../server/paths.mjs";

test("update-service reports initial status correctly", async () => {
  const service = createUpdateService({ rootDir: appRoot });
  const status = await service.getStatus();
  assert.ok(status.currentVersion);
  assert.equal(typeof status.hasUpdate, "boolean");
});

test("update-service detects newer version when published", async () => {
  const service = createUpdateService({ rootDir: appRoot });
  await service.setLatestRelease({
    version: "60.30.0",
    title: "Bản nâng cấp VIP PRO MAX",
    changelog: ["Thêm bài học mới"],
  });
  const status = await service.getStatus();
  assert.equal(status.latestVersion, "60.30.0");
  assert.equal(status.hasUpdate, true);
});

test("update-service creates valid patch bundle", async () => {
  const service = createUpdateService({ rootDir: appRoot });
  const patch = await service.createPatchBundle({
    version: "60.25.0",
    filesToInclude: ["server"],
  });
  assert.equal(patch.format, "milo-patch-v1");
  assert.equal(patch.version, "60.25.0");
  assert.ok(patch.filesCount > 0);
});
