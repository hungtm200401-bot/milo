// Admin Update Manager Script - Live Change Detector & 1-Click Release Edition V60.25.8
(function () {
  "use strict";

  const PASSWORD_KEY = "milo-admin-password-v1";
  function getAdminSecret() {
    return (
      sessionStorage.getItem(PASSWORD_KEY) ||
      localStorage.getItem(PASSWORD_KEY) ||
      localStorage.getItem("milo_admin_secret") ||
      localStorage.getItem("milo_admin_password") ||
      localStorage.getItem("milo-admin-token") ||
      window.MILO_ADMIN_SECRET ||
      ""
    );
  }

  let latestKnownVersion = "60.25.8";
  let detectedChangesCount = 0;

  function parseSemver(v) {
    const parts = String(v || "60.25.8").replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
    return [parts[0] || 60, parts[1] || 25, parts[2] || 0];
  }

  function getNextPatchVersion(v) {
    const [maj, min, pat] = parseSemver(v);
    return `${maj}.${min}.${pat + 1}`;
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

  function validateReleaseButton() {
    const versionInput = document.getElementById("adminNewVersion");
    const changelogArea = document.getElementById("adminReleaseChangelog");
    const pushBtn = document.getElementById("adminPushReleaseBtn");
    const pushStatus = document.getElementById("adminPushStatus");
    if (!versionInput || !pushBtn) return;

    const currentInputVersion = versionInput.value.trim();
    const isNewer = compareVersions(currentInputVersion, latestKnownVersion) > 0;

    if (!isNewer) {
      const nextVer = getNextPatchVersion(latestKnownVersion);
      versionInput.value = nextVer;
    }

    const activeVersion = versionInput.value.trim();
    const hasPendingChanges = detectedChangesCount > 0;
    const isManualEdited = Boolean(
      (versionInput && versionInput.dataset.userEdited) ||
      (changelogArea && changelogArea.dataset.userEdited)
    );
    const canRelease = hasPendingChanges || isManualEdited;

    if (canRelease) {
      pushBtn.disabled = false;
      pushBtn.style.opacity = "1";
      pushBtn.style.cursor = "pointer";
      pushBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
      pushBtn.style.boxShadow = "0 6px 20px rgba(16,185,129,0.3)";

      if (detectedChangesCount > 0) {
        pushBtn.innerHTML = `⚡ 1-Click Phát Hành Bản V${activeVersion} (${detectedChangesCount} Tệp Vừa Sửa)`;
      } else {
        pushBtn.innerHTML = `⚡ 1-Click Phát Hành Bản Mới V${activeVersion}`;
      }

      if (pushStatus && !pushStatus.dataset.hasCustomStatus) {
        if (detectedChangesCount > 0) {
          pushStatus.innerHTML = `<div style="padding: 10px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; color: #047857; font-size: 13px; font-weight: 700;">
            🟢 Tự động phát hiện <b>${detectedChangesCount} tệp vừa chỉnh sửa</b>. Bấm 1-Click để bắn ngay bản V${activeVersion} cho toàn bộ học sinh!
          </div>`;
        } else {
          pushStatus.innerHTML = `<div style="padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1d4ed8; font-size: 12px;">
            ✨ Bạn đã tùy chỉnh thông tin phát hành. Đang sẵn sàng bắn bản nâng cấp <b>V${activeVersion}</b>.
          </div>`;
        }
      }
    } else {
      pushBtn.disabled = true;
      pushBtn.style.opacity = "0.55";
      pushBtn.style.cursor = "not-allowed";
      pushBtn.style.background = "#94a3b8";
      pushBtn.style.boxShadow = "none";
      pushBtn.innerHTML = `🔒 Chưa Có Cập Nhật Mới (Bản V${latestKnownVersion} Đã Mới Nhất)`;

      if (pushStatus && !pushStatus.dataset.hasCustomStatus) {
        pushStatus.innerHTML = `<div style="padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; color: #64748b; font-size: 13px; font-weight: 600;">
          ✨ Mã nguồn đã ở bản mới nhất <b>V${latestKnownVersion}</b>. Khi bạn chỉnh sửa code hoặc bài học, nút phát hành sẽ tự động bật xanh!
        </div>`;
      }
    }
  }

  function updateLivePreview() {
    const versionInput = document.getElementById("adminNewVersion");
    const titleInput = document.getElementById("adminReleaseTitle");
    const changelogArea = document.getElementById("adminReleaseChangelog");

    const ver = versionInput?.value.trim() || getNextPatchVersion(latestKnownVersion);
    const tit = titleInput?.value.trim() || `Bản nâng cấp V${ver}`;
    const cl = (changelogArea?.value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const prevVer = document.getElementById("previewVersionTag");
    const prevTitle = document.getElementById("previewTitleText");
    const prevList = document.getElementById("previewChangelogList");

    if (prevVer) prevVer.textContent = `V${ver}`;
    if (prevTitle) prevTitle.textContent = tit;
    if (prevList) {
      if (cl.length === 0) {
        prevList.innerHTML = `<li>• Nâng cấp và tối ưu hóa hệ thống</li>`;
      } else {
        prevList.innerHTML = cl.map((item) => `<li>${item.startsWith("•") ? item : "• " + item}</li>`).join("");
      }
    }
  }

  async function checkPendingChanges() {
    try {
      const res = await fetch("/api/update/pending-changes", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const changelogArea = document.getElementById("adminReleaseChangelog");
      
      if (typeof data.count === "number") {
        detectedChangesCount = data.count;
      }
      
      if (Array.isArray(data.changelog) && data.changelog.length > 0 && changelogArea && !changelogArea.dataset.userEdited) {
        changelogArea.value = data.changelog.join("\n");
      }
      validateReleaseButton();
      updateLivePreview();
    } catch {}
  }

  async function loadCurrentStatus() {
    try {
      const res = await fetch("/api/update/status", { cache: "no-store" });
      if (!res.ok) return;
      const status = await res.json();
      const versionInput = document.getElementById("adminNewVersion");
      const titleInput = document.getElementById("adminReleaseTitle");
      const heroVersion = document.getElementById("heroCurrentVersion");
      const heroTitle = document.getElementById("heroReleaseTitle");

      if (status.latestVersion) {
        latestKnownVersion = status.latestVersion;
        if (heroVersion) heroVersion.textContent = `V${status.latestVersion}`;
      }
      if (status.title && heroTitle) {
        heroTitle.textContent = status.title;
      }

      const nextCandidate = getNextPatchVersion(latestKnownVersion);

      if (versionInput && !versionInput.dataset.userEdited) {
        versionInput.value = nextCandidate;
      }
      if (titleInput && !titleInput.dataset.userEdited) {
        titleInput.value = `Bản nâng cấp V${versionInput?.value || nextCandidate}`;
      }

      await checkPendingChanges();
    } catch {}
  }

  function init() {
    const pushBtn = document.getElementById("adminPushReleaseBtn");
    const exportBtn = document.getElementById("adminExportPatchBtn");
    const pushStatus = document.getElementById("adminPushStatus");
    const versionInput = document.getElementById("adminNewVersion");
    const titleInput = document.getElementById("adminReleaseTitle");
    const changelogArea = document.getElementById("adminReleaseChangelog");

    // Smart version bumpers
    document.getElementById("btnBumpPatch")?.addEventListener("click", () => {
      const [maj, min, pat] = parseSemver(versionInput?.value || latestKnownVersion);
      if (versionInput) {
        versionInput.value = `${maj}.${min}.${pat + 1}`;
        versionInput.dataset.userEdited = "1";
        if (pushStatus) delete pushStatus.dataset.hasCustomStatus;
        validateReleaseButton();
        updateLivePreview();
      }
    });

    document.getElementById("btnBumpMinor")?.addEventListener("click", () => {
      const [maj, min] = parseSemver(versionInput?.value || latestKnownVersion);
      if (versionInput) {
        versionInput.value = `${maj}.${min + 1}.0`;
        versionInput.dataset.userEdited = "1";
        if (pushStatus) delete pushStatus.dataset.hasCustomStatus;
        validateReleaseButton();
        updateLivePreview();
      }
    });

    // Quick changelog chips
    document.querySelectorAll("[data-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const text = chip.dataset.chip || chip.textContent.trim();
        if (changelogArea) {
          changelogArea.dataset.userEdited = "1";
          const current = changelogArea.value.trim();
          changelogArea.value = current ? `${current}\n${text}` : text;
          updateLivePreview();
        }
      });
    });

    versionInput?.addEventListener("input", () => {
      versionInput.dataset.userEdited = "1";
      if (pushStatus) delete pushStatus.dataset.hasCustomStatus;
      validateReleaseButton();
      updateLivePreview();
    });

    titleInput?.addEventListener("input", () => {
      titleInput.dataset.userEdited = "1";
      updateLivePreview();
    });

    changelogArea?.addEventListener("input", () => {
      changelogArea.dataset.userEdited = "1";
      updateLivePreview();
    });

    loadCurrentStatus();

    pushBtn?.addEventListener("click", async () => {
      let version = versionInput?.value.trim() || getNextPatchVersion(latestKnownVersion);
      const title = titleInput?.value.trim() || `Bản nâng cấp V${version}`;
      const changelogText = changelogArea?.value.trim() || "";
      const changelog = changelogText.split("\n").map((s) => s.trim()).filter(Boolean);

      if (compareVersions(version, latestKnownVersion) <= 0) {
        version = getNextPatchVersion(latestKnownVersion);
        if (versionInput) versionInput.value = version;
      }

      if (pushStatus) {
        pushStatus.dataset.hasCustomStatus = "1";
        pushStatus.style.color = "#3b82f6";
        pushStatus.innerHTML = `<div style="padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;">
          <span class="pulse-dot" style="background:#3b82f6;"></span>
          <b>⚡ Đang 1-Click phát hành bản mới V${version} tới toàn bộ máy học sinh...</b>
        </div>`;
      }

      pushBtn.disabled = true;
      pushBtn.style.opacity = "0.6";

      try {
        let secret = getAdminSecret();
        let url = secret ? `/api/update/publish?adminSecret=${encodeURIComponent(secret)}` : "/api/update/publish";
        let res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Milo-Admin": secret,
            "Authorization": `Bearer ${secret}`,
          },
          body: JSON.stringify({ version, title, changelog }),
        });
        let data = await res.json();

        if (!res.ok || !data.ok) {
          if (res.status === 401 || data.error === "UNAUTHORIZED_ADMIN") {
            const userPass = prompt("Vui lòng nhập mật khẩu quản trị để phát hành cập nhật:");
            if (userPass) {
              sessionStorage.setItem(PASSWORD_KEY, userPass.trim());
              localStorage.setItem(PASSWORD_KEY, userPass.trim());
              secret = userPass.trim();
              url = `/api/update/publish?adminSecret=${encodeURIComponent(secret)}`;
              const retryRes = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Milo-Admin": secret,
                  "Authorization": `Bearer ${secret}`,
                },
                body: JSON.stringify({ version, title, changelog }),
              });
              data = await retryRes.json();
              if (!retryRes.ok || !data.ok) {
                throw new Error(data.message || data.error || "Mật khẩu không đúng.");
              }
            } else {
              throw new Error("Cần mật khẩu quản trị để thực hiện phát hành.");
            }
          } else {
            throw new Error(data.error || data.message || "Không thể phát hành bản mới.");
          }
        }

        latestKnownVersion = version;
        detectedChangesCount = 0;

        // Broadcast real-time update signal to all open student app instances!
        try {
          const updateChannel = new BroadcastChannel("milo_app_updates");
          updateChannel.postMessage({ type: "MILO_NEW_UPDATE", version, releaseDate: data.release?.releaseDate });
        } catch {}
        localStorage.setItem("milo_last_published_timestamp", String(Date.now()));
        localStorage.setItem("milo_update_trigger", String(Date.now()));

        const heroVersion = document.getElementById("heroCurrentVersion");
        const heroTitle = document.getElementById("heroReleaseTitle");
        if (heroVersion) heroVersion.textContent = `V${version}`;
        if (heroTitle) heroTitle.textContent = title;

        const nextAutoVersion = getNextPatchVersion(version);
        if (versionInput) {
          versionInput.value = nextAutoVersion;
          delete versionInput.dataset.userEdited;
        }
        if (titleInput) {
          titleInput.value = `Bản nâng cấp V${nextAutoVersion} (Cập nhật bài học & giao diện mới)`;
          delete titleInput.dataset.userEdited;
        }
        if (changelogArea) {
          delete changelogArea.dataset.userEdited;
        }

        validateReleaseButton();
        updateLivePreview();

        if (pushStatus) {
          pushStatus.dataset.hasCustomStatus = "1";
          pushStatus.innerHTML = `<div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 16px;border-radius:12px;text-align:left;box-shadow:0 4px 12px rgba(16,185,129,0.1);margin-top:10px;">
            <div style="font-size:14px;font-weight:850;color:#065f46;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
              <span>✅</span> ĐÃ 1-CLICK PHÁT HÀNH BẢN V${version} THÀNH CÔNG RỰC RỠ!
            </div>
            <p style="margin:0;font-size:12px;color:#047857;line-height:1.5;">
              Toàn bộ app học sinh chạy trên các máy Windows sẽ thấy thông báo nâng cấp ngay lập tức. Hệ thống đã tự chuẩn bị sẵn bản <b>V${nextAutoVersion}</b> cho lần 1-Click tiếp theo của bạn.
            </p>
          </div>`;
        }
      } catch (err) {
        validateReleaseButton();
        if (pushStatus) {
          pushStatus.dataset.hasCustomStatus = "1";
          pushStatus.innerHTML = `<div style="padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-weight:700;margin-top:10px;">
            ❌ Lỗi phát hành: ${err.message}
          </div>`;
        }
      }
    });

    exportBtn?.addEventListener("click", async () => {
      exportBtn.innerText = "⏳ Đang đóng gói tệp .milo...";
      try {
        const secret = getAdminSecret();
        const version = document.getElementById("adminNewVersion")?.value.trim() || latestKnownVersion;
        const url = secret ? `/api/update/export-patch?adminSecret=${encodeURIComponent(secret)}` : "/api/update/export-patch";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Milo-Admin": secret,
            "Authorization": `Bearer ${secret}`,
          },
          body: JSON.stringify({ version }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || data.message || "Lỗi tạo gói");

        const blob = new Blob([JSON.stringify(data.patch, null, 2)], { type: "application/json" });
        const urlBlob = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = urlBlob;
        a.download = `Milo_Patch_V${version}.milo`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(urlBlob);
        exportBtn.innerText = "✅ Đã Tải Gói .milo Thành Công!";
        setTimeout(() => { exportBtn.innerText = "📥 Tải Tệp Gói Cập Nhật (.milo)"; }, 2500);
      } catch (err) {
        alert("Lỗi xuất gói: " + err.message);
        exportBtn.innerText = "📥 Tải Tệp Gói Cập Nhật (.milo)";
      }
    });

    window.MILO_ADMIN_UPDATE_MANAGER = { loadCurrentStatus, checkPendingChanges, init, updateLivePreview, validateReleaseButton };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
