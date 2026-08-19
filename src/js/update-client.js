// Milo Direct In-App Auto-Updater & Splash Asset Initializer
(function () {
  "use strict";

  let updateStatus = null;

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

  function updateHeaderBadges(status) {
    const topBtn = document.getElementById("topUpdateAppButton");
    if (topBtn) {
      if (status && status.hasUpdate) {
        topBtn.style.display = "inline-flex";
        topBtn.innerHTML = `<span>🔔</span><b>Cập nhật (V${status.latestVersion})</b>`;
      } else {
        topBtn.style.display = "none";
      }
    }

    const tutorBadge = document.getElementById("miloTopUpdateBadgeBtn");
    if (tutorBadge) {
      if (status && status.hasUpdate) {
        tutorBadge.style.display = "inline-flex";
        tutorBadge.innerHTML = `🔔 Cập nhật (V${status.latestVersion})`;
      } else {
        tutorBadge.style.display = "none";
      }
    }
  }

  async function initUpdater() {
    try {
      const res = await fetch("/api/update/status");
      if (!res.ok) return;
      updateStatus = await res.json();

      const appliedVer = localStorage.getItem("milo_applied_version") || localStorage.getItem("milo_last_updated_version");
      const latestVer = updateStatus?.latestVersion;
      const currentVer = updateStatus?.currentVersion;

      const hasApplied = appliedVer && compareVersions(appliedVer, latestVer) >= 0;
      const isUpToDate = !updateStatus.hasUpdate || hasApplied || compareVersions(currentVer, latestVer) >= 0;

      updateStatus.hasUpdate = !isUpToDate;
      updateHeaderBadges(updateStatus);

      // If initial content sync is needed
      if (updateStatus && updateStatus.contentReady === false) {
        showFirstLaunchSplash();
      } else if (updateStatus && updateStatus.hasUpdate) {
        const dismissed = sessionStorage.getItem("milo_dismissed_update_" + latestVer);
        if (!dismissed) {
          showUpdateNotification(updateStatus);
        }
      } else {
        const existingBanner = document.getElementById("milo-update-banner");
        if (existingBanner) existingBanner.remove();
      }
    } catch (err) {
      // Offline mode
    }
  }

  function showFirstLaunchSplash() {
    const splash = document.createElement("div");
    splash.id = "milo-splash-loader";
    splash.className = "milo-splash-screen";
    splash.innerHTML = `
      <div class="milo-splash-card">
        <div class="milo-splash-avatar-wrap">
          <img src="/pet-assets/levels/milo/lv-08-wave.webp" alt="Milo" class="milo-splash-avatar" />
        </div>
        <h2>Chào mừng bạn đến với Milo!</h2>
        <p class="milo-splash-sub">Đang hoàn tất nạp bài học Lớp 2–5 vào thiết bị của bạn...</p>
        <div class="milo-splash-progress-track">
          <div id="milo-splash-progress-bar" class="milo-splash-progress-fill"></div>
        </div>
        <div id="milo-splash-status-text" class="milo-splash-status">Đang chuẩn bị dữ liệu (0%)...</div>
      </div>
    `;

    document.body.appendChild(splash);

    let progress = 0;
    const bar = document.getElementById("milo-splash-progress-bar");
    const statusText = document.getElementById("milo-splash-status-text");

    const timer = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        if (bar) bar.style.width = "100%";
        if (statusText) statusText.innerText = "✅ Sẵn sàng! Đang vào thế giới bài học...";
        setTimeout(() => {
          splash.classList.add("fade-out");
          setTimeout(() => splash.remove(), 400);
        }, 800);
      } else {
        if (bar) bar.style.width = progress + "%";
        if (statusText) statusText.innerText = `Đang nạp dữ liệu bài học (${progress}%)...`;
      }
    }, 250);
  }

  function showUpdateNotification(info) {
    if (document.getElementById("milo-update-banner")) return;

    const banner = document.createElement("div");
    banner.id = "milo-update-banner";
    banner.className = "milo-update-banner";
    banner.innerHTML = `
      <div class="milo-update-content">
        <div class="milo-update-badge">CẬP NHẬT MỚI</div>
        <div class="milo-update-text">
          <strong>${info.title || "Có phiên bản bài học mới"}</strong>
          <span>(Phiên bản: ${info.latestVersion})</span>
        </div>
        <button id="milo-btn-update-now" class="milo-update-btn">🚀 Cập nhật ngay</button>
        <button id="milo-btn-update-close" class="milo-update-close" title="Đóng">&times;</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById("milo-btn-update-now")?.addEventListener("click", () => {
      openUpdateModal(info);
    });

    document.getElementById("milo-btn-update-close")?.addEventListener("click", () => {
      if (info?.latestVersion) {
        sessionStorage.setItem("milo_dismissed_update_" + info.latestVersion, "1");
      }
      banner.remove();
    });
  }

  function openUpdateModal(info) {
    const existing = document.getElementById("milo-update-modal");
    if (existing) existing.remove();

    const isUpToDate = !info.hasUpdate;
    const modal = document.createElement("div");
    modal.id = "milo-update-modal";
    modal.className = "milo-update-modal-backdrop";
    modal.innerHTML = `
      <div class="milo-update-modal-card">
        <div class="milo-modal-header">
          <h3>🎉 Cập Nhật Milo English Adventure</h3>
          <button id="milo-modal-close-btn" class="milo-modal-close">&times;</button>
        </div>
        <div class="milo-modal-body">
          <div class="milo-version-compare">
            <div class="ver-box current">
              <span class="lbl">Bản hiện tại</span>
              <strong>V${info.currentVersion}</strong>
            </div>
            <div class="ver-arrow">➔</div>
            <div class="ver-box new">
              <span class="lbl">Bản mới nhất</span>
              <strong>V${info.latestVersion}</strong>
            </div>
          </div>
          
          <div class="milo-changelog-box">
            <h4>Nội dung cập nhật:</h4>
            <ul>
              ${(info.changelog || ["Cải tiến bài học và bổ sung tính năng mới"]).map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>

          <div id="milo-patch-dropzone" class="milo-dropzone">
            <span>📁 Hoặc kéo thả tệp cập nhật <strong>.milo</strong> vào đây để nâng cấp</span>
            <input type="file" id="milo-file-input" accept=".milo,.json" style="display:none" />
            <button id="milo-choose-file-btn" class="milo-choose-btn">Chọn tệp cập nhật...</button>
          </div>

          <div id="milo-progress-container" class="milo-progress-container" style="display:none;">
            <div class="milo-progress-bar"><div id="milo-progress-fill" class="milo-progress-fill"></div></div>
            <div id="milo-progress-text" class="milo-progress-text">Đang cập nhật...</div>
          </div>
        </div>
        <div class="milo-modal-footer">
          <button id="milo-do-update-btn" class="milo-primary-btn">${isUpToDate ? "Đã Ở Bản Mới Nhất (Đồng Bộ Lại)" : "Cập Nhật Ngay Lập Tức"}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("milo-modal-close-btn")?.addEventListener("click", () => modal.remove());
    document.getElementById("milo-choose-file-btn")?.addEventListener("click", () => {
      document.getElementById("milo-file-input")?.click();
    });

    document.getElementById("milo-file-input")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handlePatchFile(file);
    });

    const dropzone = document.getElementById("milo-patch-dropzone");
    if (dropzone) {
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        const file = e.dataTransfer.files?.[0];
        if (file) handlePatchFile(file);
      });
    }

    document.getElementById("milo-do-update-btn")?.addEventListener("click", async () => {
      await performServerUpdate();
    });
  }

  async function handlePatchFile(file) {
    const progressContainer = document.getElementById("milo-progress-container");
    const progressFill = document.getElementById("milo-progress-fill");
    const progressText = document.getElementById("milo-progress-text");
    
    if (progressContainer) progressContainer.style.display = "block";
    if (progressFill) progressFill.style.width = "40%";
    if (progressText) progressText.innerText = `Đang đọc tệp ${file.name}...`;

    try {
      const text = await file.text();
      const patchData = JSON.parse(text);
      if (progressFill) progressFill.style.width = "75%";
      if (progressText) progressText.innerText = "Đang áp dụng bản cập nhật...";

      const res = await fetch("/api/update/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: patchData }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Không thể nạp bản cập nhật.");

      const appliedVer = patchData.version || data.updatedVersion || updateStatus?.latestVersion || "60.25.0";
      localStorage.setItem("milo_applied_version", appliedVer);
      localStorage.setItem("milo_last_updated_at", new Date().toISOString());

      if (progressFill) progressFill.style.width = "100%";
      if (progressText) progressText.innerHTML = "✅ <strong>Cập nhật thành công!</strong> Đang làm mới app...";
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      if (progressText) progressText.innerHTML = `<span style="color:#ef4444">❌ Lỗi: ${err.message}</span>`;
    }
  }

  async function performServerUpdate() {
    const progressContainer = document.getElementById("milo-progress-container");
    const progressFill = document.getElementById("milo-progress-fill");
    const progressText = document.getElementById("milo-progress-text");

    if (progressContainer) progressContainer.style.display = "block";
    if (progressFill) progressFill.style.width = "45%";
    if (progressText) progressText.innerText = "Đang tải và đồng bộ bài học mới từ máy chủ...";

    try {
      const targetVer = updateStatus?.latestVersion || "60.25.6";
      const payload = updateStatus?.downloadUrl 
        ? { downloadUrl: updateStatus.downloadUrl, version: targetVer }
        : { version: targetVer };

      const res = await fetch("/api/update/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Không thể nạp bản cập nhật.");

      localStorage.setItem("milo_applied_version", targetVer);
      localStorage.setItem("milo_last_updated_at", new Date().toISOString());

      const banner = document.getElementById("milo-update-banner");
      if (banner) banner.remove();

      if (progressFill) progressFill.style.width = "100%";
      if (progressText) progressText.innerHTML = "✅ <strong>Cập nhật thành công! Đang làm mới bài học...</strong>";
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      if (progressText) progressText.innerHTML = `<span style="color:#ef4444">❌ Lỗi: ${err.message}</span>`;
    }
  }

  // Global trigger
  window.MiloUpdater = {
    check: initUpdater,
    hasUpdate: () => Boolean(updateStatus && updateStatus.hasUpdate),
    getStatus: () => updateStatus,
    getAppliedVersion: () => localStorage.getItem("milo_applied_version"),
    openModal: () => {
      initUpdater().then(() => {
        openUpdateModal(updateStatus || {
          currentVersion: "60.25.0",
          latestVersion: "60.25.0",
          hasUpdate: false,
          changelog: ["Bạn đang sử dụng phiên bản mới nhất"],
        });
      });
    },
  };

  // Initial check & periodic check every 10 minutes
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initUpdater, 1000);
      setInterval(initUpdater, 10 * 60 * 1000);
    });
  } else {
    setTimeout(initUpdater, 1000);
    setInterval(initUpdater, 10 * 60 * 1000);
  }
})();
