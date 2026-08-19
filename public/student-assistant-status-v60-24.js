(function () {
  "use strict";
  const TOKEN_KEY = "milo-commerce-token-v1";
  let refreshing = false;

  function elements() {
    const root = document.querySelector("#miloFriendlyStatus");
    return {
      root,
      label: root?.querySelector("b"),
      retry: document.querySelector("#miloStatusRetry"),
      tier: document.querySelector("#miloChatActiveTier"),
      badge: document.querySelector("#chatAccessBadge"),
      upgrade: document.querySelector("#miloVipMiniCard"),
    };
  }

  function isActiveVip(data) {
    if (!["vip-pro-max", "vip-pro-max-trial"].includes(data?.accessLevel)) return false;
    const expiresAt = new Date(data?.activeUntil || "").getTime();
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }

  function paint(state, message, data = null) {
    const ui = elements();
    if (!ui.root || !ui.label) return false;
    ui.root.dataset.state = state;
    ui.label.textContent = message;
    ui.retry?.classList.toggle("hidden", state !== "error");
    const vip = isActiveVip(data);
    const tierLabel = vip ? "VIP PRO MAX" : "AI Plus";
    if (ui.tier) ui.tier.textContent = tierLabel;
    if (ui.badge) {
      ui.badge.textContent = tierLabel;
      ui.badge.className = `chat-access-badge ${vip ? "pro" : "plus"}`;
    }
    ui.upgrade?.classList.toggle("hidden", vip);
    return true;
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    paint("connecting", "Milo đang kết nối…");
    try {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      const response = await fetch("/api/tutor", {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.configured) throw new Error("unavailable");
      paint("ready", "Milo đã sẵn sàng", data);
      window.dispatchEvent(new CustomEvent("milo:student-assistant-ready", { detail: { accessLevel: data.accessLevel, activeUntil: data.activeUntil || null } }));
    } catch {
      paint("error", "Milo chưa thể kết nối. Con hãy thử lại nhé");
    } finally {
      refreshing = false;
    }
  }

  function bind() {
    const ui = elements();
    if (!ui.root) return false;
    if (ui.retry && ui.retry.dataset.bound !== "1") {
      ui.retry.dataset.bound = "1";
      ui.retry.addEventListener("click", refresh);
    }
    refresh();
    return true;
  }

  if (!bind()) {
    const observer = new MutationObserver(() => {
      if (bind()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }
  window.addEventListener("milo:access-updated", refresh);
  window.addEventListener("milo:payment-confirmed", refresh);
  window.addEventListener("milo:trial-started", refresh);
  window.MILO_STUDENT_ASSISTANT_STATUS_V60_24 = { refresh, paint, isActiveVip };
})();
