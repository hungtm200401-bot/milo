(function () {
  const PASSWORD_KEY = "milo-admin-password-v1";
  const login = document.querySelector("#adminLogin");
  const app = document.querySelector("#adminApp");
  const form = document.querySelector("#adminLoginForm");
  const input = document.querySelector("#adminPassword");
  const loginError = document.querySelector("#adminLoginError");
  const rows = document.querySelector("#purchaseRows");
  const empty = document.querySelector("#adminEmpty");
  const status = document.querySelector("#adminStatus");
  let password = sessionStorage.getItem(PASSWORD_KEY) || "";

  const money = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat("vi-VN", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";
  const statusLabel = {
    pending: "Chờ đối chiếu",
    paid: "Đã xác nhận",
    expired: "Hết hạn",
    rejected: "Đã từ chối",
  };
  const escapeHtml = (value) =>
    String(value || "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character],
    );

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
    } catch (netErr) {
      throw new Error("Không thể kết nối tới máy chủ. Vui lòng kiểm tra ứng dụng và thử lại.");
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || payload.error || "Không thể tải dữ liệu.");
    return payload;
  }

  function showApp() {
    login.classList.add("hidden");
    app.classList.remove("hidden");
  }

  function showLogin(message = "") {
    app.classList.add("hidden");
    login.classList.remove("hidden");
    loginError.textContent = message;
    setTimeout(() => input.focus(), 50);
  }

  function renderPurchase(purchase) {
    const account = purchase.account || {};
    const expiry = purchase.activeUntil
      ? `<small>Hết hạn: ${date(purchase.activeUntil)}</small>`
      : "";
    const actions =
      purchase.status === "pending"
        ? `<div class="order-buttons"><button data-action="confirm" data-id="${escapeHtml(purchase.id)}" data-content="${escapeHtml(purchase.transferContent)}">Xác nhận đã nhận tiền</button><button class="reject" data-action="reject" data-id="${escapeHtml(purchase.id)}">Từ chối</button></div>`
        : "—";
    return `<tr>
      <td><b>@${escapeHtml(account.nickname || "chưa-có-nick")}</b><small>${escapeHtml(account.displayName || purchase.displayName)}</small><small>${escapeHtml(account.publicId || purchase.accountPublicId)}</small></td>
      <td><b>Lớp ${Number(purchase.grade)}</b><small>${escapeHtml(purchase.petName)}</small></td>
      <td><b>${escapeHtml(purchase.planName)}</b><small>${Number(purchase.durationMonths)} tháng</small></td>
      <td><b>${money(purchase.price)}</b><small>${purchase.status === "paid" ? `Đã xác nhận đủ ${money(purchase.amountPaid)}` : "Chưa xác nhận"}</small></td>
      <td><span class="transfer-code">${escapeHtml(purchase.transferContent)}</span><small>${escapeHtml(purchase.orderId)} · ${escapeHtml(purchase.bankName)}</small></td>
      <td><span class="status-badge status-${escapeHtml(purchase.status)}">${statusLabel[purchase.status] || escapeHtml(purchase.status)}</span>${expiry}</td>
      <td><b>Tạo: ${date(purchase.createdAt)}</b><small>${purchase.paidAt ? `Xác nhận: ${date(purchase.paidAt)}` : "Đang chờ đối chiếu"}</small></td>
      <td>${actions}</td>
    </tr>`;
  }

  async function load() {
    try {
      const payload = await api("/api/admin/purchases");
      showApp();
      document.querySelector("#summaryUsers").textContent =
        payload.summary.totalUsers;
      document.querySelector("#summaryPending").textContent =
        payload.summary.pending;
      document.querySelector("#summaryPaid").textContent =
        payload.summary.paid;
      document.querySelector("#summaryRevenue").textContent = money(
        payload.summary.revenue,
      );
      const provider = document.querySelector("#providerStatus");
      provider.textContent = payload.provider?.configured
        ? `QR ${payload.provider.name} đã sẵn sàng.`
        : "Chưa tìm thấy ảnh QR ngân hàng trong .env.";
      provider.classList.toggle("provider-error", !payload.provider?.configured);
      rows.innerHTML = payload.purchases.map(renderPurchase).join("");
      empty.classList.toggle("hidden", payload.purchases.length > 0);
      document.querySelector("#lastUpdated").textContent =
        `Cập nhật ${new Date().toLocaleTimeString("vi-VN")}`;
      status.textContent = "";
      status.classList.remove("error");
    } catch (error) {
      if (app.classList.contains("hidden") || /mật khẩu|cấu hình|kết nối|tên đăng nhập/i.test(error.message)) {
        sessionStorage.removeItem(PASSWORD_KEY);
        password = "";
        showLogin(error.message);
        return;
      }
      status.textContent = error.message;
      status.classList.add("error");
    }
  }

  async function changeStatus(button) {
    const action = button.dataset.action;
    const id = button.dataset.id;
    let body = {};
    if (action === "confirm") {
      const expected = button.dataset.content;
      const entered = window.prompt(
        `Chỉ tiếp tục nếu ngân hàng đã nhận đủ tiền.\nNhập lại chính xác nội dung chuyển khoản:\n${expected}`,
      );
      if (entered === null) return;
      if (entered.trim().toUpperCase() !== expected.toUpperCase()) {
        status.textContent =
          "Nội dung nhập lại không khớp. Trợ lý AI chưa được kích hoạt.";
        status.classList.add("error");
        return;
      }
      if (
        !window.confirm(
          "Anh xác nhận tài khoản ngân hàng đã nhận ĐỦ TIỀN của đúng đơn này?",
        )
      ) {
        return;
      }
      body = {
        verificationContent: entered.trim(),
        note: "Đã đối chiếu tài khoản ngân hàng",
      };
    } else if (
      !window.confirm("Từ chối đơn này? Người dùng sẽ phải tạo đơn mới.")
    ) {
      return;
    }
    status.textContent = "Đang cập nhật đơn…";
    status.classList.remove("error");
    try {
      await api(`/api/admin/purchases/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await load();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("error");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const val = input.value.trim();
    if (!val) {
      showLogin("Vui lòng nhập mật khẩu quản trị.");
      return;
    }
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang đăng nhập…";
    }
    loginError.textContent = "";
    password = val;
    sessionStorage.setItem(PASSWORD_KEY, password);
    try {
      await load();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Mở trang quản trị →";
      }
    }
  });
  rows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (button) changeStatus(button);
  });
  document.querySelector("#refreshAdmin").onclick = load;
  document.querySelector("#logoutAdmin").onclick = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    password = "";
    input.value = "";
    showLogin();
  };

  if (password) load();
  else showLogin();
  setInterval(() => {
    if (password && !app.classList.contains("hidden")) load();
  }, 15000);
})();
