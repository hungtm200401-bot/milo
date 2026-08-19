// V58 — khóa học miễn phí; thanh toán chỉ kích hoạt Trợ lý AI Pro Max.
(function () {
  const PROFILE_KEY = "milo-child-profile-v1";
  const TOKEN_KEY = "milo-commerce-token-v1";
  const LOCK_KEY = "milo-commerce-grade-lock-v1";
  const ACCESS_KEY = "milo-commerce-access-v1";
  const SUCCESS_KEY = "milo-commerce-last-success-v1";
  const LAST_NICKNAME_KEY = "milo-last-nickname-v1";
  const planGrid = document.querySelector("#premiumPlanGrid");
  const accountSummary = document.querySelector("#commerceAccountSummary");
  const orderStatus = document.querySelector("#purchaseOrderStatus");
  const transferDetails = document.querySelector("#commerceTransferDetails");
  const paymentButton = document.querySelector("#continuePremiumPayment");
  const paymentModal = document.querySelector("#premiumPaymentModal");
  const paymentError = document.querySelector("#premiumPaymentError");
  const commonBenefitsList = document.querySelector("#aiCommonBenefitsList");
  const trialOffer = document.querySelector("#aiTrialOffer");
  let plans = [];
  let commonFeatures = [];
  let provider = null;
  let selectedPlanId = "plus";
  let accountPayload = null;
  let busy = false;
  let qrObjectUrl = "";
  let revealedOrderId = "";
  let purchaseConfirmModal = null;

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
  const money = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
          new Date(value),
        )
      : "—";
  const childIcon = (gender) =>
    gender === "boy" ? "👦" : gender === "girl" ? "👧" : "🧒";
  const readJson = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  const profile = () => readJson(PROFILE_KEY);
  const gradeLock = () => readJson(LOCK_KEY);
  const token = () => localStorage.getItem(TOKEN_KEY) || "";
  const planById = (id) => plans.find((plan) => plan.id === id);
  const displayPlanName = (value = "", planId = "") =>
    planById(planId)?.name ||
    ({
      "Milo AI Starter": "VIP PRO MAX 1 tháng",
      "Milo AI Plus": "VIP PRO MAX 3 tháng",
      "Milo AI Premium": "VIP PRO MAX 6 tháng",
      "Milo AI Plus miễn phí": "AI Plus miễn phí",
    })[value] ||
    value;
  const currentPurchase = () => accountPayload?.latestPurchase || null;
  const isOpenPurchase = (purchase) =>
    purchase?.status === "pending";
  const setError = (message = "") => {
    if (paymentError) paymentError.textContent = message;
  };
  const toast = (message) => {
    if (typeof showToast === "function") showToast(message);
  };

  function renderProviderStatus() {
    const box = document.querySelector("#paymentConfigStatus");
    if (!box) return;
    if (!provider) {
      box.className = "payment-config-status status-loading";
      box.innerHTML = "<b>Đang kiểm tra kênh thanh toán…</b><small>Milo đang kết nối thông tin thanh toán.</small>";
      return;
    }
    if (!provider.configured) {
      box.className = "payment-config-status status-error";
      box.innerHTML = `<b>Thanh toán đang được chuẩn bị</b><small>Phụ huynh vui lòng thử lại sau.</small>`;
      return;
    }
    if (provider.mode === "manual") {
      box.className = "payment-config-status status-warning";
      box.innerHTML = `<b>Chuyển khoản thủ công đã sẵn sàng</b><small>${escapeHtml(provider.bankName)} · ${escapeHtml(provider.accountNumber)}. Chưa có ảnh QR; phụ huynh vẫn tạo đơn và chuyển khoản bằng số tài khoản.</small>`;
      return;
    }
    box.className = "payment-config-status status-ready";
    box.innerHTML = `<b>Thanh toán và QR đã sẵn sàng</b><small>${escapeHtml(provider.bankName)} · ${escapeHtml(provider.accountNumber)}.</small>`;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "Không thể kết nối máy chủ Milo.");
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function saveLock(account) {
    if (!account?.selectedGrade) return;
    const lock = {
      grade: Number(account.selectedGrade),
      petId: account.selectedPetId,
      petName: account.selectedPetName,
      accountPublicId: account.publicId,
      nickname: account.nickname,
    };
    localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
    localStorage.setItem(`milo-selected-pet-${lock.grade}`, lock.petId);
    localStorage.setItem(`milo-pet-locked-${lock.grade}`, "1");
    applyCourseLock();
  }

  function saveAccess(payload) {
    const account = payload?.account;
    const aiAccess = payload?.aiAccess;
    if (
      !account ||
      !aiAccess?.active ||
      (aiAccess.activeUntil &&
        new Date(aiAccess.activeUntil).getTime() <= Date.now())
    ) {
      localStorage.removeItem(ACCESS_KEY);
      return;
    }
    localStorage.setItem(
      ACCESS_KEY,
      JSON.stringify({
        accountPublicId: account.publicId,
        nickname: account.nickname,
        grade: Number(account.selectedGrade),
        petId: account.selectedPetId,
        active: true,
        accessLevel: aiAccess.accessLevel,
        planId: aiAccess.planId,
        planName: displayPlanName(aiAccess.planName, aiAccess.planId),
        allAssistants: aiAccess.allAssistants,
        activeUntil: aiAccess.activeUntil,
        verifiedBy: "milo-server",
      }),
    );
    window.dispatchEvent(
      new CustomEvent("milo:access-updated", { detail: aiAccess }),
    );
  }

  function applyCourseLock() {
    const lock = gradeLock();
    if (!lock?.grade) return;
    window.MILO_AI_PROFILE = Object.freeze({
      grade: Number(lock.grade),
      petId: lock.petId,
      petName: lock.petName,
      nickname: lock.nickname,
    });
    // Không khóa bộ chọn lớp: lớp 2–5, bài học, game và bài kiểm tra đều miễn phí.
  }

  function accountStatusText(account) {
    const aiAccess = accountPayload?.aiAccess;
    if (aiAccess?.accessLevel === "vip-pro-max") {
      return `VIP PRO MAX hoạt động đến ${date(aiAccess.activeUntil)}`;
    }
    if (aiAccess?.accessLevel === "vip-pro-max-trial") {
      return `Đang thử toàn bộ VIP PRO MAX đến ${date(aiAccess.activeUntil)}`;
    }
    const labels = {
      new: "AI Plus miễn phí đang hoạt động",
      pending: "Gói AI đang chờ quản trị viên đối chiếu chuyển khoản",
      active: `VIP PRO MAX hoạt động đến ${date(account?.activeUntil)}`,
      expired: "Gói trả phí đã hết hạn · AI Plus miễn phí vẫn hoạt động",
      rejected: "Đơn chưa được duyệt · AI Plus miễn phí vẫn hoạt động",
    };
    return labels[account?.status] || "Chưa đăng nhập";
  }

  function renderAccount() {
    if (!accountSummary) return;
    const account = accountPayload?.account;
    const entitlement = accountPayload?.entitlement;
    const aiAccess = accountPayload?.aiAccess;
    const lock = gradeLock();
    if (!account) {
      accountSummary.innerHTML =
        '<span class="summary-avatar">✦</span><div><em>TÀI KHOẢN HỌC VIÊN</em><b>Khóa học và AI Plus đang mở miễn phí</b><small>Đăng nhập để trò chuyện, luyện phát âm và nhận sửa lỗi trực tiếp.</small></div><i class="summary-status status-new">CHƯA ĐĂNG NHẬP</i>';
      renderProfileCard();
      return;
    }
    const grade = account.selectedGrade || lock?.grade;
    const petName = account.selectedPetName || lock?.petName || "chưa chọn";
    const planLine = aiAccess?.active
      ? `${displayPlanName(aiAccess.planName, aiAccess.planId)}${aiAccess.activeUntil ? ` · đến ${date(aiAccess.activeUntil)}` : ""}`
      : accountStatusText(account);
    accountSummary.innerHTML = `<span class="summary-avatar">${childIcon(account.gender)}</span><div><em>HỒ SƠ HỌC VIÊN · ${escapeHtml(account.publicId)}</em><b>${escapeHtml(account.displayName)} <small>@${escapeHtml(account.nickname)}</small></b><strong>${grade ? `Lớp ${Number(grade)} · Pet ${escapeHtml(petName)} · ` : ""}${escapeHtml(planLine)}</strong></div><i class="summary-status status-${aiAccess?.active ? "active" : account.status}">${aiAccess?.active ? "AI ĐANG HOẠT ĐỘNG" : "CHƯA ĐĂNG NHẬP"}</i>`;
    renderProfileCard();
  }

  function renderProfileCard() {
    const card = document.querySelector("#accountPlanSnapshot");
    if (!card) return;
    const account = accountPayload?.account;
    const entitlement = accountPayload?.entitlement;
    const aiAccess = accountPayload?.aiAccess;
    const purchase = currentPurchase();
    if (!account) {
      card.className = "account-plan-snapshot premium-profile-card status-new";
      card.innerHTML = `
        <div class="membership-head">
          <span class="membership-avatar">🦊</span>
          <div><small>MILO PRIVATE ACADEMY</small><b>Khóa học miễn phí đã sẵn sàng</b></div>
          <em>NEW</em>
        </div>
        <div class="membership-empty">
          <strong>Tạo nick riêng cho bé</strong>
          <small>Hồ sơ hiển thị mã học viên, lớp, pet và trạng thái Trợ lý AI ngay tại đây.</small>
        </div>
        <div class="membership-number">MILO •••• ••••</div>`;
      return;
    }
    const status = aiAccess?.active ? "active" : account.status;
    const packageText = aiAccess?.active
      ? `${displayPlanName(aiAccess.planName, aiAccess.planId)}${aiAccess.activeUntil ? ` · dùng đến ${date(aiAccess.activeUntil)}` : " · không giới hạn thời gian"}`
      : isOpenPurchase(purchase)
        ? `${displayPlanName(purchase.planName, purchase.planId)} · đang chờ xác nhận chuyển khoản`
        : "AI Plus miễn phí";
    const statusLabel = aiAccess?.active
      ? aiAccess.accessLevel === "plus"
        ? "PLUS"
        : "VIP MAX"
      : isOpenPurchase(purchase)
        ? "PENDING"
        : "MEMBER";
    const grade = account.selectedGrade
      ? `Lớp ${Number(account.selectedGrade)}`
      : "Chưa chọn lớp";
    const pet = account.selectedPetName || "Chưa chọn pet";
    card.className = `account-plan-snapshot premium-profile-card status-${status}`;
    card.innerHTML = `
      <div class="membership-head">
        <span class="membership-avatar">${childIcon(account.gender)}</span>
        <div><small>MILO PRIVATE ACADEMY</small><b>${escapeHtml(account.displayName)}</b><i>@${escapeHtml(account.nickname)}</i></div>
        <em>${statusLabel}</em>
      </div>
      <div class="membership-grid">
        <span><small>MÃ HỌC VIÊN</small><b>${escapeHtml(account.publicId)}</b></span>
        <span><small>LỚP ĐANG HỌC</small><b>${escapeHtml(grade)}</b></span>
        <span><small>NGƯỜI BẠN ĐỒNG HÀNH</small><b>${escapeHtml(pet)}</b></span>
        <span><small>GÓI TRỢ LÝ AI</small><b>${escapeHtml(packageText)}</b></span>
      </div>
      <div class="membership-status"><span></span><div><b>${escapeHtml(accountStatusText(account))}</b><small>AI Plus giúp con hỏi bài, luyện nói và sửa phát âm mỗi ngày; VIP PRO MAX ghi nhớ điểm yếu và cá nhân hóa lộ trình.</small></div></div>
      <div class="membership-footer"><code>${escapeHtml(account.publicId.replaceAll("-", " "))}</code><button type="button" data-account-logout>Đăng xuất an toàn</button></div>`;
  }

  function planSaving(plan) {
    const base = 299000 * Number(plan.durationMonths);
    return Math.max(0, base - Number(plan.price));
  }

  function renderPlans() {
    if (!planGrid) return;
    if (!plans.length) {
      planGrid.innerHTML =
        '<div class="plan-loading">Đang tải ba gói VIP PRO MAX…</div>';
      return;
    }
    planGrid.innerHTML = plans
      .map((plan) => {
        const monthly = Math.round(plan.price / plan.durationMonths);
        const saving = planSaving(plan);
        const selected = plan.id === selectedPlanId;
        const planOnlyBenefits = plan.benefits.filter(
          (benefit) => !commonFeatures.includes(benefit),
        );
        return `<button type="button" class="premium-plan-card ${selected ? "selected" : ""} ${plan.id === "plus" ? "featured" : ""}" data-plan-id="${escapeHtml(plan.id)}" aria-pressed="${selected}">
          <span class="plan-badge">${escapeHtml(plan.badge)}</span>
          <strong>${escapeHtml(plan.name)}</strong>
          <div class="plan-price"><b>${money(plan.price)}</b><small>${Number(plan.durationMonths)} tháng · khoảng ${money(monthly)}/tháng</small></div>
          ${saving ? `<em>Tiết kiệm ${money(saving)}</em>` : "<em>Trải nghiệm AI đầy đủ</em>"}
          <p>${escapeHtml(plan.purpose)}</p>
          <ul>${planOnlyBenefits.map((benefit) => `<li>✓ ${escapeHtml(benefit)}</li>`).join("")}</ul>
          <i>${selected ? "✓ Đang chọn gói này" : "Chọn gói này"}</i>
        </button>`;
      })
      .join("");
    planGrid.querySelectorAll("[data-plan-id]").forEach((card) => {
      card.addEventListener("click", () => {
        selectedPlanId = card.dataset.planId;
        setError("");
        renderPlans();
        updatePaymentButton();
        document.querySelector("#continuePremiumPayment")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function renderTrialOffer() {
    if (!trialOffer) return;
    const account = accountPayload?.account;
    const aiAccess = accountPayload?.aiAccess;
    if (!account) {
      trialOffer.innerHTML = `
        <div><span>🎁</span><section><small>GÓI THỬ 1 NGÀY</small><b>Mở toàn bộ trợ lý AI VIP PRO MAX</b><p>Đăng nhập tài khoản học viên để nhận đúng 24 giờ trải nghiệm.</p></section></div>
        <button type="button" data-start-ai-trial>Đăng nhập để dùng thử</button>`;
      return;
    }
    if (aiAccess?.accessLevel === "vip-pro-max") {
      trialOffer.innerHTML = `
        <div><span>👑</span><section><small>VIP PRO MAX</small><b>Tài khoản đã mở toàn bộ trợ lý AI</b><p>Gói trả phí đang hoạt động đến ${date(aiAccess.activeUntil)}.</p></section></div>
        <button type="button" disabled>Đang sử dụng</button>`;
      return;
    }
    if (aiAccess?.accessLevel === "vip-pro-max-trial") {
      trialOffer.innerHTML = `
        <div><span>⚡</span><section><small>ĐANG DÙNG THỬ 24 GIỜ</small><b>Toàn bộ trợ lý AI VIP PRO MAX đã mở</b><p>Gói thử hoạt động đến ${date(aiAccess.activeUntil)}. Bé vẫn có thể chọn gói 1, 3 hoặc 6 tháng ngay bây giờ để tiếp tục sau khi hết thời gian thử.</p></section></div>
        <button type="button" data-show-paid-plans>Chọn gói 1/3/6 tháng</button>`;
      return;
    }
    if (aiAccess?.trialUsed) {
      trialOffer.innerHTML = `
        <div><span>✓</span><section><small>GÓI THỬ ĐÃ SỬ DỤNG</small><b>AI Plus miễn phí vẫn hoạt động</b><p>Bé vẫn được hỏi bài, trò chuyện và luyện phát âm mỗi ngày với AI Plus. Chọn gói trả phí để mở lại toàn bộ VIP PRO MAX.</p></section></div>
        <button type="button" data-show-paid-plans>Chọn gói 1/3/6 tháng</button>`;
      return;
    }
    trialOffer.innerHTML = `
      <div><span>🎁</span><section><small>MIỄN PHÍ 1 LẦN · ĐỦ 24 GIỜ</small><b>Dùng thử hoặc mua VIP PRO MAX</b><p>API hoạt động chỉ giúp AI Plus sẵn sàng; không tự kích hoạt VIP. Phụ huynh có thể dùng thử 24 giờ hoặc chọn ngay gói 1, 3 hay 6 tháng.</p></section></div>
      <div class="trial-offer-actions"><button type="button" data-start-ai-trial>Dùng thử 24 giờ</button><button type="button" data-show-paid-plans>Chọn gói trả phí</button></div>`;
  }

  function renderCommonFeatures() {
    if (!commonBenefitsList) return;
    commonBenefitsList.innerHTML = commonFeatures
      .map(
        (feature) =>
          `<span>✓ ${escapeHtml(feature)}</span>`,
      )
      .join("");
  }

  function purchaseStatusCopy(purchase) {
    const statuses = {
      pending: {
        icon: "⏳",
        title: "Đơn đang chờ chuyển khoản",
        copy:
          "Sau khi chuyển tiền, quản trị viên sẽ đối chiếu đúng số tiền và nội dung rồi xác nhận.",
      },
      paid: {
        icon: "✅",
        title: `Thanh toán ${displayPlanName(purchase.planName, purchase.planId)} thành công`,
        copy: `Trợ lý AI cho lớp ${purchase.grade} dùng đến ${date(purchase.activeUntil)}. Khóa học vẫn miễn phí.`,
      },
      rejected: {
        icon: "✕",
        title: "Đơn chưa được chấp nhận",
        copy: "Trợ lý AI chưa mở. Khóa học lớp 2–5 vẫn sử dụng miễn phí.",
      },
    };
    return (
      statuses[purchase.status] || {
        icon: "ℹ️",
        title: purchase.status,
        copy: "",
      }
    );
  }

  function renderOrder() {
    const purchase = currentPurchase();
    if (!orderStatus) return;
    if (!purchase || purchase.status === "cancelled") {
      orderStatus.classList.add("hidden");
      orderStatus.innerHTML = "";
      if (transferDetails) transferDetails.innerHTML = "";
      hidePaymentChannel();
      updatePaymentButton();
      return;
    }
    const statusCopy = purchaseStatusCopy(purchase);
    const isRevealed = revealedOrderId === purchase.orderId;
    orderStatus.className = `purchase-order-status status-${purchase.status}`;
    orderStatus.innerHTML = `<span>${statusCopy.icon}</span><div><b>${escapeHtml(statusCopy.title)}</b><small>${escapeHtml(statusCopy.copy)}</small><code>${escapeHtml(purchase.orderId)}</code>${isOpenPurchase(purchase) ? `<span class="pending-order-actions"><button type="button" class="pending-order-toggle" data-toggle-pending-order>${isRevealed ? "Ẩn thông tin chuyển khoản" : "Xem bill đã xác nhận"}</button><button type="button" class="pending-order-cancel" data-cancel-pending-order>Hủy đơn chờ</button></span>` : ""}</div>`;
    if (isOpenPurchase(purchase) && isRevealed) {
      if (transferDetails) {
        transferDetails.innerHTML = `
          <span>Ngân hàng</span>
          <b>${escapeHtml(purchase.bankName)}</b>
          <span>Số tài khoản</span>
          <code>${escapeHtml(purchase.bankAccountNumber)}</code>
          ${purchase.bankAccountLabel ? `<small>Chủ tài khoản: ${escapeHtml(purchase.bankAccountLabel)}</small>` : ""}
          <b>Số tiền: ${money(purchase.price)}</b>
          <span>Nội dung chuyển khoản</span>
          <code>${escapeHtml(purchase.transferContent)}</code>
          <small>Đây là bill đã được phụ huynh xác nhận tạo. Chỉ chuyển tiền sau khi kiểm tra đúng gói, số tiền và nội dung.</small>`;
      }
      showPaymentChannel(purchase);
    } else {
      if (transferDetails) transferDetails.innerHTML = "";
      hidePaymentChannel();
    }
    orderStatus.querySelector("[data-toggle-pending-order]")?.addEventListener("click", () => {
      revealedOrderId = isRevealed ? "" : purchase.orderId;
      renderOrder();
    });
    orderStatus.querySelector("[data-cancel-pending-order]")?.addEventListener("click", async () => {
      if (!window.confirm("Hủy đơn đang chờ này? Không có khoản thanh toán nào được xác nhận.")) return;
      try {
        accountPayload = await api(`/api/purchases/${encodeURIComponent(purchase.id)}/cancel`, { method: "POST" });
        revealedOrderId = "";
        renderAccount();
        renderPlans();
        renderOrder();
        toast("Đã hủy đơn chờ. Bạn có thể chọn lại bất kỳ gói nào.");
      } catch (error) {
        setError(error.message);
      }
    });
    updatePaymentButton();
  }

  function hidePaymentChannel() {
    document.querySelector("#premiumPaymentQr")?.classList.add("hidden");
    document.querySelector("#homePaymentQr")?.classList.add("hidden");
  }

  async function authenticatedQrSource(path) {
    if (!path) return "";
    const response = await fetch(path, {
      headers: token() ? { Authorization: `Bearer ${token()}` } : {},
      cache: "no-store",
    });
    if (!response.ok) return "";
    const blob = await response.blob();
    if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
    qrObjectUrl = URL.createObjectURL(blob);
    return qrObjectUrl;
  }

  async function showPaymentChannel(purchase) {
    const modalQrCard = document.querySelector("#premiumPaymentQr");
    const homeQrCard = document.querySelector("#homePaymentQr");
    const modalQrImage = document.querySelector("#premiumPaymentQrImage");
    const homeQrImage = document.querySelector("#homePaymentQrImage");
    const modalQrLink = document.querySelector("#premiumPaymentQrLink");
    const homeQrLink = document.querySelector("#homePaymentQrLink");
    [modalQrLink, homeQrLink].forEach((link) => {
      if (!link) return;
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
    });
    const source = await authenticatedQrSource(purchase.qrImage);
    if (modalQrCard) {
      modalQrCard.classList.remove("hidden");
      modalQrCard.classList.toggle("manual-transfer", !source);
      const title = modalQrCard.querySelector(":scope > span");
      const note = modalQrCard.querySelector(":scope > small");
      if (title) title.textContent = source
        ? "QUÉT BẰNG ỨNG DỤNG NGÂN HÀNG"
        : "CHUYỂN KHOẢN THỦ CÔNG";
      if (note) note.textContent = source
        ? "Quét QR ngân hàng, sau đó nhập đúng số tiền và nội dung riêng của đơn hiển thị bên dưới."
        : "Mở ứng dụng ngân hàng, nhập đúng số tài khoản, số tiền và nội dung chuyển khoản của đơn bên dưới.";
    }
    if (modalQrLink) modalQrLink.classList.toggle("hidden", !source);
    if (source && modalQrImage) modalQrImage.src = source;
    if (source && homeQrImage) homeQrImage.src = source;
    if (homeQrCard) {
      if (!source) {
        homeQrCard.classList.add("hidden");
      } else {
        const title = document.querySelector("#homePaymentQrTitle");
        const price = document.querySelector("#homePaymentQrPrice");
        if (title)
          title.textContent = `Chuyển khoản ${displayPlanName(purchase.planName, purchase.planId)} trực tiếp`;
        if (price)
          price.textContent = `${money(purchase.price)} · ${purchase.transferContent}`;
        homeQrCard.classList.remove("hidden");
      }
    }
  }

  function updatePaymentButton() {
    if (!paymentButton) return;
    const purchase = currentPurchase();
    if (busy) {
      paymentButton.disabled = true;
      paymentButton.textContent = "Đang tạo đơn chuyển khoản…";
      return;
    }
    if (provider && !provider.configured) {
      paymentButton.disabled = false;
      paymentButton.textContent = "Kiểm tra cấu hình thanh toán";
      return;
    }
    paymentButton.disabled = false;
    const account = accountPayload?.account;
    const selectedName = planById(selectedPlanId)?.name || "gói đã chọn";
    paymentButton.textContent = isOpenPurchase(purchase)
      ? `Xác nhận đổi bill sang ${selectedName}`
      : account?.status === "active"
        ? `Xác nhận gia hạn ${selectedName}`
        : `Xác nhận mua ${selectedName}`;
  }

  async function loadPlans() {
    if (plans.length) return;
    renderPlans();
    try {
      const payload = await api("/api/plans");
      plans = Array.isArray(payload.plans) ? payload.plans : [];
      commonFeatures = Array.isArray(payload.commonFeatures)
        ? payload.commonFeatures
        : [];
      if (!planById(selectedPlanId)) selectedPlanId = plans[0]?.id || "";
      renderCommonFeatures();
      renderPlans();
      updatePaymentButton();
    } catch (error) {
      if (planGrid) {
        planGrid.innerHTML = `<div class="plan-loading error">${escapeHtml(error.message)} Hãy mở app bằng CHAY_APP.bat.</div>`;
      }
    }
  }

  async function loadProvider() {
    try {
      provider = await api("/api/payment-provider");
      renderProviderStatus();
      updatePaymentButton();
      return provider;
    } catch (error) {
      provider = { configured: false, error: error.message, missing: [] };
      renderProviderStatus();
      updatePaymentButton();
      return provider;
    }
  }

  async function saveProfile(input) {
    if (input.createNew) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(LOCK_KEY);
      localStorage.removeItem(SUCCESS_KEY);
      [2, 3, 4, 5].forEach((grade) => {
        localStorage.removeItem(`milo-pet-locked-${grade}`);
        localStorage.removeItem(`milo-selected-pet-${grade}`);
      });
      accountPayload = null;
    }
    const result = await api("/api/account/register", {
      method: "POST",
      body: JSON.stringify({
        displayName: input.displayName,
        nickname: input.nickname,
        pin: input.pin,
        currentPin: input.createNew ? "" : input.currentPin,
        gender: input.gender,
      }),
    });
    if (input.createNew) {
      localStorage.setItem(LAST_NICKNAME_KEY, result.account.nickname);
      localStorage.removeItem(TOKEN_KEY);
      accountPayload = null;
      renderAccount();
      return { ...result.account, requiresLogin: true };
    }
    if (result.token) localStorage.setItem(TOKEN_KEY, result.token);
    accountPayload = {
      account: result.account,
      entitlement: {
        active: false,
        planId: "",
        planName: "",
        activeUntil: null,
        features: [],
      },
      aiAccess: {
        active: true,
        accessLevel: "plus",
        planId: "free-plus",
        planName: "AI Plus miễn phí",
        allAssistants: false,
        activeUntil: null,
        trialAvailable: true,
        trialUsed: false,
        features: [],
      },
      latestPurchase: null,
      purchases: [],
    };
    await refreshAccount({ quiet: true });
    return result.account;
  }

  async function refreshAccount({ quiet = false } = {}) {
    if (!token()) {
      accountPayload = null;
      localStorage.removeItem(ACCESS_KEY);
      renderAccount();
      renderTrialOffer();
      return null;
    }
    try {
      accountPayload = await api("/api/account");
      document.documentElement.classList.remove("milo-auth-checking");
      document.body.classList.remove("milo-auth-required");
      document.querySelector("#accountLoginModal")?.classList.add("hidden");
      // Đồng bộ nền tuyệt đối không được tự đóng cửa sổ Hồ sơ/Đăng ký.
      // Chỉ các thao tác người dùng (Đóng, chuyển sang Đăng nhập, lưu thành công)
      // mới được thay đổi trạng thái hiển thị của #childLogin.
      saveLock(accountPayload.account);
      saveAccess(accountPayload);
      renderAccount();
      renderTrialOffer();
      renderPlans();
      renderOrder();
      const paid = accountPayload.purchases?.find(
        (purchase) => purchase.status === "paid",
      );
      maybeShowSuccess(paid);
      return accountPayload;
    } catch (error) {
      if (error.status === 401) {
        const child = profile();
        if (child?.nickname) {
          localStorage.setItem(LAST_NICKNAME_KEY, child.nickname);
        }
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(PROFILE_KEY);
        document.body.classList.add("milo-auth-required");
        setTimeout(
          () =>
            showLogin({
              nickname: child?.nickname,
              notice: "Phiên đăng nhập đã hết hạn. Hãy nhập lại PIN để tiếp tục.",
            }),
          0,
        );
      }
      if (!quiet) setError(error.message);
      renderProfileCard();
      return null;
    }
  }

  function prerequisites() {
    const child = profile();
    if (!child?.nickname || !child?.name || !child?.gender || !token()) {
      showLogin();
      throw new Error("Hãy đăng nhập hoặc đăng ký tài khoản trước khi mua gói.");
    }
    const account = accountPayload?.account || {};
    const lock = gradeLock();
    const activeGrade = Number(
      account.selectedGrade ||
      lock?.grade ||
      (typeof state !== "undefined" ? state.grade : 2) ||
      2,
    );
    const selected =
      typeof selectedPet === "function"
        ? selectedPet(activeGrade)
        : [localStorage.getItem(`milo-selected-pet-${activeGrade}`), "Milo"];
    const petId = String(account.selectedPetId || selected?.[0] || "milo").toLowerCase();
    const petName = String(account.selectedPetName || selected?.[1] || "Milo");
    localStorage.setItem(`milo-selected-pet-${activeGrade}`, petId);
    localStorage.setItem(`milo-pet-locked-${activeGrade}`, "1");
    return { grade: activeGrade, petId, petName };
  }

  async function createOrder() {
    if (!provider?.configured) {
      throw new Error("Thanh toán đang được chuẩn bị. Phụ huynh vui lòng thử lại sau.");
    }
    const selection = prerequisites();
    const payload = await api("/api/purchases", {
      method: "POST",
      body: JSON.stringify({
        planId: selectedPlanId,
        replacePending: true,
        ...selection,
      }),
    });
    saveLock(payload.account);
    accountPayload = {
      ...(accountPayload || {}),
      account: payload.account,
      latestPurchase: payload.purchase,
      purchases: [
        payload.purchase,
        ...(accountPayload?.purchases || []).filter(
          (item) => item.id !== payload.purchase.id,
        ),
      ],
    };
    revealedOrderId = payload.purchase.orderId;
    renderAccount();
    renderPlans();
    renderOrder();
    toast(`Đã xác nhận tạo bill ${payload.purchase.orderId}.`);
    (document.querySelector("#purchaseOrderStatus") || document.querySelector("#homePaymentQr") || document.querySelector("#premiumPaymentQr"))
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function startTrial() {
    if (busy) return;
    setError("");
    busy = true;
    try {
      const selection = prerequisites();
      accountPayload = await api("/api/trial", {
        method: "POST",
        body: JSON.stringify(selection),
      });
      saveLock(accountPayload.account);
      saveAccess(accountPayload);
      renderAccount();
      renderTrialOffer();
      renderPlans();
      paymentModal?.classList.add("hidden");
      toast("Đã mở toàn bộ trợ lý AI VIP PRO MAX trong 24 giờ.");
      window.dispatchEvent(
        new CustomEvent("milo:trial-started", {
          detail: accountPayload.aiAccess,
        }),
      );
    } catch (error) {
      setError(error.message);
      toast(error.message);
      if (error.status === 401) showLogin();
    } finally {
      busy = false;
    }
  }


  function ensurePurchaseConfirmModal() {
    if (purchaseConfirmModal) return purchaseConfirmModal;
    purchaseConfirmModal = document.createElement("div");
    purchaseConfirmModal.className = "purchase-confirm-overlay hidden";
    purchaseConfirmModal.innerHTML = `
      <section class="purchase-confirm-card" role="dialog" aria-modal="true" aria-labelledby="purchaseConfirmTitle">
        <button class="purchase-confirm-close" type="button" aria-label="Đóng">×</button>
        <span class="purchase-confirm-icon">🧾</span>
        <small>KIỂM TRA TRƯỚC KHI TẠO BILL</small>
        <h3 id="purchaseConfirmTitle">Xác nhận gói VIP PRO MAX</h3>
        <div id="purchaseConfirmSummary"></div>
        <p>Chọn gói chỉ là lựa chọn tạm thời. Bill và nội dung chuyển khoản chỉ được tạo sau khi bấm nút xác nhận bên dưới.</p>
        <div class="purchase-confirm-actions"><button type="button" data-cancel-purchase-confirm>Quay lại chọn gói</button><button type="button" data-confirm-purchase>✓ Xác nhận tạo bill</button></div>
      </section>`;
    document.body.appendChild(purchaseConfirmModal);
    const close = () => purchaseConfirmModal.classList.add("hidden");
    purchaseConfirmModal.querySelector(".purchase-confirm-close").onclick = close;
    purchaseConfirmModal.querySelector("[data-cancel-purchase-confirm]").onclick = close;
    purchaseConfirmModal.addEventListener("click", (event) => { if (event.target === purchaseConfirmModal) close(); });
    purchaseConfirmModal.querySelector("[data-confirm-purchase]").onclick = async () => {
      const confirmButton = purchaseConfirmModal.querySelector("[data-confirm-purchase]");
      confirmButton.disabled = true;
      confirmButton.textContent = "Đang tạo bill…";
      try {
        await createOrder();
        close();
      } catch (error) {
        setError(error.message);
        toast(error.message);
      } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = "✓ Xác nhận tạo bill";
      }
    };
    return purchaseConfirmModal;
  }

  function showPurchaseConfirmation() {
    const plan = planById(selectedPlanId);
    if (!plan) throw new Error("Hãy chọn một gói 1, 3 hoặc 6 tháng.");
    prerequisites();
    const modal = ensurePurchaseConfirmModal();
    const pending = isOpenPurchase(currentPurchase());
    modal.querySelector("#purchaseConfirmSummary").innerHTML = `
      <b>${escapeHtml(plan.name)}</b><strong>${money(plan.price)}</strong><span>${Number(plan.durationMonths)} tháng sử dụng đầy đủ VIP PRO MAX</span>
      ${pending ? `<em>Đang có một đơn chờ. Chỉ sau khi xác nhận, bill cũ mới được đổi sang gói này.</em>` : ""}`;
    modal.classList.remove("hidden");
  }

  async function handlePaymentAction() {
    if (busy) return;
    setError("");
    busy = true;
    updatePaymentButton();
    try {
      await Promise.all([loadPlans(), loadProvider()]);
      if (!selectedPlanId) throw new Error("Chưa tải được danh sách gói.");
      await createOrder();
      paymentModal?.classList.add("hidden");
    } catch (error) {
      setError(error.message);
      toast(error.message);
    } finally {
      busy = false;
      updatePaymentButton();
    }
  }

  function successModal() {
    let modal = document.querySelector("#commerceSuccessModal");
    if (modal) return modal;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="commerceSuccessModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="commerceSuccessTitle">
        <div class="modal-card commerce-success-card">
          <button class="close" id="closeCommerceSuccess" type="button" aria-label="Đóng">×</button>
          <span class="success-check">✓</span>
          <p>ĐÃ XÁC NHẬN TIỀN VÀO TÀI KHOẢN</p>
          <h2 id="commerceSuccessTitle"></h2>
          <div id="commerceSuccessBody"></div>
          <button id="startPurchasedCourse" class="premium-pay-button" type="button">Trò chuyện với AI</button>
        </div>
      </div>`,
    );
    modal = document.querySelector("#commerceSuccessModal");
    document.querySelector("#closeCommerceSuccess").onclick = () =>
      modal.classList.add("hidden");
    modal.addEventListener("click", (event) => {
      if (event.target === modal && token()) modal.classList.add("hidden");
    });
    return modal;
  }

  function maybeShowSuccess(purchase) {
    if (!purchase || localStorage.getItem(SUCCESS_KEY) === purchase.id) return;
    const plan = planById(purchase.planId);
    const modal = successModal();
    document.querySelector("#commerceSuccessTitle").textContent =
      `${displayPlanName(purchase.planName, purchase.planId)} đã kích hoạt`;
    document.querySelector("#commerceSuccessBody").innerHTML = `
      <div class="success-course"><b>@${escapeHtml(accountPayload?.account?.nickname)} · Lớp ${Number(purchase.grade)} · Pet ${escapeHtml(purchase.petName)}</b><small>Dùng đến ${date(purchase.activeUntil)} · Mã ${escapeHtml(purchase.orderId)}</small></div>
      <p>${escapeHtml(plan?.purpose || "Trợ lý AI Pro Max đã sẵn sàng trò chuyện cùng bé.")}</p>
      <ul>${(plan?.benefits || []).map((benefit) => `<li>✓ ${escapeHtml(benefit)}</li>`).join("")}</ul>`;
    document.querySelector("#startPurchasedCourse").onclick = () => {
      modal.classList.add("hidden");
      paymentModal?.classList.add("hidden");
      if (typeof setView === "function") setView("tutor");
      toast(`Trợ lý AI ${displayPlanName(purchase.planName, purchase.planId)} cho lớp ${purchase.grade} đã sẵn sàng.`);
    };
    localStorage.setItem(SUCCESS_KEY, purchase.id);
    window.dispatchEvent(
      new CustomEvent("milo:payment-confirmed", {
        detail: { purchaseId: purchase.id, planId: purchase.planId },
      }),
    );
    modal.classList.remove("hidden");
  }

  function loginModal() {
    let modal = document.querySelector("#accountLoginModal");
    if (modal) return modal;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="accountLoginModal" class="modal child-login hidden" role="dialog" aria-modal="true" aria-labelledby="accountLoginTitle">
        <form class="modal-card child-login-card pro-auth-shell account-login-card pro-login-shell" id="accountLoginForm">
          <aside class="auth-showcase login-showcase">
            <div class="auth-brand-line"><span>✦</span><b>MILO PRIVATE ACADEMY</b></div>
            <div class="profile-hero-avatar">🦊</div>
            <span class="auth-showcase-kicker">ĐĂNG NHẬP HỌC VIÊN</span>
            <h3>Tiếp tục hành trình riêng của bé</h3>
            <p>Khôi phục đúng lớp, đúng pet, đúng tiến độ và quyền lợi của tài khoản đã tạo.</p>
            <div class="account-plan-snapshot premium-profile-card login-profile-card status-active">
              <div class="membership-head">
                <span class="membership-avatar">🦊</span>
                <div><small>MILO PRIVATE ACADEMY</small><b>Hồ sơ học viên đã sẵn sàng</b></div>
                <em>SECURE</em>
              </div>
              <div class="membership-empty">
                <strong>Đăng nhập bằng nick và PIN</strong>
                <small>Khôi phục đúng lớp, pet, tiến độ và quyền học của bé.</small>
              </div>
              <div class="membership-number">MILO •••• ••••</div>
            </div>
            <div class="auth-trust-list" aria-label="Bảo mật tài khoản">
              <span><i>✓</i><b>Một nick · Một lớp · Một pet</b></span>
              <span><i>✓</i><b>Khôi phục đúng tiến độ học</b></span>
              <span><i>✓</i><b>Khóa tạm khi nhập sai nhiều lần</b></span>
            </div>
          </aside>
          <section class="auth-form-panel login-form-panel">
            <div class="auth-panel-top"><span class="auth-mode-badge">ĐĂNG NHẬP BẢO MẬT</span><button class="close" id="closeAccountLogin" type="button" aria-label="Đóng">×</button></div>
            <div class="auth-switch" role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký">
              <button class="active" type="button" role="tab" aria-selected="true">Đăng nhập</button>
              <button id="authSwitchToRegister" type="button" role="tab" aria-selected="false">Đăng ký</button>
            </div>
            <div class="auth-form-scroll">
            <h2 id="accountLoginTitle">Đăng nhập tài khoản Milo</h2>
            <p class="login-intro">Nhập nick của bé và PIN 6 số do phụ huynh đã tạo.</p>
            <div class="account-login-notice hidden" id="accountLoginNotice" role="status"></div>
            <label class="profile-field"><span>Nick đăng nhập</span><div class="auth-input-wrap"><span class="auth-input-icon">@</span><input id="loginNickname" type="text" maxlength="20" placeholder="Ví dụ: minhanh_2018" autocomplete="username" required></div></label>
            <label class="profile-field"><span>PIN phụ huynh <i>Đúng 6 chữ số</i></span><div class="auth-input-wrap pin-input-wrap"><span class="auth-input-icon">◆</span><input id="loginPin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="••••••" autocomplete="current-password" required><button id="toggleLoginPin" type="button" aria-label="Hiện PIN">◉</button></div><div class="login-pin-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><b>0/6 số</b></div></label>
            <div class="login-safe-note"><span>🔐</span><small>PIN được xác minh trên máy chủ và không được lưu trong trình duyệt.</small></div>
            </div>
            <div class="auth-action-footer auth-login-actions">
              <small id="accountLoginError" class="profile-error" role="alert"></small>
              <button class="profile-submit login-submit" type="submit"><span>Đăng nhập</span><i>→</i></button>
              <div class="login-divider"><span></span><b>HOẶC</b><span></span></div>
              <button class="login-create-account" id="openCreateAccount" type="button"><span>Chưa có tài khoản?</span><b>Đăng ký tài khoản →</b></button>
            </div>
            <small class="login-support">Quên PIN? Người quản lý có thể hỗ trợ đặt lại sau khi xác minh đúng tài khoản.</small>
          </section>
        </form>
      </div>`,
    );
    modal = document.querySelector("#accountLoginModal");
    document.querySelector("#closeAccountLogin").onclick = () => {
      if (!token()) return;
      modal.classList.add("hidden");
    };
    const loginPin = document.querySelector("#loginPin");
    const loginDots = document.querySelector(".login-pin-dots");
    const updateLoginDots = () => {
      const length = Math.min(6, loginPin.value.length);
      loginDots?.querySelectorAll("i").forEach((dot, index) => {
        dot.classList.toggle("filled", index < length);
      });
      const label = loginDots?.querySelector("b");
      if (label) label.textContent = length === 6 ? "✓ Sẵn sàng" : `${length}/6 số`;
      loginDots?.classList.toggle("complete", length === 6);
    };
    loginPin.addEventListener("input", () => {
      loginPin.value = loginPin.value.replace(/\D/g, "");
      updateLoginDots();
    });
    document.querySelector("#toggleLoginPin").onclick = () => {
      const reveal = loginPin.type === "password";
      loginPin.type = reveal ? "text" : "password";
      document.querySelector("#toggleLoginPin").textContent = reveal ? "◌" : "◉";
      document
        .querySelector("#toggleLoginPin")
        .setAttribute("aria-label", reveal ? "Ẩn PIN" : "Hiện PIN");
      loginPin.focus();
    };
    const openRegistration = () => {
      modal.classList.add("hidden");
      window.MILO_PROFILE?.showRegistration?.();
    };
    document.querySelector("#openCreateAccount").onclick = openRegistration;
    document.querySelector("#authSwitchToRegister").onclick = openRegistration;
    modal.addEventListener("click", (event) => {
      if (event.target === modal && token()) modal.classList.add("hidden");
    });
    document.querySelector("#accountLoginForm").onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const error = document.querySelector("#accountLoginError");
      const button = form.querySelector(".profile-submit");
      error.textContent = "";
      button.disabled = true;
      const buttonText = button.querySelector("span");
      if (buttonText) buttonText.textContent = "Đang xác minh tài khoản…";
      try {
        const result = await api("/api/account/login", {
          method: "POST",
          body: JSON.stringify({
            nickname: document.querySelector("#loginNickname").value,
            pin: document.querySelector("#loginPin").value,
          }),
        });
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(LAST_NICKNAME_KEY, result.account.nickname);
        localStorage.setItem(
          PROFILE_KEY,
          JSON.stringify({
            name: result.account.displayName,
            nickname: result.account.nickname,
            gender: result.account.gender,
          }),
        );
        location.reload();
      } catch (loginError) {
        error.textContent = loginError.message;
        button.disabled = false;
        if (buttonText) buttonText.textContent = "Đăng nhập";
      }
    };
    return modal;
  }

  function showLogin(options = {}) {
    document.documentElement.classList.remove("milo-auth-required-boot");
    const modal = loginModal();
    document.documentElement.classList.remove("milo-auth-checking");
    document.body.classList.add("milo-auth-required");
    window.__MILO_PROFILE_OPEN = false;
    document.querySelector("#childLogin")?.classList.add("hidden");
    modal.classList.remove("hidden");
    const child = profile();
    const rememberedNickname =
      String(options.nickname || "").trim().toLowerCase() ||
      child?.nickname ||
      localStorage.getItem(LAST_NICKNAME_KEY) ||
      "";
    document.querySelector("#loginNickname").value = rememberedNickname;
    document.querySelector("#loginPin").value = "";
    document.querySelector("#loginPin")?.dispatchEvent(new Event("input"));
    const notice = document.querySelector("#accountLoginNotice");
    if (notice) {
      notice.textContent = String(options.notice || "");
      notice.classList.toggle("hidden", !notice.textContent);
    }
    setTimeout(
      () =>
        document
          .querySelector(rememberedNickname ? "#loginPin" : "#loginNickname")
          ?.focus(),
      50,
    );
  }

  function logoutAccount() {
    const lock = gradeLock();
    const child = profile();
    if (child?.nickname) {
      localStorage.setItem(LAST_NICKNAME_KEY, child.nickname);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(LOCK_KEY);
    localStorage.removeItem(PROFILE_KEY);
    if (lock?.grade) localStorage.removeItem(`milo-pet-locked-${lock.grade}`);
    location.reload();
  }

  let _planModalLock = false;
  function openPaymentForLockedFeature(options = {}) {
    if (_planModalLock) return;
    _planModalLock = true;
    setTimeout(() => { _planModalLock = false; }, 400);

    const modal = paymentModal || document.querySelector("#premiumPaymentModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
    setError(
      "AI Plus luôn sẵn sàng. VIP PRO MAX mở cá nhân hóa chuyên sâu, ghi nhớ điểm yếu và theo sát tiến bộ của con.",
    );
    onModalOpen();
  }

  function hasActiveAccess() {
    const access = readJson(ACCESS_KEY);
    return Boolean(
      access?.verifiedBy === "milo-server" &&
        access?.active &&
        (!access.activeUntil ||
          new Date(access.activeUntil).getTime() > Date.now()),
    );
  }

  async function onModalOpen() {
    setError("");
    await Promise.all([loadPlans(), loadProvider()]);
    if (token()) await refreshAccount({ quiet: true });
    renderAccount();
    renderTrialOffer();
    renderPlans();
    renderOrder();
    renderProviderStatus();
    if (!provider?.configured) {
      setError("Thanh toán đang được chuẩn bị. Phụ huynh vui lòng thử lại sau.");
    }
  }

  window.MILO_ACCOUNT = {
    saveProfile,
    showLogin,
    refreshProfileCard: () => {
      renderProfileCard();
      if (token()) refreshAccount({ quiet: true });
    },
  };
  window.MILO_COMMERCE = {
    controlsPaymentButton: true,
    handlePaymentAction,
    onModalOpen,
    openAiPlans: openPaymentForLockedFeature,
    openVipPlans: (options) => openPaymentForLockedFeature(options),
    hasActiveAiAccess: hasActiveAccess,
    startTrial,
  };
  // Unified public API — every module should call this instead of .click() hacks
  window.SubscriptionUI = {
    openPlans(options) {
      openPaymentForLockedFeature(options);
    },
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-account-logout]")) logoutAccount();
    if (event.target.closest?.("#closePremiumPayment")) {
      event.preventDefault();
      paymentModal?.classList.add("hidden");
      return;
    }
    if (
      event.target.closest?.("#continuePremiumPayment") ||
      event.target.closest?.(".premium-pay-button")
    ) {
      event.preventDefault();
      handlePaymentAction();
      return;
    }
    // Unified handler: data-open-vip-plans, data-open-ai-plans, and
    // data-action='open-vip-plans' all open the same modal via the debounced API.
    if (
      event.target.closest?.("[data-open-ai-plans]") ||
      event.target.closest?.("[data-open-vip-plans]") ||
      event.target.closest?.('[data-action="open-vip-plans"]')
    ) {
      event.preventDefault();
      openPaymentForLockedFeature();
      return;
    }
    if (event.target.closest?.("[data-start-ai-trial]")) {
      event.preventDefault();
      if (!token()) {
        showLogin();
        return;
      }
      startTrial();
    }
    if (event.target.closest?.("[data-show-paid-plans]")) {
      event.preventDefault();
      openPaymentForLockedFeature();
    }
  });
  applyCourseLock();
  renderAccount();
  renderTrialOffer();
  renderPlans();
  renderProviderStatus();
  updatePaymentButton();
  if (paymentButton) {
    paymentButton.onclick = (e) => {
      e.preventDefault();
      handlePaymentAction();
    };
  }
  document.querySelector("#closePremiumPayment")?.addEventListener("click", () => {
    paymentModal?.classList.add("hidden");
  });
  paymentModal?.addEventListener("click", (event) => {
    if (event.target === paymentModal) paymentModal.classList.add("hidden");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && paymentModal && !paymentModal.classList.contains("hidden")) {
      paymentModal.classList.add("hidden");
    }
  });
  Promise.all([loadPlans(), loadProvider()]);
  refreshAccount({ quiet: true });
  setInterval(() => refreshAccount({ quiet: true }), 9000);

  if (!token()) {
    setTimeout(
      () =>
        showLogin({
          nickname:
            localStorage.getItem(LAST_NICKNAME_KEY) || profile()?.nickname || "",
          notice: "Đăng nhập là bắt buộc để vào ứng dụng. Chưa có tài khoản, bấm Đăng ký.",
        }),
      0,
    );
  }

  const query = new URLSearchParams(location.search);
  if (query.get("ai") === "1" || query.get("payment") === "1") {
    setTimeout(openPaymentForLockedFeature, 250);
  }
})();
