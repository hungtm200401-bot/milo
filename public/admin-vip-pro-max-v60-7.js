(function () {
  "use strict";

  const PASSWORD_KEY = "milo-admin-password-v1";
  const byId = (id) => document.getElementById(id);
  const login = byId("adminLogin");
  const app = byId("adminApp");
  const form = byId("adminLoginForm");
  const input = byId("adminPassword");
  const loginError = byId("adminLoginError");
  const purchaseRows = byId("purchaseRows");
  const pendingRows = byId("pendingRows");
  const transactionRows = byId("transactionRows");
  const accountRows = byId("accountRows");
  const overviewPanel = byId("overviewPanel");
  const pendingPanel = byId("pendingPanel");
  const ordersPanel = byId("ordersPanel");
  const accountsPanel = byId("accountsPanel");
  const plansPanel = byId("plansPanel");
  const transactionsPanel = byId("transactionsPanel");
  const connectionPanel = byId("connectionPanel");
  const reportsPanel = byId("reportsPanel");
  const settingsPanel = byId("settingsPanel");
  const alignmentPanel = byId("alignmentPanel");
  const mainToolbar = byId("mainToolbar");
  const alignmentRows = byId("alignmentRows");
  const alignmentEmpty = byId("alignmentEmpty");
  const alignmentLevel = byId("alignmentLevel");
  const ordersEmpty = byId("adminEmpty");
  const pendingEmpty = byId("pendingEmpty");
  const transactionEmpty = byId("transactionEmpty");
  const accountsEmpty = byId("accountsEmpty");
  const searchInput = byId("adminSearch");
  const topbarSearch = byId("topbarSearch");
  const statusFilter = byId("adminStatusFilter");
  const status = byId("adminStatus");
  const togglePasswordBtn = byId("togglePasswordBtn");
  const sidebarCollapseBtn = byId("sidebarCollapseBtn");
  const adminSidebar = byId("adminSidebar");
  const toastContainer = byId("toastContainer");
  const pageTitle = byId("currentPageTitle");
  const pageSubtitle = byId("currentPageSubtitle");

  const validViews = ["overview", "pending", "accounts", "orders", "plans", "transactions", "connection", "reports", "settings"];
  let password = sessionStorage.getItem(PASSWORD_KEY) || "";
  let payloadCache = { purchases: [], accounts: [], summary: {}, database: {}, provider: {}, plans: [], commonFeatures: [] };
  let activeView = validViews.includes(location.hash.replace(/^#/, "")) ? location.hash.replace(/^#/, "") : "overview";
  let selectedAccountId = "";
  let selectedPurchaseId = "";
  let loading = false;

  const detailScopeIds = {
    pending: "pendingMasterDetail",
    accounts: "accountsMasterDetail",
    orders: "ordersMasterDetail",
    transactions: "transactionsMasterDetail",
  };

  const statusLabel = {
    pending: "Chờ đối chiếu",
    active: "Đang hoạt động",
    new: "Tài khoản mới",
    free: "AI Plus miễn phí",
    paid: "Đã xác nhận",
    expired: "Hết hạn",
    rejected: "Đã từ chối",
    locked: "Đã khóa đăng nhập",
  };
  const genderLabel = { boy: "Nam", girl: "Nữ", other: "Khác / chưa chọn" };
  const skillLabel = {
    translation: "Dịch",
    vocabulary: "Từ vựng",
    word: "Từ",
    spelling: "Đánh vần",
    listening: "Nghe",
    speaking: "Nói",
    conversation: "Hội thoại",
    pronunciation: "Phát âm",
    grammar: "Ngữ pháp",
    reading: "Đọc",
    writing: "Viết",
    test: "Kiểm tra",
    unit: "Unit",
    general: "Tổng hợp",
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[character]);

  const searchable = (...values) => values.flat(Infinity).filter(Boolean).join(" ").toLocaleLowerCase("vi-VN");
  const money = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
  const number = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
  const date = (value) => {
    if (!value) return "Chưa có";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Chưa có";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(parsed);
  };
  const shortTime = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(parsed);
  };
  const initials = (name) => String(name || "M").trim().split(/\s+/).slice(-2).map((part) => part[0] || "").join("").toUpperCase() || "M";

  function detailScope(view) {
    return byId(detailScopeIds[view] || "");
  }

  function setDetailOpen(view, open) {
    const scope = detailScope(view);
    if (!scope) return false;
    scope.classList.toggle("detail-open", open);
    const detail = scope.querySelector(".detail-card, .profile-side-panel, .order-detail-view");
    detail?.setAttribute("aria-hidden", String(!open));
    if (open) {
      const content = document.querySelector(".admin-content-container");
      if (content) content.scrollTop = 0;
    }
    return true;
  }

  function openDetail(view) {
    setDetailOpen(view, true);
  }

  function closeDetail(view) {
    if (!setDetailOpen(view, false)) return;
    const selector = view === "accounts" ? "[data-account-select]" : "[data-purchase-select]";
    window.requestAnimationFrame(() => {
      const selectedId = view === "accounts" ? selectedAccountId : selectedPurchaseId;
      const row = [...document.querySelectorAll(selector)].find((item) => (view === "accounts" ? item.dataset.accountSelect : item.dataset.purchaseSelect) === selectedId);
      row?.focus({ preventScroll: true });
    });
  }

  function closeAllDetails() {
    Object.keys(detailScopeIds).forEach((view) => setDetailOpen(view, false));
  }

  function activeDetailIsOpen() {
    return detailScope(activeView)?.classList.contains("detail-open") || false;
  }

  function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === "success" ? "✓" : type === "error" ? "⚠️" : "ℹ️"}</span><span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity .25s ease";
      setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  function setStatus(message = "", isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("error", Boolean(isError));
  }

  async function api(path, options = {}) {
    let response;
    try {
      response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Milo-Admin": password,
          ...(options.headers || {}),
        },
        cache: "no-store",
      });
    } catch {
      throw new Error("Không thể kết nối tới máy chủ Milo. Hãy kiểm tra ứng dụng đang chạy.");
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || payload.error || "Không thể tải dữ liệu.");
    return payload;
  }

  function showApp() {
    login?.classList.add("hidden");
    app?.classList.remove("hidden");
  }

  function showLogin(message = "") {
    app?.classList.add("hidden");
    login?.classList.remove("hidden");
    if (loginError) {
      loginError.textContent = message;
      loginError.classList.toggle("hidden", !message);
    }
    setTimeout(() => input?.focus(), 50);
  }

  function accountStatusOf(account) {
    const access = account?.aiAccess || {};
    if (account?.loginDisabled) return "locked";
    if (access.accessLevel === "plus") return "free";
    if (access.active) return "active";
    return account?.status || "expired";
  }

  function actionButtons(purchase, compact = false) {
    const view = `<button class="view-detail" data-purchase-select="${escapeHtml(purchase.id)}">Xem chi tiết</button>`;
    if (!purchase || purchase.status !== "pending") return `<div class="order-buttons ${compact ? "compact" : ""}">${view}</div>`;
    return `<div class="order-buttons ${compact ? "compact" : ""}">${view}<button data-action="confirm" data-id="${escapeHtml(purchase.id)}" data-content="${escapeHtml(purchase.transferContent)}">✓ Duyệt</button><button class="reject" data-action="reject" data-id="${escapeHtml(purchase.id)}">Từ chối</button></div>`;
  }

  function accountActionButtons(account) {
    const lockAction = account.loginDisabled ? "unlock" : "lock";
    const lockLabel = account.loginDisabled ? "Mở khóa" : "Khóa";
    const pendingButtons = account.pendingPurchase ? actionButtons(account.pendingPurchase, true) : "";
    return `<div class="account-manage-actions">
      <button class="view-detail" data-account-select="${escapeHtml(account.id)}">Xem hồ sơ</button>
      ${pendingButtons}
      <button class="account-reset-pin" data-account-action="reset-pin" data-account-id="${escapeHtml(account.id)}" data-account-nickname="${escapeHtml(account.nickname)}">Đặt PIN</button>
      <button class="${account.loginDisabled ? "" : "reject"}" data-account-action="${lockAction}" data-account-id="${escapeHtml(account.id)}" data-account-nickname="${escapeHtml(account.nickname)}">${lockLabel}</button>
      <button class="account-delete" data-account-action="delete" data-account-id="${escapeHtml(account.id)}" data-account-nickname="${escapeHtml(account.nickname)}">Xóa</button>
    </div>`;
  }

  function renderPurchase(purchase) {
    const account = purchase.account || {};
    const selected = purchase.id === selectedPurchaseId ? " selected-row" : "";
    return `<tr class="selectable-row${selected}" data-purchase-select="${escapeHtml(purchase.id)}" tabindex="0">
      <td><b>@${escapeHtml(account.nickname || purchase.accountNickname || "chưa-có-nick")}</b><small>${escapeHtml(account.displayName || purchase.displayName || "Chưa có tên")}</small><small>${escapeHtml(account.publicId || purchase.accountPublicId || "")}</small></td>
      <td><b>${purchase.grade ? `Lớp ${Number(purchase.grade)}` : "Chưa chọn lớp"}</b><small>${escapeHtml(purchase.petName || "Chưa chọn nhân vật")}</small></td>
      <td><b>${escapeHtml(purchase.planName || "Chưa có tên gói")}</b><small>${Number(purchase.durationMonths || 0)} tháng</small></td>
      <td><b>${money(purchase.price)}</b><small>${purchase.status === "paid" ? `Đã xác nhận ${money(purchase.amountPaid || purchase.price)}` : "Chưa xác nhận tiền"}</small></td>
      <td><span class="transfer-code">${escapeHtml(purchase.transferContent || "Chưa có")}</span><small>${escapeHtml(purchase.orderId || purchase.id || "")}</small></td>
      <td><span class="status-badge status-${escapeHtml(purchase.status)}">${statusLabel[purchase.status] || escapeHtml(purchase.status)}</span><small>${purchase.activeUntil ? `Hạn ${date(purchase.activeUntil)}` : escapeHtml(purchase.providerStatus || "")}</small></td>
      <td><b>${date(purchase.createdAt)}</b><small>${purchase.paidAt ? `Duyệt ${date(purchase.paidAt)}` : purchase.updatedAt ? `Cập nhật ${date(purchase.updatedAt)}` : ""}</small></td>
      <td>${actionButtons(purchase)}</td>
    </tr>`;
  }

  function gradeProgressInfo(account, grade = Number(account.selectedGrade || 2)) {
    const progress = account.gradeProgress?.[String(grade)] || { level: 1, xp: 0, currentUnit: 1, completedUnits: [] };
    const completed = Array.isArray(progress.completedUnits) ? progress.completedUnits.filter((unit) => Number(unit) >= 1 && Number(unit) <= 12).length : 0;
    return { grade, progress, completed, percent: Math.round((completed / 12) * 100) };
  }

  function renderGradeProgress(account) {
    const { grade, progress, completed, percent } = gradeProgressInfo(account);
    return `<div class="admin-grade-progress"><b>Lớp ${grade} · Lv.${Math.min(50, Number(progress.level || 1))}</b><small>${number(progress.xp)} / 4.900 XP · ${completed}/12 Unit</small><progress max="100" value="${percent}"></progress><small>${progress.classCompletedAt ? `Hoàn thành ${date(progress.classCompletedAt)}` : `Unit hiện tại ${Math.min(12, Math.max(1, Number(progress.currentUnit || 1)))}/12`}</small></div>`;
  }

  function renderAccount(account) {
    const access = account.aiAccess || {};
    const accountStatus = accountStatusOf(account);
    const loginLabel = account.lastLoginAt
      ? `<span class="login-history-badge logged">ĐÃ ĐĂNG NHẬP</span><b>${date(account.lastLoginAt)}</b><small>${number(account.loginCount)} lần đăng nhập</small>`
      : `<span class="login-history-badge never">CHƯA ĐĂNG NHẬP</span><small>Không có lịch sử đăng nhập</small>`;
    const selected = account.id === selectedAccountId ? " selected-row" : "";
    return `<tr class="selectable-row${selected}" data-account-select="${escapeHtml(account.id)}" tabindex="0">
      <td><b>@${escapeHtml(account.nickname || "chưa-có-nick")}</b><small>${escapeHtml(account.displayName || "Chưa có tên")}</small><small>${escapeHtml(account.publicId || "")}</small></td>
      <td><b>${account.selectedGrade ? `Lớp ${Number(account.selectedGrade)}` : "Chưa chọn lớp"}</b><small>${escapeHtml(account.selectedPetName || "Chưa chọn nhân vật")}</small></td>
      <td class="grade-progress-cell">${renderGradeProgress(account)}</td>
      <td><div class="account-pin-security"><b>PIN đã mã hóa</b><small>Không hiển thị PIN cũ</small><em>Chỉ có thể đặt PIN mới</em></div></td>
      <td><div class="account-login-history">${loginLabel}</div></td>
      <td><span class="account-access access-${escapeHtml(access.accessLevel || "plus")}">${escapeHtml(access.planName || "AI Plus miễn phí")}</span><small>${access.activeUntil ? `Đến ${date(access.activeUntil)}` : "Không giới hạn khóa học"}</small></td>
      <td><span class="status-badge status-${escapeHtml(accountStatus)}">${statusLabel[accountStatus] || escapeHtml(accountStatus)}</span><small>${account.loginDisabled ? "Đang chặn đăng nhập" : "Được phép đăng nhập"}</small></td>
      <td><b>${date(account.createdAt)}</b><small>Cập nhật ${date(account.updatedAt)}</small></td>
      <td>${accountActionButtons(account)}</td>
    </tr>`;
  }

  function progressCard(account, grade) {
    const { progress, completed, percent } = gradeProgressInfo(account, grade);
    return `<article class="profile-progress-card ${Number(account.selectedGrade) === grade ? "current" : ""}"><div><b>Lớp ${grade}</b><span>Lv.${Math.min(50, Number(progress.level || 1))}</span></div><progress max="100" value="${percent}"></progress><small>${completed}/12 Unit · ${number(progress.xp)} XP · Unit ${Math.min(12, Math.max(1, Number(progress.currentUnit || 1)))}</small></article>`;
  }

  function renderLearningEvents(events = []) {
    if (!events.length) return `<div class="admin-empty compact"><p>Chưa có lịch sử học được đồng bộ cho tài khoản này.</p></div>`;
    return events.slice(0, 8).map((event) => `<div class="profile-event-item"><div><b>${escapeHtml(skillLabel[event.skill] || event.skill || "Hoạt động học")}</b><small>${escapeHtml(event.type || "learning")} · ${date(event.createdAt)}</small></div><span>${Number.isFinite(Number(event.score)) ? `${Number(event.score)} điểm` : `${Number(event.durationMinutes || 0)} phút`}</span></div>`).join("");
  }

  function renderAccountPurchases(purchases = []) {
    if (!purchases.length) return `<div class="admin-empty compact"><p>Tài khoản chưa có đơn hàng.</p></div>`;
    return purchases.slice(0, 6).map((purchase) => `<button type="button" class="profile-purchase-item" data-purchase-select="${escapeHtml(purchase.id)}"><span><b>${escapeHtml(purchase.planName || "Gói chưa đặt tên")}</b><small>${escapeHtml(purchase.orderId || purchase.id)} · ${date(purchase.createdAt)}</small></span><span class="status-badge status-${escapeHtml(purchase.status)}">${statusLabel[purchase.status] || escapeHtml(purchase.status)}</span></button>`).join("");
  }

  function renderAccountProfile(account) {
    const container = byId("selectedAccountProfile");
    if (!container) return;
    if (!account) {
      container.innerHTML = `<div class="admin-empty"><span class="empty-icon">👤</span><p>Không có tài khoản thật để hiển thị.</p></div>`;
      return;
    }
    const access = account.aiAccess || {};
    const summary = account.learningProfile?.summary || {};
    const accountStatus = accountStatusOf(account);
    container.innerHTML = `
      <div class="profile-header-card real-profile-header"><div class="profile-avatar-large profile-initials">${escapeHtml(initials(account.displayName))}</div><div><h4>${escapeHtml(account.displayName || "Chưa có tên")} <span class="status-badge status-${escapeHtml(accountStatus)}">${statusLabel[accountStatus] || escapeHtml(accountStatus)}</span></h4><small>@${escapeHtml(account.nickname)} · ${escapeHtml(account.publicId)}</small></div></div>
      <div class="real-profile-facts">
        <div><small>Giới tính</small><b>${escapeHtml(genderLabel[account.gender] || "Chưa chọn")}</b></div>
        <div><small>Lớp / nhân vật</small><b>${account.selectedGrade ? `Lớp ${Number(account.selectedGrade)}` : "Chưa chọn lớp"} · ${escapeHtml(account.selectedPetName || "Chưa chọn pet")}</b></div>
        <div><small>Quyền AI thật</small><b>${escapeHtml(access.planName || "AI Plus miễn phí")}</b></div>
        <div><small>Hạn quyền</small><b>${access.activeUntil ? date(access.activeUntil) : "Không có hạn trả phí"}</b></div>
        <div><small>Lần đăng nhập gần nhất</small><b>${date(account.lastLoginAt)}</b></div>
        <div><small>Số lần đăng nhập</small><b>${number(account.loginCount)}</b></div>
        <div><small>Ngày tạo</small><b>${date(account.createdAt)}</b></div>
        <div><small>Cập nhật hồ sơ</small><b>${date(account.updatedAt)}</b></div>
      </div>
      <div class="profile-truth-note">Ứng dụng hiện không thu thập email, số điện thoại hoặc tên phụ huynh, nên trang quản trị không tự tạo các thông tin đó.</div>
      <section class="profile-section"><div class="profile-section-title"><h4>Tiến độ thật theo từng lớp</h4><small>Đọc từ gradeProgress của tài khoản</small></div><div class="profile-progress-grid">${[2, 3, 4, 5].map((grade) => progressCard(account, grade)).join("")}</div></section>
      <section class="profile-section"><div class="profile-section-title"><h4>Tóm tắt học tập đồng bộ</h4><small>Cập nhật ${date(account.learningProfile?.updatedAt)}</small></div><div class="learning-summary-grid"><article><small>Sự kiện học</small><b>${number(summary.totalEvents)}</b></article><article><small>Ngày học</small><b>${number(summary.learningDays)}</b></article><article><small>Chuỗi ngày</small><b>${number(summary.streak)}</b></article><article><small>Tổng phút</small><b>${number(summary.totalMinutes)}</b></article><article><small>Lần luyện phát âm</small><b>${number(summary.pronunciationAttempts)}</b></article><article><small>Điểm phát âm TB</small><b>${number(summary.averagePronunciation)}</b></article></div></section>
      <section class="profile-section"><div class="profile-section-title"><h4>Hoạt động học gần đây</h4></div><div class="profile-events-list">${renderLearningEvents(summary.recentEvents || [])}</div></section>
      <section class="profile-section"><div class="profile-section-title"><h4>Đơn hàng của tài khoản</h4><small>${number(account.purchaseCount)} đơn</small></div><div class="profile-purchases-list">${renderAccountPurchases(account.purchases || [])}</div></section>
      <div class="profile-action-buttons horizontal"><button class="btn-resend-outline" data-account-action="reset-pin" data-account-id="${escapeHtml(account.id)}" data-account-nickname="${escapeHtml(account.nickname)}">🔑 Đặt lại PIN</button><button class="btn-reject-red" data-account-action="${account.loginDisabled ? "unlock" : "lock"}" data-account-id="${escapeHtml(account.id)}" data-account-nickname="${escapeHtml(account.nickname)}">${account.loginDisabled ? "🔓 Mở khóa" : "🔒 Khóa đăng nhập"}</button></div>`;
  }

  function renderOrderDetail(purchase, targetId = "selectedOrderDetail") {
    const container = byId(targetId);
    if (!container) return;
    if (!purchase) {
      container.innerHTML = `<div class="admin-empty"><p>Không có đơn thật để hiển thị.</p></div>`;
      return;
    }
    const account = purchase.account || {};
    container.innerHTML = `<div class="order-detail-grid real-order-detail">
      <div class="detail-block"><h4>👤 Tài khoản</h4><p><small>Nick:</small> <b>@${escapeHtml(account.nickname || purchase.accountNickname || "chưa-có-nick")}</b></p><p><small>Học viên:</small> <b>${escapeHtml(account.displayName || purchase.displayName || "Chưa có")}</b></p><p><small>Mã học viên:</small> <b>${escapeHtml(account.publicId || purchase.accountPublicId || "Chưa có")}</b></p><p><small>Lớp / nhân vật:</small> <b>${purchase.grade ? `Lớp ${Number(purchase.grade)}` : "Chưa chọn"} · ${escapeHtml(purchase.petName || "Chưa chọn")}</b></p></div>
      <div class="detail-block"><h4>💸 Chuyển khoản</h4><p><small>Ngân hàng nhận:</small> <b>${escapeHtml(purchase.bankName || payloadCache.provider?.name || "Chưa cấu hình")}</b></p><p><small>Nội dung:</small> <b class="text-blue">${escapeHtml(purchase.transferContent || "Chưa có")}</b></p><p><small>Mã đơn:</small> <b>${escapeHtml(purchase.orderId || purchase.id)}</b></p><p><small>Số tiền yêu cầu:</small> <b>${money(purchase.price)}</b></p><p><small>Số tiền đã xác nhận:</small> <b>${purchase.status === "paid" ? money(purchase.amountPaid || purchase.price) : "Chưa xác nhận"}</b></p></div>
      <div class="detail-block"><h4>👑 Gói đăng ký</h4><p><small>Tên gói:</small> <b>${escapeHtml(purchase.planName || "Chưa có")}</b></p><p><small>Mã gói:</small> <b>${escapeHtml(purchase.planId || "Chưa có")}</b></p><p><small>Thời lượng:</small> <b>${number(purchase.durationMonths)} tháng</b></p><p><small>Kích hoạt:</small> <b>${date(purchase.activeFrom)}</b></p><p><small>Hết hạn:</small> <b>${date(purchase.activeUntil)}</b></p></div>
      <div class="detail-block"><h4>🛡️ Trạng thái xác minh</h4><p><small>Trạng thái đơn:</small> <b>${statusLabel[purchase.status] || escapeHtml(purchase.status)}</b></p><p><small>Trạng thái nhà cung cấp:</small> <b>${escapeHtml(purchase.providerStatus || "Chưa xác nhận")}</b></p><p><small>Tạo lúc:</small> <b>${date(purchase.createdAt)}</b></p><p><small>Xác nhận lúc:</small> <b>${date(purchase.confirmedAt || purchase.paidAt)}</b></p><p><small>Ghi chú:</small> <b>${escapeHtml(purchase.confirmationNote || "Không có")}</b></p></div>
    </div><div class="profile-truth-note">Database không lưu ảnh biên lai giả. Quản trị viên đối chiếu giao dịch thật bằng mã đơn, nội dung chuyển khoản và tài khoản ngân hàng.</div><div class="action-buttons-three-row margin-top-md">${purchase.status === "pending" ? actionButtons(purchase) : `<button class="btn-resend-outline" data-account-select="${escapeHtml(account.id || purchase.accountId)}">Xem hồ sơ người dùng</button>`}</div>`;
  }

  function collectActivities() {
    const activities = [];
    payloadCache.accounts.forEach((account) => {
      if (account.createdAt) activities.push({ type: "account-created", icon: "👤", title: "Tạo tài khoản", detail: `@${account.nickname} · ${account.displayName || account.publicId}`, at: account.createdAt });
      if (account.lastLoginAt) activities.push({ type: "login", icon: "🟢", title: "Đăng nhập gần nhất", detail: `@${account.nickname} · ${number(account.loginCount)} lần`, at: account.lastLoginAt });
      if (account.learningProfile?.updatedAt) activities.push({ type: "learning", icon: "📚", title: "Đồng bộ hồ sơ học tập", detail: `@${account.nickname} · ${number(account.learningProfile.summary?.totalEvents)} sự kiện`, at: account.learningProfile.updatedAt });
    });
    payloadCache.purchases.forEach((purchase) => {
      if (purchase.createdAt) activities.push({ type: "order", icon: "🧾", title: "Tạo đơn hàng", detail: `${purchase.orderId || purchase.id} · ${purchase.planName || "Gói"}`, at: purchase.createdAt });
      if (purchase.status === "paid" && (purchase.confirmedAt || purchase.paidAt)) activities.push({ type: "paid", icon: "✅", title: "Đã xác nhận đơn", detail: `${purchase.orderId || purchase.id} · ${money(purchase.price)}`, at: purchase.confirmedAt || purchase.paidAt });
      if (purchase.status === "rejected" && purchase.updatedAt) activities.push({ type: "rejected", icon: "✕", title: "Đã từ chối đơn", detail: purchase.orderId || purchase.id, at: purchase.updatedAt });
    });
    return activities.filter((item) => item.at && !Number.isNaN(new Date(item.at).getTime())).sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  function renderRecentActivities() {
    const container = byId("recentActivityList");
    if (!container) return;
    const items = collectActivities().slice(0, 8);
    container.innerHTML = items.length ? items.map((item) => `<div class="timeline-item"><span class="timeline-icon icon-bg-blue">${item.icon}</span><div class="timeline-body"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.detail)}</small></div><span class="timeline-time">${escapeHtml(shortTime(item.at))}</span></div>`).join("") : `<div class="admin-empty compact"><p>Chưa có hoạt động trong database.</p></div>`;
  }

  function renderActivityChart() {
    const svg = byId("activityChartSvg");
    const labels = byId("activityChartLabels");
    const empty = byId("activityChartEmpty");
    if (!svg || !labels || !empty) return;
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - offset);
      days.push({ key: day.toISOString().slice(0, 10), label: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(day), count: 0 });
    }
    const index = new Map(days.map((day) => [day.key, day]));
    collectActivities().forEach((item) => {
      const key = new Date(item.at).toISOString().slice(0, 10);
      if (index.has(key)) index.get(key).count += 1;
    });
    const max = Math.max(1, ...days.map((day) => day.count));
    const width = 420;
    const height = 140;
    const padX = 20;
    const padY = 18;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const points = days.map((day, idx) => ({ x: padX + (usableW * idx) / 6, y: height - padY - (day.count / max) * usableH, count: day.count }));
    const pointText = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    svg.innerHTML = `<defs><linearGradient id="realChartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563eb" stop-opacity=".28"/><stop offset="100%" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs><line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#cbd5e1" stroke-width="1"/><polygon points="${padX},${height - padY} ${pointText} ${width - padX},${height - padY}" fill="url(#realChartGrad)"/><polyline points="${pointText}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#2563eb"><title>${p.count} hoạt động</title></circle><text x="${p.x}" y="${Math.max(12, p.y - 9)}" text-anchor="middle" font-size="10" fill="#475569">${p.count}</text>`).join("")}`;
    labels.innerHTML = days.map((day) => `<span>${day.label}</span>`).join("");
    const total = days.reduce((sum, day) => sum + day.count, 0);
    empty.classList.toggle("hidden", total > 0);
    svg.classList.toggle("muted-chart", total === 0);
  }

  function renderPackageDonut() {
    const svg = byId("packageDonutSvg");
    const legend = byId("packageLegend");
    const totalNode = byId("packageTotal");
    const footer = byId("packageFooterTotal");
    if (!svg || !legend || !totalNode || !footer) return;
    const groups = [
      { label: "VIP trả phí", count: Number(payloadCache.summary?.vipActive || 0), color: "#2563eb" },
      { label: "Dùng thử VIP", count: Number(payloadCache.summary?.trialActive || 0), color: "#22c55e" },
      { label: "AI Plus miễn phí", count: Number(payloadCache.summary?.freePlus || 0), color: "#f59e0b" },
    ];
    const total = groups.reduce((sum, group) => sum + group.count, 0);
    totalNode.textContent = number(total);
    footer.textContent = number(total);
    const circumference = 2 * Math.PI * 38;
    let offset = 0;
    svg.innerHTML = total ? groups.filter((group) => group.count > 0).map((group) => {
      const length = (group.count / total) * circumference;
      const circle = `<circle cx="50" cy="50" r="38" fill="none" stroke="${group.color}" stroke-width="12" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}"/>`;
      offset += length;
      return circle;
    }).join("") : `<circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" stroke-width="12"/>`;
    legend.innerHTML = total ? groups.map((group) => `<div class="legend-item"><span class="legend-dot" style="background:${group.color}"></span><span class="legend-name">${escapeHtml(group.label)}</span><span class="legend-val">${number(group.count)} (${Math.round((group.count / total) * 100)}%)</span></div>`).join("") : `<div class="empty-inline">Chưa có tài khoản.</div>`;
  }

  function renderAuditLog() {
    const container = byId("orderAuditList");
    if (!container) return;
    const audited = payloadCache.purchases.filter((purchase) => ["paid", "rejected"].includes(purchase.status)).sort((a, b) => new Date(b.confirmedAt || b.paidAt || b.updatedAt || b.createdAt) - new Date(a.confirmedAt || a.paidAt || a.updatedAt || a.createdAt)).slice(0, 12);
    container.innerHTML = audited.length ? audited.map((purchase) => `<button type="button" class="log-item audit-select" data-purchase-select="${escapeHtml(purchase.id)}"><span class="log-icon ${purchase.status === "paid" ? "icon-green" : "icon-red"}">${purchase.status === "paid" ? "✓" : "✕"}</span><span class="log-info"><b>${purchase.status === "paid" ? "Đã xác nhận" : "Đã từ chối"} ${escapeHtml(purchase.orderId || purchase.id)}</b><small>${escapeHtml(purchase.planName || "Gói")} · ${money(purchase.price)}</small></span><span class="log-time">${date(purchase.confirmedAt || purchase.paidAt || purchase.updatedAt)}</span></button>`).join("") : `<div class="admin-empty compact"><p>Chưa có đơn đã duyệt hoặc từ chối.</p></div>`;
  }

  function filteredPurchases(mode = activeView) {
    const query = searchInput?.value.trim().toLocaleLowerCase("vi-VN") || topbarSearch?.value.trim().toLocaleLowerCase("vi-VN") || "";
    const selectedStatus = statusFilter?.value || "all";
    return payloadCache.purchases.filter((purchase) => {
      if (mode === "pending" && purchase.status !== "pending") return false;
      if (["orders", "transactions"].includes(mode) && selectedStatus !== "all" && purchase.status !== selectedStatus) return false;
      if (!query) return true;
      const account = purchase.account || {};
      return searchable(account.nickname, account.displayName, account.publicId, purchase.orderId, purchase.id, purchase.transferContent, purchase.planName, purchase.petName, purchase.status).includes(query);
    });
  }

  function filteredAccounts() {
    const query = searchInput?.value.trim().toLocaleLowerCase("vi-VN") || "";
    const selectedStatus = statusFilter?.value || "all";
    return payloadCache.accounts.filter((account) => {
      const access = account.aiAccess || {};
      if (selectedStatus !== "all") {
        const matches = (selectedStatus === "logged-in" && Boolean(account.lastLoginAt)) || (selectedStatus === "never-logged" && !account.lastLoginAt) || (selectedStatus === "locked" && Boolean(account.loginDisabled)) || (selectedStatus === "paid" && access.accessLevel === "vip-pro-max") || (selectedStatus === "pending" && Boolean(account.pendingPurchase));
        if (!matches) return false;
      }
      if (!query) return true;
      return searchable(account.nickname, account.displayName, account.publicId, account.selectedPetName, access.planName, account.latestPurchase?.orderId).includes(query);
    });
  }

  function curriculumUnits() {
    return Object.entries(window.MILO_CURRICULUM || {}).flatMap(([level, grade]) => (grade.units || []).map((unit, index) => ({ level: Number(level), unitNumber: index + 1, unit })));
  }

  function filteredAlignmentUnits() {
    const query = searchInput?.value.trim().toLocaleLowerCase("vi-VN") || "";
    const selectedLevel = alignmentLevel?.value || "all";
    return curriculumUnits().filter((item) => {
      if (selectedLevel !== "all" && item.level !== Number(selectedLevel)) return false;
      if (!query) return true;
      const alignment = item.unit.alignment || {};
      return searchable(`level ${item.level}`, `unit ${item.unitNumber}`, item.unit.title, item.unit.vi, item.unit.theme, item.unit.words?.map((word) => word[0]), alignment.extendedWords?.map((word) => word.term), Object.values(alignment.objectives || {})).includes(query);
    });
  }

  function compactDetails(label, items, className = "") {
    const values = (items || []).filter(Boolean);
    return `<details class="curriculum-details ${className}"><summary>${escapeHtml(label)} <span>${values.length}</span></summary><div>${values.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div></details>`;
  }

  function renderAlignmentUnit({ level, unitNumber, unit }) {
    const alignment = unit.alignment || {};
    const objectives = alignment.objectives || {};
    const groups = alignment.vocabularyGroups || [];
    const totalTerms = alignment.extendedWords?.length || 0;
    const activeTerms = alignment.extendedWords?.filter((word) => word.active).length || 0;
    const skillItems = [["listening", "🎧 Nghe"], ["reading", "📖 Đọc"], ["speaking", "💬 Nói"], ["writing", "✍️ Viết"]].map(([key, label]) => `${label}: ${objectives[key] || "Chưa có dữ liệu"}`);
    return `<tr><td><span class="curriculum-level">LEVEL ${level}</span><b>Unit ${unitNumber}</b><small>${escapeHtml(alignment.benchmark || "")}</small></td><td><b>${escapeHtml(unit.title)}</b><small>${escapeHtml(unit.vi)}</small><small>${escapeHtml(unit.theme)}</small></td><td><b>${unit.words?.length || 0} từ học nhanh</b><small>${activeTerms}/${totalTerms} mục trọng tâm</small>${compactDetails("Xem nhóm từ", groups.map((group) => `${group.label} (${group.terms.length}): ${group.terms.join(", ")}`), "vocabulary")}</td><td><span class="coverage-ready">✓ Đã đối chiếu</span>${compactDetails("Xem mục tiêu", [objectives.grammar])}</td><td><span class="coverage-ready">✓ 4/4 kỹ năng</span>${compactDetails("Xem chi tiết", skillItems)}</td><td><b>${alignment.exerciseTypes?.length || 0} dạng</b>${compactDetails("Xem dạng bài", alignment.exerciseTypes)}</td><td><span class="coverage-licensed">🔒 Cần giấy phép</span>${compactDetails("Xem tài sản", alignment.licensedAssets)}</td></tr>`;
  }

  function renderAlignment() {
    if (!alignmentRows || !alignmentEmpty) return;
    const units = filteredAlignmentUnits();
    alignmentRows.innerHTML = units.map(renderAlignmentUnit).join("");
    alignmentEmpty.classList.toggle("hidden", units.length > 0);
    byId("alignmentUnits").textContent = `${units.length}/${curriculumUnits().length}`;
    byId("alignmentWords").textContent = number(units.reduce((total, item) => total + Number(item.unit.alignment?.extendedWords?.length || 0), 0));
  }

  function renderPendingRow(purchase) {
    const account = purchase.account || {};
    const selected = purchase.id === selectedPurchaseId ? " selected-row" : "";
    return `<tr class="selectable-row${selected}" data-purchase-select="${escapeHtml(purchase.id)}" tabindex="0">
      <td><b>@${escapeHtml(account.nickname || purchase.accountNickname || "chưa-có-nick")}</b><small>${escapeHtml(account.displayName || purchase.displayName || "Chưa có tên")}</small></td>
      <td><b>${escapeHtml(purchase.planName || "Chưa có tên gói")}</b><small>${number(purchase.durationMonths)} tháng</small></td>
      <td><b>${money(purchase.price)}</b><small>Chưa xác nhận tiền</small></td>
      <td><span class="transfer-code">${escapeHtml(purchase.transferContent || "Chưa có")}</span><small>${escapeHtml(purchase.orderId || purchase.id)}</small></td>
      <td><b>${date(purchase.createdAt)}</b><small>${escapeHtml(purchase.providerStatus || "Chờ đối chiếu")}</small></td>
      <td>${actionButtons(purchase)}</td>
    </tr>`;
  }

  function renderTransactionRow(purchase) {
    const account = purchase.account || {};
    const selected = purchase.id === selectedPurchaseId ? " selected-row" : "";
    return `<tr class="transaction-row selectable-row${selected}" data-purchase-select="${escapeHtml(purchase.id)}" tabindex="0">
      <td><span class="transaction-code">${escapeHtml(purchase.orderId || purchase.id)}</span></td>
      <td><b>@${escapeHtml(account.nickname || purchase.accountNickname || "chưa-có-nick")}</b><small>${escapeHtml(account.displayName || purchase.displayName || "Chưa có tên")}</small></td>
      <td><span class="transfer-code">${escapeHtml(purchase.transferContent || "Chưa có")}</span></td>
      <td><b>${money(purchase.price)}</b><small>${purchase.status === "paid" ? money(purchase.amountPaid || purchase.price) : "Chưa xác nhận"}</small></td>
      <td><span class="status-badge status-${escapeHtml(purchase.status)}">${statusLabel[purchase.status] || escapeHtml(purchase.status)}</span></td>
      <td><b>${date(purchase.confirmedAt || purchase.paidAt || purchase.updatedAt || purchase.createdAt)}</b></td>
    </tr>`;
  }

  function renderPlans() {
    const grid = byId("plansGrid");
    if (!grid) return;
    const plans = Array.isArray(payloadCache.plans) ? payloadCache.plans : [];
    byId("plansAvailableCount").textContent = number(plans.length);
    byId("plansActiveVip").textContent = number(payloadCache.summary?.vipActive);
    byId("plansTrialCount").textContent = number(payloadCache.summary?.trialActive);
    byId("plansRevenue").textContent = money(payloadCache.summary?.revenue);
    byId("plansTabCount").textContent = number(plans.length);
    if (!plans.length) {
      grid.innerHTML = `<div class="admin-empty"><p>Chưa tải được cấu hình gói thật từ hệ thống.</p></div>`;
      return;
    }
    grid.innerHTML = plans.map((plan, index) => {
      const purchases = payloadCache.purchases.filter((purchase) => purchase.planId === plan.id || purchase.planName === plan.name);
      const paid = purchases.filter((purchase) => purchase.status === "paid");
      const revenue = paid.reduce((sum, purchase) => sum + Number(purchase.amountPaid || purchase.price || 0), 0);
      const features = Array.isArray(plan.benefits) ? plan.benefits.slice(0, 6) : [];
      return `<article class="plan-card ${index === 1 ? "recommended" : ""}">
        <span class="plan-ribbon">${escapeHtml(plan.badge || (index === 1 ? "PHỔ BIẾN" : "GÓI THẬT"))}</span>
        <div class="plan-icon">${index === 0 ? "✦" : index === 1 ? "♛" : "◆"}</div>
        <h3>${escapeHtml(plan.name)}</h3>
        <div class="plan-price">${money(plan.price)} <small>/ ${number(plan.durationMonths)} tháng</small></div>
        <p class="plan-description">${escapeHtml(plan.purpose || "Gói VIP PRO MAX đang được hệ thống cung cấp.")}</p>
        <ul class="plan-features">${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
        <div class="plan-real-stats"><div><small>Đơn thật</small><b>${number(purchases.length)}</b></div><div><small>Doanh thu duyệt</small><b>${money(revenue)}</b></div></div>
      </article>`;
    }).join("");
  }

  function renderPendingPage() {
    const purchases = filteredPurchases("pending");
    if (pendingRows) pendingRows.innerHTML = purchases.map(renderPendingRow).join("");
    pendingEmpty?.classList.toggle("hidden", purchases.length > 0);
    byId("pendingPageCount").textContent = `${number(purchases.length)} đơn`;
    const selected = purchases.find((purchase) => purchase.id === selectedPurchaseId) || purchases[0] || null;
    if (selected) selectedPurchaseId = selected.id;
    renderOrderDetail(selected, "pendingSelectedDetail");
  }

  function renderTransactionsPage() {
    const purchases = filteredPurchases("transactions");
    if (transactionRows) transactionRows.innerHTML = purchases.map(renderTransactionRow).join("");
    transactionEmpty?.classList.toggle("hidden", purchases.length > 0);
    const pending = payloadCache.purchases.filter((purchase) => purchase.status === "pending").length;
    const paid = payloadCache.purchases.filter((purchase) => purchase.status === "paid").length;
    const rejected = payloadCache.purchases.filter((purchase) => purchase.status === "rejected").length;
    byId("transactionsPageCount").textContent = `${number(purchases.length)} giao dịch`;
    byId("transactionsPending").textContent = number(pending);
    byId("transactionsPaid").textContent = number(paid);
    byId("transactionsRejected").textContent = number(rejected);
    byId("transactionsRevenue").textContent = money(payloadCache.summary?.revenue);
    byId("transactionsTabCount").textContent = number(pending + paid);
    const selected = purchases.find((purchase) => purchase.id === selectedPurchaseId) || purchases[0] || null;
    if (selected) selectedPurchaseId = selected.id;
    renderOrderDetail(selected, "transactionSelectedDetail");
  }

  function renderReports() {
    const activities = collectActivities();
    const totalLearningEvents = payloadCache.accounts.reduce((sum, account) => sum + Number(account.learningProfile?.summary?.totalEvents || 0), 0);
    const totalMinutes = payloadCache.accounts.reduce((sum, account) => sum + Number(account.learningProfile?.summary?.totalMinutes || 0), 0);
    const paid = payloadCache.purchases.filter((purchase) => purchase.status === "paid").length;
    const decided = payloadCache.purchases.filter((purchase) => ["paid", "rejected"].includes(purchase.status)).length;
    byId("reportUsers").textContent = number(payloadCache.accounts.length);
    byId("reportLearningEvents").textContent = number(totalLearningEvents);
    byId("reportLearningMinutes").textContent = number(totalMinutes);
    byId("reportOrders").textContent = number(payloadCache.purchases.length);
    byId("reportApprovalRate").textContent = `${decided ? Math.round((paid / decided) * 100) : 0}%`;
    byId("reportRevenue").textContent = money(payloadCache.summary?.revenue);
    const list = byId("reportActivityList");
    if (list) list.innerHTML = activities.length ? activities.slice(0, 20).map((item) => `<div class="timeline-item"><span class="timeline-icon">${item.icon}</span><div class="timeline-body"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.detail)}</small></div><span class="timeline-time">${escapeHtml(shortTime(item.at))}</span></div>`).join("") : `<div class="admin-empty compact"><p>Chưa có hoạt động thật.</p></div>`;
    const distribution = byId("reportOrderDistribution");
    if (distribution) {
      const groups = [
        ["Chờ đối chiếu", "pending"], ["Đã xác nhận", "paid"], ["Đã từ chối", "rejected"], ["Hết hạn", "expired"],
      ].map(([label, status]) => ({ label, count: payloadCache.purchases.filter((purchase) => purchase.status === status).length }));
      const max = Math.max(1, ...groups.map((group) => group.count));
      distribution.innerHTML = payloadCache.purchases.length ? groups.map((group) => `<div class="distribution-row"><span>${group.label}</span><div class="distribution-bar"><i style="width:${Math.round((group.count / max) * 100)}%"></i></div><b>${number(group.count)}</b></div>`).join("") : `<div class="admin-empty compact"><p>Chưa có đơn hàng thật.</p></div>`;
    }
    renderAlignment();
  }

  function renderSettings() {
    byId("settingsStorageMode").textContent = payloadCache.database?.storageLabel || "DB dùng chung mọi phiên bản";
    byId("settingsRecords").textContent = number(payloadCache.database?.totalRecords || 0);
    byId("settingsUpdated").textContent = payloadCache.database?.updatedAt ? date(payloadCache.database.updatedAt) : "Chưa có dữ liệu";
    byId("settingsBackup").textContent = payloadCache.database?.backupCount ? `${number(payloadCache.database.backupCount)} bản · ${date(payloadCache.database.lastBackupAt)}` : "Chưa có bản sao";
    byId("settingsPayment").textContent = payloadCache.provider?.configured ? `Đã cấu hình ${payloadCache.provider.name || "ngân hàng"}` : "Chưa cấu hình đầy đủ";
    byId("settingsAi").textContent = byId("adminAiConnectionState")?.textContent || "Chưa kiểm tra";
  }

  function syncStatusFilterOptions() {
    if (!statusFilter) return;
    const accountMode = activeView === "accounts";
    const options = accountMode ? [["all", "Tất cả tài khoản"], ["logged-in", "Đã đăng nhập"], ["never-logged", "Chưa từng đăng nhập"], ["locked", "Đã khóa đăng nhập"], ["pending", "Có đơn chờ duyệt"], ["paid", "VIP đã kích hoạt"]] : [["all", "Tất cả trạng thái"], ["pending", "Chờ đối chiếu"], ["paid", "Đã xác nhận"], ["rejected", "Đã từ chối"], ["expired", "Hết hạn"]];
    const current = statusFilter.value;
    statusFilter.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    statusFilter.value = options.some(([value]) => value === current) ? current : "all";
  }

  function ensureSelections() {
    if (!payloadCache.accounts.some((account) => account.id === selectedAccountId)) selectedAccountId = payloadCache.accounts[0]?.id || "";
    if (!payloadCache.purchases.some((purchase) => purchase.id === selectedPurchaseId)) selectedPurchaseId = payloadCache.purchases[0]?.id || "";
  }

  function renderCurrentView() {
    if (!validViews.includes(activeView)) activeView = "overview";
    syncStatusFilterOptions();
    const panelMap = {
      overview: overviewPanel,
      pending: pendingPanel,
      accounts: accountsPanel,
      orders: ordersPanel,
      plans: plansPanel,
      transactions: transactionsPanel,
      connection: connectionPanel,
      reports: reportsPanel,
      settings: settingsPanel,
    };
    document.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.add("hidden"));
    panelMap[activeView]?.classList.remove("hidden");
    const toolbarViews = ["pending", "accounts", "orders", "transactions"];
    mainToolbar?.classList.toggle("hidden", !toolbarViews.includes(activeView));
    document.querySelectorAll(".admin-nav [data-admin-view]").forEach((button) => button.classList.toggle("active", button.dataset.adminView === activeView));
    const titles = {
      overview: ["Tổng quan hệ thống", "Dashboard"],
      pending: ["Đơn hàng chờ duyệt", "Đối chiếu và xác nhận đơn thật"],
      accounts: ["Quản lý người dùng", "Hồ sơ thật của từng tài khoản"],
      orders: ["Tất cả đơn hàng", "Toàn bộ lịch sử giao dịch trong database"],
      plans: ["Gói dịch vụ & VIP", "Cấu hình gói đang áp dụng"],
      transactions: ["Đối chiếu giao dịch", "Mã đơn, nội dung chuyển khoản và số tiền"],
      connection: ["Kết nối AI", "Trạng thái dịch vụ thực tế"],
      reports: ["Báo cáo & Thống kê", "Dữ liệu tổng hợp từ database thật"],
      settings: ["Cài đặt hệ thống", "Sao lưu và trạng thái cấu hình"],
    };
    if (pageTitle && pageSubtitle) [pageTitle.textContent, pageSubtitle.textContent] = titles[activeView];
    if (location.hash !== `#${activeView}`) history.replaceState(null, "", `#${activeView}`);

    if (activeView === "overview") {
      renderActivityChart();
      renderPackageDonut();
      renderRecentActivities();
      return;
    }
    if (activeView === "pending") {
      renderPendingPage();
      return;
    }
    if (activeView === "accounts") {
      const accounts = filteredAccounts();
      accountRows.innerHTML = accounts.map(renderAccount).join("");
      accountsEmpty?.classList.toggle("hidden", accounts.length > 0);
      const selected = accounts.find((account) => account.id === selectedAccountId) || accounts[0] || null;
      if (selected) selectedAccountId = selected.id;
      renderAccountProfile(selected);
      return;
    }
    if (activeView === "orders") {
      const purchases = filteredPurchases("orders");
      purchaseRows.innerHTML = purchases.map(renderPurchase).join("");
      ordersEmpty?.classList.toggle("hidden", purchases.length > 0);
      const selected = purchases.find((purchase) => purchase.id === selectedPurchaseId) || purchases[0] || null;
      if (selected) selectedPurchaseId = selected.id;
      renderOrderDetail(selected);
      renderAuditLog();
      return;
    }
    if (activeView === "plans") {
      renderPlans();
      return;
    }
    if (activeView === "transactions") {
      renderTransactionsPage();
      return;
    }
    if (activeView === "connection") {
      window.MILO_ADMIN_AI_CONNECTION_V60_24?.refresh?.();
      return;
    }
    if (activeView === "reports") {
      renderReports();
      return;
    }
    if (activeView === "settings") renderSettings();
  }

  function renderDashboard(payload) {
    payloadCache = {
      purchases: Array.isArray(payload.purchases) ? payload.purchases : [],
      accounts: Array.isArray(payload.accounts) ? payload.accounts : [],
      summary: payload.summary || {},
      database: payload.database || {},
      provider: payload.provider || {},
      plans: Array.isArray(payload.plans) ? payload.plans : [],
      commonFeatures: Array.isArray(payload.commonFeatures) ? payload.commonFeatures : [],
    };
    ensureSelections();
    const summary = payloadCache.summary;
    const setText = (id, value) => { const node = byId(id); if (node) node.textContent = value; };
    setText("summaryUsers", number(summary.totalUsers));
    setText("summaryLoggedIn", number(summary.loggedInUsers));
    setText("summaryPending", number(summary.pending));
    setText("summaryVip", number(summary.vipActive));
    setText("summaryTrial", number(summary.trialActive));
    setText("summaryPaid", number(summary.paid));
    setText("summaryRevenue", money(summary.revenue));
    setText("pendingTabCount", number(summary.pending));
    setText("ordersTabCount", number(payloadCache.purchases.length));
    setText("accountsTabCount", number(payloadCache.accounts.length));
    setText("plansTabCount", number(payloadCache.plans.length));
    setText("transactionsTabCount", number(payloadCache.purchases.filter((purchase) => ["pending", "paid"].includes(purchase.status)).length));
    setText("databaseRecords", `${number(payloadCache.database.totalRecords)} bản ghi`);
    setText("databaseUpdated", payloadCache.database.updatedAt ? date(payloadCache.database.updatedAt) : "Chưa có dữ liệu");
    setText("databaseStorageMode", payloadCache.database.storageLabel || "DB dùng chung mọi phiên bản");
    setText("databaseBackupStatus", payloadCache.database.backupCount ? `${number(payloadCache.database.backupCount)} bản · gần nhất ${date(payloadCache.database.lastBackupAt)}` : "Chưa có bản sao");
    setText("overviewDatabaseState", payloadCache.database.totalRecords >= 0 ? "Đang kết nối database" : "Chưa tải database");
    setText("overviewDatabaseUpdated", payloadCache.database.updatedAt ? date(payloadCache.database.updatedAt) : "Chưa có dữ liệu");
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    setText("reportNewAccounts", number(payloadCache.accounts.filter((account) => account.createdAt && new Date(account.createdAt).getTime() >= sevenDaysAgo).length));
    setText("reportLogins", number(payloadCache.accounts.reduce((sum, account) => sum + Number(account.loginCount || 0), 0)));
    const migratedFrom = Array.isArray(payloadCache.database.migratedFrom) ? payloadCache.database.migratedFrom : [];
    setText("databaseMigration", migratedFrom.length ? `Đã nhập dữ liệu thật từ: ${migratedFrom.join(", ")}.` : "Database hiện tại chỉ hiển thị các bản ghi đang được lưu thực tế.");
    const provider = byId("providerStatus");
    if (provider) {
      provider.textContent = payloadCache.provider.configured ? `Cấu hình nhận tiền ${payloadCache.provider.name || "ngân hàng"} đã sẵn sàng.` : "Cấu hình nhận tiền chưa đầy đủ.";
      provider.classList.toggle("provider-error", !payloadCache.provider.configured);
    }
    const pendingNotification = byId("pendingNotificationCount");
    if (pendingNotification) {
      pendingNotification.textContent = number(summary.pending);
      pendingNotification.classList.toggle("hidden", !Number(summary.pending));
    }
    const updatedText = `Cập nhật ${new Date().toLocaleTimeString("vi-VN")}`;
    setText("lastUpdated", updatedText);
    setText("accountsUpdated", updatedText);
    renderCurrentView();
  }

  async function load({ silent = false } = {}) {
    if (loading) return;
    loading = true;
    try {
      const [payload, planPayload] = await Promise.all([
        api("/api/admin/purchases"),
        api("/api/plans").catch(() => ({ plans: [], commonFeatures: [] })),
      ]);
      showApp();
      renderDashboard({ ...payload, ...planPayload });
      if (!silent) setStatus("");
    } catch (error) {
      const authError = /mật khẩu|cấu hình|unauthorized|credential/i.test(error.message);
      if (app?.classList.contains("hidden") || authError) {
        sessionStorage.removeItem(PASSWORD_KEY);
        password = "";
        showLogin(error.message);
      } else {
        setStatus(error.message, true);
      }
    } finally {
      loading = false;
    }
  }

  async function changeStatus(button) {
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (!action || !id) return;
    let body = {};
    if (action === "confirm") {
      const expected = button.dataset.content || "";
      const entered = window.prompt(`Chỉ duyệt khi ngân hàng đã nhận đủ tiền.\nNhập lại chính xác nội dung chuyển khoản:\n${expected}`);
      if (entered === null) return;
      if (entered.trim().toUpperCase() !== expected.toUpperCase()) {
        setStatus("Nội dung chuyển khoản không khớp. Đơn chưa được duyệt.", true);
        return;
      }
      if (!window.confirm("Xác nhận đã nhận ĐỦ TIỀN và kích hoạt đúng gói này?")) return;
      body = { verificationContent: entered.trim(), note: "Đã đối chiếu giao dịch thật trên trang quản trị" };
    } else if (!window.confirm("Từ chối đơn này? Người dùng sẽ phải tạo đơn mới.")) return;
    button.disabled = true;
    setStatus(action === "confirm" ? "Đang duyệt và kích hoạt gói…" : "Đang từ chối đơn…");
    try {
      await api(`/api/admin/purchases/${encodeURIComponent(id)}/${action}`, { method: "POST", body: JSON.stringify(body) });
      selectedPurchaseId = id;
      await load({ silent: true });
      if (activeView === "pending") closeDetail("pending");
      setStatus(action === "confirm" ? "Đã duyệt đơn và kích hoạt VIP PRO MAX." : "Đã từ chối đơn.");
      showToast(action === "confirm" ? "Đã duyệt đơn thật." : "Đã từ chối đơn.", "success");
    } catch (error) {
      setStatus(error.message, true);
      showToast(error.message, "error");
    } finally {
      button.disabled = false;
    }
  }

  async function backupDatabase() {
    const button = byId("backupDatabase");
    const old = button?.innerHTML;
    if (button) { button.disabled = true; button.innerHTML = "…"; }
    setStatus("Đang tạo bản sao database…");
    try {
      await api("/api/admin/database/backup", { method: "POST", body: "{}" });
      await load({ silent: true });
      setStatus("Đã sao lưu database tài khoản và đơn hàng.");
      showToast("Đã sao lưu database thành công.");
    } catch (error) {
      setStatus(error.message, true);
      showToast(error.message, "error");
    } finally {
      if (button) { button.disabled = false; button.innerHTML = old || "⚙️"; }
    }
  }

  async function changeAccountStatus(button) {
    const action = button.dataset.accountAction;
    const accountId = button.dataset.accountId;
    const nickname = button.dataset.accountNickname || "tài khoản";
    if (!action || !accountId) return;
    if (action === "reset-pin") {
      const suggested = String(Math.floor(100000 + Math.random() * 900000));
      const newPin = prompt(`Đặt PIN mới gồm 6 số cho @${nickname}. PIN cũ đã mã hóa nên không thể xem lại.`, suggested);
      if (newPin === null) return;
      if (!/^\d{6}$/.test(newPin)) return alert("PIN mới phải gồm đúng 6 chữ số.");
      button.disabled = true;
      try {
        const result = await api(`/api/admin/accounts/${accountId}/reset-pin`, { method: "POST", body: JSON.stringify({ pin: newPin }) });
        alert(`Đã đặt lại PIN cho @${nickname}.\nPIN mới: ${result.newPin}\nHãy gửi riêng PIN này cho phụ huynh.`);
        await load({ silent: true });
        setStatus(`Đã đặt lại PIN cho @${nickname}.`);
      } catch (error) { setStatus(error.message, true); } finally { button.disabled = false; }
      return;
    }
    if (action === "delete") {
      const typed = prompt(`Xóa sẽ mất hồ sơ, tiến độ và các đơn liên quan.\nNhập chính xác nick ${nickname} để xác nhận:`, "");
      if (typed === null) return;
      if (typed.trim().toLowerCase().replace(/^@/, "") !== nickname.toLowerCase()) return alert("Nick xác nhận không đúng. Tài khoản chưa bị xóa.");
      if (!confirm(`Xác nhận xóa vĩnh viễn @${nickname}?`)) return;
      button.disabled = true;
      try {
        await api(`/api/admin/accounts/${accountId}`, { method: "DELETE", body: JSON.stringify({ confirmNickname: nickname }) });
        selectedAccountId = "";
        await load({ silent: true });
        closeDetail("accounts");
        setStatus(`Đã xóa tài khoản @${nickname} và các đơn liên quan.`);
      } catch (error) { setStatus(error.message, true); } finally { button.disabled = false; }
      return;
    }
    const verb = action === "lock" ? "khóa đăng nhập" : "mở khóa";
    if (!confirm(`Xác nhận ${verb} tài khoản @${nickname}?`)) return;
    button.disabled = true;
    try {
      await api(`/api/admin/accounts/${accountId}/${action}`, { method: "POST" });
      selectedAccountId = accountId;
      await load({ silent: true });
      setStatus(action === "lock" ? `Đã khóa @${nickname}.` : `Đã mở khóa @${nickname}.`);
    } catch (error) { setStatus(error.message, true); } finally { button.disabled = false; }
  }

  function exportCurrentData() {
    let rows = [];
    let filename = "milo-du-lieu-that.csv";
    if (activeView === "accounts") {
      filename = "milo-nguoi-dung-that.csv";
      rows = [["Nick", "Tên học viên", "Mã học viên", "Lớp", "Nhân vật", "Lần đăng nhập", "Quyền AI", "Trạng thái", "Ngày tạo"], ...filteredAccounts().map((account) => [account.nickname, account.displayName, account.publicId, account.selectedGrade || "", account.selectedPetName || "", account.loginCount || 0, account.aiAccess?.planName || "AI Plus miễn phí", statusLabel[accountStatusOf(account)] || accountStatusOf(account), account.createdAt || ""])];
    } else if (["orders", "pending", "transactions"].includes(activeView)) {
      filename = activeView === "pending" ? "milo-don-cho-duyet.csv" : activeView === "transactions" ? "milo-doi-chieu-giao-dich.csv" : "milo-don-hang-that.csv";
      rows = [["Mã đơn", "Nick", "Tên học viên", "Gói", "Số tiền", "Nội dung chuyển khoản", "Trạng thái", "Ngày tạo"], ...filteredPurchases(activeView).map((purchase) => [purchase.orderId || purchase.id, purchase.account?.nickname || purchase.accountNickname || "", purchase.account?.displayName || purchase.displayName || "", purchase.planName || "", purchase.price || 0, purchase.transferContent || "", statusLabel[purchase.status] || purchase.status, purchase.createdAt || ""])];
    }
    if (!rows.length) return showToast("Không có dữ liệu để xuất.", "info");
    const csv = "\ufeff" + rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast("Đã xuất danh sách dữ liệu thật.");
  }

  function selectAccount(id) {
    const account = payloadCache.accounts.find((item) => item.id === id);
    if (!account) return;
    selectedAccountId = id;
    if (activeView !== "accounts") activeView = "accounts";
    openDetail("accounts");
    renderCurrentView();
  }

  function selectPurchase(id) {
    const purchase = payloadCache.purchases.find((item) => item.id === id);
    if (!purchase) return;
    selectedPurchaseId = id;
    if (!["orders", "pending", "transactions"].includes(activeView)) activeView = "orders";
    openDetail(activeView);
    renderCurrentView();
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = input?.value.trim() || "";
    if (!value) return showLogin("Vui lòng nhập mật khẩu quản trị.");
    const submit = form.querySelector("button[type='submit']");
    if (submit) { submit.disabled = true; submit.textContent = "Đang đăng nhập…"; }
    password = value;
    sessionStorage.setItem(PASSWORD_KEY, password);
    try { await load(); } finally { if (submit) { submit.disabled = false; submit.textContent = "Mở trang quản trị →"; } }
  });

  togglePasswordBtn?.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    togglePasswordBtn.textContent = isPassword ? "🙈" : "👁️";
  });

  function openView(view) {
    if (!validViews.includes(view)) return;
    closeAllDetails();
    activeView = view;
    if (statusFilter) statusFilter.value = "all";
    if (searchInput) searchInput.value = "";
    if (topbarSearch) topbarSearch.value = "";
    adminSidebar?.classList.remove("mobile-open");
    renderCurrentView();
  }

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-admin-view]");
    if (viewButton?.dataset.adminView) { event.preventDefault(); return openView(viewButton.dataset.adminView); }
    const detailClose = event.target.closest("[data-detail-close]");
    if (detailClose?.dataset.detailClose) { event.preventDefault(); return closeDetail(detailClose.dataset.detailClose); }
    const actionButton = event.target.closest("[data-account-action]");
    if (actionButton) { event.preventDefault(); event.stopPropagation(); return changeAccountStatus(actionButton); }
    const orderAction = event.target.closest("[data-action]");
    if (orderAction) { event.preventDefault(); event.stopPropagation(); return changeStatus(orderAction); }
    const accountSelect = event.target.closest("[data-account-select]");
    if (accountSelect?.dataset.accountSelect) { event.preventDefault(); return selectAccount(accountSelect.dataset.accountSelect); }
    const purchaseSelect = event.target.closest("[data-purchase-select]");
    if (purchaseSelect?.dataset.purchaseSelect) { event.preventDefault(); return selectPurchase(purchaseSelect.dataset.purchaseSelect); }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeDetailIsOpen()) {
      event.preventDefault();
      return closeDetail(activeView);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      const target = ["pending", "accounts", "orders", "transactions"].includes(activeView) ? searchInput : topbarSearch;
      target?.focus();
    }
    if (event.key === "Enter") {
      const row = event.target.closest("[data-account-select], [data-purchase-select]");
      if (row?.dataset.accountSelect) selectAccount(row.dataset.accountSelect);
      if (row?.dataset.purchaseSelect) selectPurchase(row.dataset.purchaseSelect);
    }
  });

  function syncSearch(source, target) {
    if (!source || !target) return;
    target.value = source.value;
    renderCurrentView();
  }
  searchInput?.addEventListener("input", () => syncSearch(searchInput, topbarSearch));
  topbarSearch?.addEventListener("input", () => syncSearch(topbarSearch, searchInput));
  statusFilter?.addEventListener("change", renderCurrentView);
  alignmentLevel?.addEventListener("change", renderCurrentView);
  byId("exportDataBtn")?.addEventListener("click", exportCurrentData);
  byId("refreshDataBanner")?.addEventListener("click", () => load());
  byId("pendingNotificationBtn")?.addEventListener("click", () => openView("pending"));
  byId("openSettingsBtn")?.addEventListener("click", () => openView("settings"));
  byId("backupDatabase")?.addEventListener("click", backupDatabase);

  sidebarCollapseBtn?.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 840px)").matches) {
      adminSidebar?.classList.toggle("mobile-open");
      return;
    }
    adminSidebar?.classList.toggle("collapsed");
    app?.classList.toggle("sidebar-collapsed", adminSidebar?.classList.contains("collapsed"));
  });

  window.addEventListener("hashchange", () => {
    const view = location.hash.replace(/^#/, "");
    if (validViews.includes(view) && view !== activeView) {
      activeView = view;
      renderCurrentView();
    }
  });

  const logoutHandler = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    password = "";
    if (input) input.value = "";
    showLogin();
    showToast("Đã đăng xuất khỏi hệ thống.", "info");
  };
  byId("logoutAdmin")?.addEventListener("click", (event) => { event.stopPropagation(); logoutHandler(); });
  byId("logoutAdminSidebar")?.addEventListener("click", logoutHandler);

  if (password) load(); else showLogin();
  setInterval(() => { if (password && !app?.classList.contains("hidden")) load({ silent: true }); }, 20000);
})();
