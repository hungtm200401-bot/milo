// Admin Update Manager Script
(function () {
  "use strict";

  function init() {
    const pushBtn = document.getElementById("adminPushReleaseBtn");
    const exportBtn = document.getElementById("adminExportPatchBtn");
    const pushStatus = document.getElementById("adminPushStatus");

    pushBtn?.addEventListener("click", async () => {
      const version = document.getElementById("adminNewVersion")?.value.trim() || "60.25.0";
      const title = document.getElementById("adminReleaseTitle")?.value.trim() || "Bản cập nhật mới";
      const changelogText = document.getElementById("adminReleaseChangelog")?.value.trim() || "";
      const changelog = changelogText.split("\n").map((s) => s.trim()).filter(Boolean);

      if (pushStatus) {
        pushStatus.style.color = "#3b82f6";
        pushStatus.innerText = "Đang kích hoạt phát hành bản mới...";
      }

      try {
        const token = localStorage.getItem("milo-admin-token") || "";
        const res = await fetch("/api/update/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ version, title, changelog }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Không thể phát hành.");

        if (pushStatus) {
          pushStatus.style.color = "#10b981";
          pushStatus.innerText = `✅ Đã phát hành V${version} thành công! Toàn bộ app học viên sẽ thấy thông báo cập nhật ngay lập tức.`;
        }
      } catch (err) {
        if (pushStatus) {
          pushStatus.style.color = "#ef4444";
          pushStatus.innerText = `❌ Lỗi: ${err.message}`;
        }
      }
    });

    exportBtn?.addEventListener("click", async () => {
      exportBtn.innerText = "⏳ Đang tạo gói .milo...";
      try {
        const token = localStorage.getItem("milo-admin-token") || "";
        const version = document.getElementById("adminNewVersion")?.value.trim() || "60.25.0";
        const res = await fetch("/api/update/export-patch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ version }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Lỗi tạo gói");

        const blob = new Blob([JSON.stringify(data.patch, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Milo_Patch_V${version}.milo`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        exportBtn.innerText = "✅ Tải Gói Thành Công!";
        setTimeout(() => { exportBtn.innerText = "📥 Tải Tệp Gói Cập Nhật (.milo)"; }, 2500);
      } catch (err) {
        alert("Lỗi xuất gói: " + err.message);
        exportBtn.innerText = "📥 Tải Tệp Gói Cập Nhật (.milo)";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
