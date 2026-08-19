(function () {
  const PROFILE_KEY = "milo-child-profile-v1";
  const LAST_NICKNAME_KEY = "milo-last-nickname-v1";
  const lockKey = (grade) => `milo-pet-locked-${grade}`;
  let profile = readProfile();
  let unlockArmedUntil = 0;

  function readProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function childIcon(gender) {
    return gender === "boy" ? "👦" : gender === "girl" ? "👧" : "🧒";
  }

  function petLocked(grade) {
    return localStorage.getItem(lockKey(grade)) === "1";
  }

  function profileMarkup() {
    const current = profile || { name: "", gender: "", nickname: "" };
    const hasSession = Boolean(
      profile?.nickname && localStorage.getItem("milo-commerce-token-v1"),
    );
    return `
      <div class="child-login hidden" id="childLogin" role="dialog" aria-modal="true" aria-labelledby="childLoginTitle">
        <form class="child-login-card pro-auth-shell ${hasSession ? "is-profile" : "is-register"}" id="childLoginForm" data-profile-mode="${hasSession ? "profile" : "register"}">
          <aside class="auth-showcase">
            <div class="auth-brand-line"><span>✦</span><b>MILO PRIVATE ACADEMY</b></div>
            <div class="profile-hero-avatar" id="profileHeroAvatar">${childIcon(current.gender)}</div>
            <span class="auth-showcase-kicker" id="profileShowcaseKicker">${hasSession ? "THẺ HỌC VIÊN" : "TÀI KHOẢN HỌC TẬP RIÊNG"}</span>
            <h3 id="profileShowcaseTitle">${hasSession ? escapeProfile(current.name || "Học viên Milo") : "Một hành trình riêng cho mỗi bé"}</h3>
            <p id="profileShowcaseCopy">${hasSession ? `@${escapeProfile(current.nickname)}` : "Lưu đúng lớp, đúng pet, đúng tiến độ và quyền lợi của từng tài khoản."}</p>
            <div id="accountPlanSnapshot" class="account-plan-snapshot premium-profile-card">
              <div class="profile-card-skeleton"><span></span><div><b>Đang đồng bộ hồ sơ</b><small>Kiểm tra gói học và thời hạn…</small></div></div>
            </div>
            <div class="auth-trust-list" aria-label="Quyền lợi tài khoản">
              <span><i>✓</i><b>Một nick · Một lớp · Một pet</b></span>
              <span><i>✓</i><b>PIN phụ huynh được mã hóa</b></span>
              <span><i>✓</i><b>Gói chỉ mở sau xác nhận thanh toán</b></span>
            </div>
          </aside>
          <section class="auth-form-panel">
            <div class="auth-panel-top">
              <span class="auth-mode-badge" id="profileModeBadge">${hasSession ? "HỒ SƠ VIP" : "ĐĂNG KÝ HỌC VIÊN"}</span>
              <button class="profile-close ${hasSession ? "" : "hidden"}" id="profileClose" type="button" aria-label="Đóng hồ sơ">×</button>
            </div>
            <div class="auth-switch ${hasSession ? "hidden" : ""}" role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký">
              <button id="authSwitchToLogin" type="button" role="tab" aria-selected="false">Đăng nhập</button>
              <button class="active" type="button" role="tab" aria-selected="true">Đăng ký</button>
            </div>
            <div class="auth-form-scroll">
            <h2 id="childLoginTitle">${hasSession ? "Hồ sơ học viên" : "Đăng ký tài khoản Milo"}</h2>
            <p class="auth-form-intro" id="profileFormIntro">${hasSession ? "Cập nhật tên hiển thị, giới tính hoặc bảo mật PIN cho tài khoản." : "Phụ huynh tạo một nick riêng để bé bắt đầu hành trình Tiếng Anh lớp 2–5."}</p>
            <div class="auth-stepper" id="profileStepper" aria-label="Các bước kích hoạt">
              <span class="active"><i>1</i><b>Hồ sơ</b></span>
              <em></em>
              <span><i>2</i><b>Lớp & Pet</b></span>
              <em></em>
              <span><i>3</i><b>Kích hoạt</b></span>
            </div>
            <div class="profile-fields-grid">
              <label class="profile-field profile-field-wide">
                <span>Nick đăng nhập <i>Không thể đổi sau khi tạo</i></span>
                <div class="auth-input-wrap"><span class="auth-input-icon">@</span><input id="childNickname" type="text" maxlength="20" value="${escapeProfile(current.nickname)}" placeholder="Ví dụ: minhanh_2018" autocomplete="username" required></div>
                <small>4–20 ký tự; bắt đầu bằng chữ, chỉ dùng chữ không dấu, số, dấu chấm hoặc gạch dưới.</small>
              </label>
              <label class="profile-field profile-field-wide">
                <span>Tên của bé <i>Pet sẽ gọi bé bằng tên này</i></span>
                <div class="auth-input-wrap"><span class="auth-input-icon">Aa</span><input id="childName" type="text" maxlength="24" value="${escapeProfile(current.name)}" placeholder="Ví dụ: Minh Anh" autocomplete="name" required></div>
              </label>
            </div>
            <fieldset class="gender-group">
              <legend>Nhân xưng của bé</legend>
              <div class="gender-options">
                <label><input type="radio" name="childGender" value="boy" ${current.gender === "boy" ? "checked" : ""}><i>👦</i><b>Bé trai</b><small>Con / cậu bé</small></label>
                <label><input type="radio" name="childGender" value="girl" ${current.gender === "girl" ? "checked" : ""}><i>👧</i><b>Bé gái</b><small>Con / cô bé</small></label>
                <label><input type="radio" name="childGender" value="other" ${current.gender === "other" ? "checked" : ""}><i>🧒</i><b>Khác</b><small>Gọi tên của bé</small></label>
              </div>
            </fieldset>
            <label class="profile-field profile-current-pin ${hasSession ? "" : "hidden"}" id="currentPinField">
              <span>PIN hiện tại <i>Chỉ nhập khi muốn đổi PIN</i></span>
              <div class="auth-input-wrap pin-input-wrap"><span class="auth-input-icon">●</span><input id="parentCurrentPin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="Nhập PIN đang sử dụng" autocomplete="current-password"><button type="button" data-pin-toggle="parentCurrentPin" aria-label="Hiện PIN">◉</button></div>
            </label>
            <label class="profile-field">
              <span><b id="parentPinLabelText">${hasSession ? "PIN mới" : "PIN phụ huynh"}</b> <i id="parentPinOptional">${hasSession ? "Để trống nếu không đổi" : "Đúng 6 chữ số"}</i></span>
              <div class="auth-input-wrap pin-input-wrap"><span class="auth-input-icon">◆</span><input id="parentPin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="••••••" autocomplete="new-password" ${hasSession ? "" : "required"}><button type="button" data-pin-toggle="parentPin" aria-label="Hiện PIN">◉</button></div>
              <div class="pin-quality" id="parentPinQuality"><span></span><span></span><span></span><span></span><span></span><span></span><b>0/6 số</b></div>
              <small id="parentPinHelp">${hasSession ? "Muốn đổi PIN phải nhập đúng cả PIN hiện tại và PIN mới." : "PIN này dùng để đăng nhập và xác nhận thay đổi hồ sơ."} PIN không được lưu trong trình duyệt.</small>
            </label>
            <section class="profile-secondary-block ${hasSession ? "" : "hidden"}" id="profileSecondaryBlock">
              <div class="profile-session-actions" id="profileSessionActions">
                <button id="profileOpenStudySettings" type="button">⏱ Cài đặt thời lượng học</button>
              </div>
              <p class="profile-pin-recovery" id="profilePinRecovery">Quên PIN? PIN cũ không thể xem lại. Mở trang Quản trị → Danh sách người dùng → Đặt lại PIN.</p>
            </section>
            </div>
            <div class="auth-action-footer">
              <p class="profile-error" id="profileError" aria-live="polite"></p>
              <div class="profile-save-copy ${hasSession ? "" : "hidden"}" id="profileSaveCopy">
                <b>Kiểm tra thông tin trước khi lưu</b>
                <small>Tên, nhân xưng và PIN mới chỉ thay đổi sau khi bấm nút bên dưới.</small>
              </div>
              <div class="profile-footer-actions">
                <button class="profile-submit" type="submit"><span>${hasSession ? "Lưu thay đổi hồ sơ" : "Đăng ký tài khoản"}</span><i>→</i></button>
                <button class="profile-footer-logout ${hasSession ? "" : "hidden"}" id="profileLogoutButton" type="button" data-account-logout><span>Đăng xuất</span><i>↗</i></button>
              </div>
              <button class="profile-login-existing ${hasSession ? "hidden" : ""}" id="loginExistingAccount" type="button"><span>Đã có tài khoản?</span><b>Đăng nhập →</b></button>
            </div>
            <small class="profile-privacy"><span>🔐</span> Dữ liệu gói và quyền học được xác thực trên máy chủ Milo. Không chia sẻ PIN của bé cho người khác.</small>
          </section>
        </form>
      </div>`;
  }

  function updatePinQuality(input) {
    const meter = document.querySelector("#parentPinQuality");
    if (!meter || !input) return;
    const length = Math.min(6, input.value.replace(/\D/g, "").length);
    meter.querySelectorAll("span").forEach((bar, index) => {
      bar.classList.toggle("filled", index < length);
    });
    const label = meter.querySelector("b");
    if (label) label.textContent = length === 6 ? "✓ Đủ 6 số" : `${length}/6 số`;
    meter.classList.toggle("complete", length === 6);
  }

  function updateProfileMode() {
    const hasSession = Boolean(
      profile?.nickname && localStorage.getItem("milo-commerce-token-v1"),
    );
    const form = document.querySelector("#childLoginForm");
    if (!form) return;
    form.dataset.profileMode = hasSession ? "profile" : "register";
    form.classList.toggle("is-profile", hasSession);
    form.classList.toggle("is-register", !hasSession);
    document.querySelector("#currentPinField")?.classList.toggle("hidden", !hasSession);
    document.querySelector("#profileClose")?.classList.toggle("hidden", !hasSession);
    document.querySelector("#loginExistingAccount")?.classList.toggle("hidden", hasSession);
    document.querySelector("#profileSecondaryBlock")?.classList.toggle("hidden", !hasSession);
    document.querySelector("#profileSessionActions")?.classList.toggle("hidden", !hasSession);
    document.querySelector("#profilePinRecovery")?.classList.toggle("hidden", !hasSession);
    document.querySelector("#profileSaveCopy")?.classList.toggle("hidden", !hasSession);
    document.querySelector("#profileLogoutButton")?.classList.toggle("hidden", !hasSession);
    const nickname = document.querySelector("#childNickname");
    if (nickname) {
      nickname.readOnly = hasSession;
      nickname.setAttribute(
        "aria-description",
        hasSession ? "Nick đã được cố định cho tài khoản này" : "Nick mới của học viên",
      );
    }
    const pin = document.querySelector("#parentPin");
    if (pin) {
      pin.required = !hasSession;
      pin.value = "";
    }
    const currentPin = document.querySelector("#parentCurrentPin");
    if (currentPin) currentPin.value = "";
    const setText = (selector, value) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    };
    setText("#childLoginTitle", hasSession ? "Hồ sơ học viên" : "Đăng ký tài khoản Milo");
    setText("#profileModeBadge", hasSession ? "HỒ SƠ VIP" : "ĐĂNG KÝ HỌC VIÊN");
    setText(
      "#profileFormIntro",
      hasSession
        ? "Xem hồ sơ không cần nhập PIN. PIN chỉ cần khi đổi PIN hoặc mở cài đặt phụ huynh."
        : "Phụ huynh tạo một nick riêng để bé bắt đầu hành trình Tiếng Anh lớp 2–5.",
    );
    setText("#profileShowcaseKicker", hasSession ? "THẺ HỌC VIÊN" : "TÀI KHOẢN HỌC TẬP RIÊNG");
    setText(
      "#profileShowcaseTitle",
      hasSession ? profile?.name || "Học viên Milo" : "Một hành trình riêng cho mỗi bé",
    );
    setText(
      "#profileShowcaseCopy",
      hasSession ? `@${profile?.nickname || ""}` : "Lưu đúng lớp, đúng pet, đúng tiến độ và quyền lợi của từng tài khoản.",
    );
    setText("#parentPinLabelText", hasSession ? "PIN mới" : "PIN phụ huynh");
    setText("#parentPinOptional", hasSession ? "Để trống nếu không đổi" : "Đúng 6 chữ số");
    setText(
      "#parentPinHelp",
      `${hasSession ? "Muốn đổi PIN phải nhập đúng cả PIN hiện tại và PIN mới." : "PIN này dùng để đăng nhập và xác nhận thay đổi hồ sơ."} PIN không được lưu trong trình duyệt.`,
    );
    const avatar = document.querySelector("#profileHeroAvatar");
    if (avatar) avatar.textContent = childIcon(profile?.gender);
    const submitText = form.querySelector(".profile-submit span");
    if (submitText) {
      submitText.textContent = hasSession
        ? "Lưu thay đổi hồ sơ"
        : "Đăng ký tài khoản";
    }
    updatePinQuality(pin);
  }

  function escapeProfile(value) {
    return String(value || "").replace(
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
  }

  function mountProfile() {
    document.body.insertAdjacentHTML("beforeend", profileMarkup());
    const mountedProfileModal = document.querySelector("#childLogin");
    if (mountedProfileModal && !mountedProfileModal.__miloVisibilityGuard) {
      mountedProfileModal.__miloVisibilityGuard = true;
      new MutationObserver(() => {
        const hasSession = Boolean(
          localStorage.getItem("milo-commerce-token-v1") &&
          localStorage.getItem(PROFILE_KEY),
        );
        if (
          window.__MILO_PROFILE_OPEN === true &&
          hasSession &&
          mountedProfileModal.classList.contains("hidden")
        ) {
          queueMicrotask(() => {
            if (window.__MILO_PROFILE_OPEN === true) {
              mountedProfileModal.classList.remove("hidden");
            }
          });
        }
      }).observe(mountedProfileModal, { attributes: true, attributeFilter: ["class"] });
    }
    const form = document.querySelector("#childLoginForm");
    form.querySelectorAll("[data-pin-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.querySelector(`#${button.dataset.pinToggle}`);
        if (!input) return;
        const reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        button.textContent = reveal ? "◌" : "◉";
        button.setAttribute("aria-label", reveal ? "Ẩn PIN" : "Hiện PIN");
        input.focus();
      });
    });
    document.querySelector("#parentPin")?.addEventListener("input", (event) => {
      event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
      updatePinQuality(event.currentTarget);
    });
    document
      .querySelector("#parentCurrentPin")
      ?.addEventListener("input", (event) => {
        event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
      });
    document.querySelector("#childName")?.addEventListener("input", (event) => {
      if (!form.classList.contains("is-profile")) return;
      const title = document.querySelector("#profileShowcaseTitle");
      if (title) title.textContent = event.currentTarget.value.trim() || "Học viên Milo";
    });
    form.querySelectorAll('[name="childGender"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        const selected = form.querySelector('[name="childGender"]:checked')?.value;
        const avatar = document.querySelector("#profileHeroAvatar");
        if (avatar) avatar.textContent = childIcon(selected);
      });
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.querySelector("#childName").value.trim();
      const nickname = document
        .querySelector("#childNickname")
        .value.trim()
        .toLowerCase();
      const pin = document.querySelector("#parentPin").value;
      const currentPin =
        document.querySelector("#parentCurrentPin")?.value || "";
      const gender = form.querySelector('[name="childGender"]:checked')?.value;
      const editingExisting = Boolean(
        profile?.nickname &&
          localStorage.getItem("milo-commerce-token-v1"),
      );
      const error = document.querySelector("#profileError");
      const submit = form.querySelector(".profile-submit");
      error.textContent = "";
      if (!/^[a-z][a-z0-9_.]{3,19}$/.test(nickname)) {
        error.textContent =
          "Nick cần 4–20 ký tự, bắt đầu bằng chữ và không dùng dấu cách hoặc chữ có dấu.";
        return;
      }
      if (name.length < 2) {
        error.textContent = "Tên cần có ít nhất 2 ký tự.";
        return;
      }
      if (!gender) {
        error.textContent = "Bé hãy chọn giới tính.";
        return;
      }
      if (!editingExisting && !/^\d{6}$/.test(pin)) {
        error.textContent = "Mã PIN phụ huynh phải gồm đúng 6 số.";
        return;
      }
      if (
        editingExisting &&
        (pin || currentPin) &&
        (!/^\d{6}$/.test(pin) || !/^\d{6}$/.test(currentPin))
      ) {
        error.textContent =
          "Muốn đổi PIN, hãy nhập đúng cả PIN hiện tại và PIN mới gồm 6 số.";
        return;
      }
      if (!window.MILO_ACCOUNT?.saveProfile) {
        error.textContent =
          "Máy chủ tài khoản chưa sẵn sàng. Hãy mở app bằng CHAY_APP.bat.";
        return;
      }
      submit.disabled = true;
      const submitText = submit.querySelector("span");
      if (submitText) submitText.textContent = "Đang bảo mật tài khoản…";
      let savedAccount;
      try {
        savedAccount = await window.MILO_ACCOUNT.saveProfile({
          displayName: name,
          nickname,
          pin,
          currentPin,
          gender,
          createNew: !editingExisting,
        });
      } catch (saveError) {
        if (!editingExisting && saveError.status === 409) {
          error.textContent = "";
          localStorage.setItem(LAST_NICKNAME_KEY, nickname);
          submit.disabled = false;
          if (submitText) submitText.textContent = "Đăng ký tài khoản";
          window.__MILO_PROFILE_OPEN = false;
          document.querySelector("#childLogin").classList.add("hidden");
          window.MILO_ACCOUNT?.showLogin?.({
            nickname,
            notice: "Nick này đã có tài khoản. Hãy nhập đúng PIN để đăng nhập.",
          });
          return;
        }
        error.textContent = saveError.message;
        submit.disabled = false;
        if (submitText) {
          submitText.textContent = profile?.nickname
            ? "Lưu thay đổi hồ sơ"
            : "Đăng ký tài khoản";
        }
        return;
      }
      if (!editingExisting && savedAccount?.requiresLogin) {
        profile = null;
        localStorage.removeItem(PROFILE_KEY);
        localStorage.setItem(LAST_NICKNAME_KEY, nickname);
        window.__MILO_PROFILE_OPEN = false;
          document.querySelector("#childLogin").classList.add("hidden");
        submit.disabled = false;
        if (submitText) submitText.textContent = "Đăng ký tài khoản";
        window.MILO_ACCOUNT?.showLogin?.({
          nickname,
          notice:
            "✓ Đăng ký thành công. Hãy nhập lại PIN vừa tạo để đăng nhập.",
        });
        showToast("Đã tạo tài khoản. Bây giờ phụ huynh hãy đăng nhập.");
        return;
      }
      profile = { name: name.slice(0, 24), nickname, gender };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      window.__MILO_PROFILE_OPEN = false;
          document.querySelector("#childLogin").classList.add("hidden");
      updateProfileUI();
      if (!petLocked(state.grade)) {
        setView("pets");
        renderPetHub();
        syncPetChoice();
        showToast(`Chào ${profile.name}! Hãy chọn 1 pet cho lớp ${state.grade}.`);
      } else {
        showToast(`Chào mừng ${profile.name} quay lại!`);
      }
      submit.disabled = false;
      if (submitText) submitText.textContent = "Lưu thay đổi hồ sơ";
    });
    document
      .querySelector("#authSwitchToLogin")
      ?.addEventListener("click", () => {
        const nickname = document
          .querySelector("#childNickname")
          ?.value.trim()
          .toLowerCase();
        window.__MILO_PROFILE_OPEN = false;
          document.querySelector("#childLogin").classList.add("hidden");
        window.MILO_ACCOUNT?.showLogin?.({
          nickname,
          notice: "Nhập nick và PIN để đăng nhập vào ứng dụng.",
        });
      });
    document
      .querySelector("#loginExistingAccount")
      ?.addEventListener("click", () => {
        const nickname = document
          .querySelector("#childNickname")
          ?.value.trim()
          .toLowerCase();
        window.__MILO_PROFILE_OPEN = false;
          document.querySelector("#childLogin").classList.add("hidden");
        window.MILO_ACCOUNT?.showLogin?.({
          nickname,
          notice: "Đây là màn đăng nhập dành cho tài khoản đã có.",
        });
      });
    document.querySelector("#profileClose")?.addEventListener("click", () => {
      const modal = document.querySelector("#childLogin");
      if (modal) {
        window.__MILO_PROFILE_OPEN = false;
        modal.classList.add("hidden");
        delete modal.dataset.openMode;
      }
    });
    document.querySelector("#profileOpenStudySettings")?.addEventListener("click", () => {
      window.__MILO_PROFILE_OPEN = false;
      document.querySelector("#childLogin")?.classList.add("hidden");
      document.querySelector("#studyDurationButton")?.click();
    });
    updateProfileMode();
  }

  function showProfile() {
    const hasSession = Boolean(
      profile?.nickname && localStorage.getItem("milo-commerce-token-v1"),
    );
    if (!hasSession) {
      const rememberedNickname =
        localStorage.getItem(LAST_NICKNAME_KEY) || profile?.nickname || "";
      if (rememberedNickname) {
        window.MILO_ACCOUNT?.showLogin?.({
          nickname: rememberedNickname,
          notice: "Tài khoản đã có. Hãy đăng nhập trước khi mở hồ sơ.",
        });
      } else {
        showRegistration();
      }
      return;
    }
    const modal = document.querySelector("#childLogin");
    const title = document.querySelector("#childLoginTitle");
    if (!modal) return;
    profile = readProfile();
    document.querySelector("#childName").value = profile?.name || "";
    document.querySelector("#childNickname").value = profile?.nickname || "";
    document.querySelector("#parentPin").value = "";
    updateProfileMode();
    document
      .querySelectorAll('[name="childGender"]')
      .forEach((radio) => (radio.checked = radio.value === profile?.gender));
    if (title) {
      title.textContent = profile?.nickname
        ? "Hồ sơ học viên"
        : "Đăng ký tài khoản Milo";
    }
    window.__MILO_PROFILE_OPEN = true;
    modal.dataset.openMode = "profile";
    modal.classList.remove("hidden");
    const scrollArea = modal.querySelector(".auth-form-scroll");
    if (scrollArea) scrollArea.scrollTop = 0;
    window.MILO_ACCOUNT?.refreshProfileCard?.();
    setTimeout(
      () =>
        document
          .querySelector(profile?.nickname ? "#childName" : "#childNickname")
          ?.focus(),
      80,
    );
  }

  function showRegistration() {
    window.__MILO_PROFILE_OPEN = false;
    document.documentElement.classList.remove("milo-auth-required-boot");
    const modal = document.querySelector("#childLogin");
    if (!modal) return;
    document.querySelector("#accountLoginModal")?.classList.add("hidden");
    profile = null;
    localStorage.removeItem(PROFILE_KEY);
    document.querySelector("#childName").value = "";
    document.querySelector("#childNickname").value = "";
    document.querySelector("#parentPin").value = "";
    document.querySelector("#parentCurrentPin").value = "";
    document
      .querySelectorAll('[name="childGender"]')
      .forEach((radio) => (radio.checked = false));
    const error = document.querySelector("#profileError");
    if (error) error.textContent = "";
    updateProfileMode();
    updateProfileUI();
    modal.classList.remove("hidden");
    setTimeout(() => document.querySelector("#childNickname")?.focus(), 60);
  }

  function updateProfileUI() {
    const avatar = document.querySelector(".avatar");
    if (!avatar) return;
    const hasSession = Boolean(
      profile?.nickname && localStorage.getItem("milo-commerce-token-v1"),
    );
    const name = hasSession ? profile.name : "Đăng nhập";
    avatar.innerHTML = hasSession
      ? `<span class="profile-icon">${childIcon(profile.gender)}</span><small>${escapeProfile(name)}<em>@${escapeProfile(profile.nickname)}</em></small>`
      : '<span class="profile-icon">🔐</span><small>Đăng nhập<em>Hồ sơ học viên</em></small>';
    avatar.setAttribute("role", "button");
    avatar.setAttribute("tabindex", "0");
    avatar.setAttribute(
      "aria-label",
      hasSession ? `Mở hồ sơ của ${name}` : "Đăng nhập hồ sơ bé",
    );
    avatar.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      showProfile();
    };
    avatar.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showProfile();
      }
    };
  }

  function choiceActions() {
    const head = document.querySelector(".pet-choice-head");
    if (!head) return null;
    let actions = head.querySelector(".pet-choice-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "pet-choice-actions";
      head.appendChild(actions);
    }
    return actions;
  }

  function syncPetChoice() {
    const grade = Number(state.grade);
    const locked = petLocked(grade);
    const activeId = selectedPetId(grade);
    const activePet = selectedPet(grade);
    const actions = choiceActions();
    if (!actions) return;

    document.querySelectorAll("#petChoiceGrid [data-pet-id]").forEach((card) => {
      const active = card.dataset.petId === activeId;
      card.classList.toggle("disabled-choice", locked && !active);
      card.classList.toggle("pending", !locked && active);
      const button = card.querySelector("button");
      if (button) {
        button.textContent = locked
          ? active
            ? `✓ ${activePet[1]} đang đồng hành`
            : "Đã khóa lựa chọn"
          : active
            ? `Đang chọn ${activePet[1]}`
            : "Xem thử bạn này";
      }
    });

    if (locked) {
      actions.innerHTML = `<button class="change-pet" id="changePetChoice" type="button">Phụ huynh đổi pet</button>`;
      const badge = document.querySelector("#petSavedBadge");
      if (badge) badge.textContent = `✓ Lớp ${grade} chỉ dùng ${activePet[1]}`;
      document.querySelector("#changePetChoice").onclick = () => {
        const now = Date.now();
        if (now > unlockArmedUntil) {
          unlockArmedUntil = now + 5000;
          document.querySelector("#changePetChoice").textContent =
            "Bấm lần nữa để xác nhận đổi";
          showToast("Chỉ phụ huynh nên thay đổi pet đã chọn.");
          return;
        }
        localStorage.removeItem(lockKey(grade));
        unlockArmedUntil = 0;
        renderPetHub();
        syncPetChoice();
        showToast(`Đã mở lựa chọn pet cho lớp ${grade}.`);
      };
    } else {
      actions.innerHTML = `<button class="confirm-pet" id="confirmPetChoice" type="button">Xác nhận ${activePet[1]} cho lớp ${grade}</button>`;
      const badge = document.querySelector("#petSavedBadge");
      if (badge) badge.textContent = "Chưa xác nhận pet";
      document.querySelector("#confirmPetChoice").onclick = () => {
        localStorage.setItem(`milo-selected-pet-${grade}`, activeId);
        localStorage.setItem(lockKey(grade), "1");
        renderPetHub();
        renderPet();
        syncPetChoice();
        triggerMiloMotion("celebrate", 2400);
        const child = profile?.name ? `${profile.name}, ` : "";
        speak(`${child}${activePet[1]} sẽ là bạn đồng hành duy nhất của lớp ${grade}.`);
        showToast(`Đã khóa ${activePet[1]} cho lớp ${grade}.`);
      };
    }

    let note = document.querySelector(".pet-choice-lock-note");
    if (!note) {
      note = document.createElement("p");
      note.className = "pet-choice-lock-note";
      document.querySelector("#petChoiceGrid")?.insertAdjacentElement("afterend", note);
    }
    note.textContent = locked
      ? `Lớp ${grade} chỉ sử dụng ${activePet[1]} trên trang học, game, kiểm tra và trò chuyện.`
      : `Chọn thử một bạn rồi bấm “Xác nhận”. Sau khi xác nhận, lớp ${grade} chỉ sử dụng đúng pet đó.`;
    syncTutorPetLabels();
  }

  function syncTutorPetLabels() {
    const petName = selectedPet(state.grade)[1];
    const chatTitle = document.querySelector("#view-chat .section-top h2");
    const askLabel = document.querySelector('label[for="askText"]');
    const askInput = document.querySelector("#askText");
    const speechLabel = document.querySelector("#petSpeechLabel");
    const micSmall = document.querySelector("#micSmall");
    const micLarge = document.querySelector("#micLarge");
    const petImage = document.querySelector("#petImage");
    const heroImage = document.querySelector("#heroMiloImage");
    const hubImage = document.querySelector("#petHubHero");
    if (chatTitle) chatTitle.textContent = `Trò chuyện cùng ${petName}`;
    if (askLabel)
      askLabel.textContent = `Hỏi ${petName} bằng tiếng Việt hoặc tiếng Anh`;
    if (askInput)
      askInput.placeholder = `Ví dụ: ${petName} ơi, con chưa hiểu câu này`;
    if (speechLabel) speechLabel.textContent = `${petName.toUpperCase()} SAYS`;
    if (micSmall) micSmall.title = `Nói với ${petName}`;
    if (micLarge) micLarge.title = `Nói với ${petName}`;
    if (petImage) petImage.alt = `${petName} toàn thân, bạn đồng hành của bé`;
    if (heroImage) heroImage.alt = `${petName}, bạn đồng hành học tiếng Anh`;
    if (hubImage) hubImage.alt = `${petName} đang được chọn`;
    const greeting = document.querySelector(".prompts .prompt");
    if (greeting) greeting.textContent = `Hello, ${petName}!`;
  }

  function bindPetChoiceGuard() {
    const grid = document.querySelector("#petChoiceGrid");
    if (!grid) return;
    grid.addEventListener(
      "click",
      (event) => {
        const card = event.target.closest("[data-pet-id]");
        if (!card) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const grade = Number(state.grade);
        if (petLocked(grade)) {
          if (card.dataset.petId === selectedPetId(grade)) {
            triggerMiloMotion("wave", 1800);
            showToast(`${selectedPet(grade)[1]} là pet của lớp ${grade}.`);
          } else {
            showToast(`Lớp ${grade} chỉ được dùng 1 pet.`);
          }
          return;
        }
        localStorage.setItem(`milo-selected-pet-${grade}`, card.dataset.petId);
        renderPetHub();
        renderPet();
        syncPetChoice();
        triggerMiloMotion("wave", 1800);
        showToast(`Đang xem thử ${selectedPet(grade)[1]}. Hãy bấm xác nhận.`);
      },
      true,
    );
  }

  function ensurePetChosen() {
    if (petLocked(state.grade)) return true;
    setView("pets");
    renderPetHub();
    syncPetChoice();
    showToast(`Hãy chọn và xác nhận 1 pet cho lớp ${state.grade} trước.`);
    return false;
  }

  let liveConversation = false;
  let liveBusy = false;
  let liveRecognition = null;

  function tutorContext(question, extra = {}) {
    const pet = selectedPet(state.grade);
    return {
      question,
      grade: state.grade,
      unit: currentUnit(),
      gradeData: currentGrade(),
      petName: pet[1],
      childName: profile?.name || "",
      part: state.module || "",
      assistantMode: window.MILO_ACTIVE_ASSISTANT || "general",
      ...extra,
    };
  }

  function addBubble(container, className, text) {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${className}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

  function decorateTutorReply(bubble, response) {
    if (!bubble) return;
    if (response.diagnosis?.label && response.mode !== "locked") {
      const diagnosis = document.createElement("small");
      diagnosis.className = "ai-diagnosis-chip";
      diagnosis.textContent = `🧭 Milo nhận ra: ${response.diagnosis.label}`;
      bubble.insertAdjacentElement("afterend", diagnosis);
    }
    window.MILO_AI_FEEDBACK?.renderAfter?.(bubble, response, {
      onRetry: (prompt) => {
        const input = document.querySelector("#chatText");
        if (input) input.value = prompt || "";
        oneShotVoice(true);
      },
    });
    if (response.mode === "locked") {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "ai-unlock-cta";
      action.dataset.openAiPlans = "1";
      action.textContent = "Đăng nhập để dùng AI Plus miễn phí";
      bubble.insertAdjacentElement("afterend", action);
    }
  }

  async function tutorAsk(question, addToChat, extra = {}) {
    const clean = String(question || "").trim();
    if (!clean) return null;
    const messages = document.querySelector("#messages");
    let replyBubble;
    if (addToChat && messages) {
      addBubble(messages, "user", clean);
      replyBubble = addBubble(
        messages,
        "milo",
        `${selectedPet(state.grade)[1]} đang tìm đúng chỗ con gặp khó…`,
      );
      replyBubble.classList.add("is-thinking");
      replyBubble.setAttribute("aria-busy", "true");
    }
    const response = await window.MILO_TUTOR.ask(tutorContext(clean, extra));
    if (replyBubble) {
      replyBubble.textContent = response.answer;
      replyBubble.classList.remove("is-thinking");
      replyBubble.removeAttribute("aria-busy");
      decorateTutorReply(replyBubble, response);
    }
    if (!addToChat) {
      const petReply = document.querySelector("#miloMessage");
      if (petReply) petReply.textContent = response.answer;
      triggerMiloMotion("talk", 2600);
      showToast(`${selectedPet(state.grade)[1]} đã hướng dẫn từng bước.`);
    }
    if (window.MILO_AI_LANGUAGE?.voiceEnabled?.() !== false) {
      await window.MILO_PET_VOICE.speak(
        response.speechSegments?.length ? response.speechSegments : response.answer,
      );
    }
    const mode = document.querySelector("#tutorMode");
    if (mode) {
      const onlineTier = {
        plus: "● Milo đã sẵn sàng",
        "vip-pro-max-trial": "● Milo đã sẵn sàng · VIP PRO MAX",
        "vip-pro-max": "● Milo đã sẵn sàng · VIP PRO MAX",
      }[response.accessLevel];
      mode.textContent =
        response.mode === "online"
          ? onlineTier || "● Milo đã sẵn sàng"
          : {
              offline: "● Milo chưa thể kết nối. Con hãy thử lại nhé",
              locked: "● Cần đăng nhập tài khoản",
            }[response.mode] || "● Milo đang kết nối…";
      mode.dataset.mode = response.mode;
    }
    const liveDiagnosis = document.querySelector("#aiLiveDiagnosis");
    if (liveDiagnosis && response.diagnosis?.label) {
      liveDiagnosis.textContent = `🧭 Milo nhận ra: ${response.diagnosis.label}`;
    }
    return response;
  }

  function liveStatus(text, stateName = "") {
    const status = document.querySelector("#aiLiveStatus");
    if (!status) return;
    status.textContent = text;
    status.dataset.state = stateName;
  }

  function stopLiveConversation(message = "Đã dừng trò chuyện trực tiếp.") {
    liveConversation = false;
    liveBusy = false;
    liveRecognition?.abort?.();
    liveRecognition = null;
    window.speechSynthesis?.cancel?.();
    document.querySelector("#startAiLive")?.classList.remove("hidden");
    document.querySelector("#stopAiLive")?.classList.add("hidden");
    liveStatus(message, "stopped");
  }

  function startLiveRecognition() {
    if (!liveConversation || liveBusy) return;
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      stopLiveConversation(
        "Máy này chưa hỗ trợ nhận giọng nói. Con có thể gõ câu trả lời.",
      );
      return;
    }
    liveRecognition?.abort?.();
    const recognition = new Recognition();
    liveRecognition = recognition;
    recognition.lang = window.MILO_AI_LANGUAGE?.recognitionLocale?.(
      document.querySelector("#aiLiveLanguage")?.value || "auto",
      state.module || "conversation",
    ) || "vi-VN";
    recognition.maxAlternatives = 5;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () =>
      liveStatus("Milo đang nghe… con hãy nói tự nhiên.", "listening");
    recognition.onresult = (event) => {
      let transcript = "";
      let finalText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalText += event.results[index][0].transcript;
        }
      }
      const output = document.querySelector("#aiLiveTranscript");
      if (output) output.textContent = transcript || "…";
      if (!finalText.trim() || liveBusy) return;
      window.MILO_AI_LANGUAGE?.remember?.(finalText);
      liveBusy = true;
      liveStatus("Milo đang chẩn đoán đúng chỗ con vướng…", "thinking");
      tutorAsk(finalText, true, { conversationMode: "voice" })
        .then((response) => {
          liveBusy = false;
          if (response?.mode === "locked") {
            stopLiveConversation("Cần kích hoạt gói Trợ lý AI để trò chuyện.");
            return;
          }
          liveStatus("Milo đã trả lời. Chuẩn bị nghe lượt tiếp theo…", "speaking");
          setTimeout(startLiveRecognition, 180);
        })
        .catch(() => {
          liveBusy = false;
          liveStatus("Milo chưa xử lý được. Con hãy nói lại nhé.", "error");
          setTimeout(startLiveRecognition, 500);
        });
    };
    recognition.onerror = (event) => {
      if (!liveConversation) return;
      liveStatus(
        event.error === "not-allowed"
          ? "Micro đang bị chặn. Hãy cho phép quyền micro trong trình duyệt."
          : "Milo chưa nghe rõ. Con thử nói lại nhé.",
        "error",
      );
    };
    recognition.onend = () => {
      if (liveConversation && !liveBusy) setTimeout(startLiveRecognition, 350);
    };
    try {
      recognition.start();
    } catch {
      setTimeout(startLiveRecognition, 450);
    }
  }

  function startLiveConversation() {
    liveConversation = true;
    document.querySelector("#startAiLive")?.classList.add("hidden");
    document.querySelector("#stopAiLive")?.classList.remove("hidden");
    startLiveRecognition();
  }

  function oneShotVoice(addToChat) {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast("Tính năng nói cần quyền micro và máy hỗ trợ nhận giọng nói.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = window.MILO_AI_LANGUAGE?.recognitionLocale?.(
      localStorage.getItem("milo-ai-input-language-v60") || "auto",
      state.module || "conversation",
    ) || "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onstart = () => showToast("Milo đang nghe…");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      window.MILO_AI_LANGUAGE?.remember?.(transcript);
      tutorAsk(transcript, addToChat, {
        conversationMode: "voice",
      });
    };
    recognition.onerror = () =>
      showToast("Milo chưa nghe rõ hoặc chưa có quyền micro.");
    recognition.start();
  }

  function mountTutorIntro() {
    const chatView = document.querySelector("#view-chat");
    const chat = chatView?.querySelector(".chat-large");
    if (!chatView || !chat || chat.dataset.miloReady === "1") return;
    chat.dataset.miloReady = "1";
    const messages = chat.querySelector("#messages");
    if (messages) {
      messages.innerHTML = "";
      addBubble(
        messages,
        "milo",
        `${selectedPet(state.grade)[1]} ở đây rồi! Con gửi phần Tiếng Anh đang khó, Milo sẽ giải thích từng bước thật dễ hiểu.`,
      );
    }
    chat.querySelector(".chat-input")?.insertAdjacentHTML(
      "beforebegin",
      `<div class="tutor-quick" aria-label="Câu hỏi gợi ý"><button type="button" data-tutor-quick="Giải thích phần con đang học bằng ba bước dễ hiểu.">Giải thích bài</button><button type="button" data-tutor-quick="Hãy sửa giúp con câu tiếng Anh này và giải thích lỗi ngắn gọn.">Sửa câu</button><button type="button" data-tutor-quick="Hãy luyện hội thoại tiếng Anh với con, mỗi lượt hỏi một câu.">Luyện hội thoại</button></div>`,
    );
    chat.querySelectorAll("[data-tutor-quick]").forEach((button) => {
      button.onclick = () => tutorAsk(button.dataset.tutorQuick, true);
    });
  }

  function bindTutorForms() {
    const smallForm = document.querySelector("#askForm");
    const largeForm = document.querySelector("#chatForm");
    if (smallForm) {
      smallForm.onsubmit = (event) => {
        event.preventDefault();
        const input = document.querySelector("#askText");
        tutorAsk(input.value, false);
        input.value = "";
      };
    }
    if (largeForm) {
      largeForm.onsubmit = (event) => {
        event.preventDefault();
        const input = document.querySelector("#chatText");
        tutorAsk(input.value, true);
        input.value = "";
      };
    }
    document.querySelectorAll(".prompt").forEach((button) => {
      button.onclick = () => tutorAsk(button.textContent, false);
    });
    const micSmall = document.querySelector("#micSmall");
    const micLarge = document.querySelector("#micLarge");
    if (micSmall) micSmall.onclick = () => oneShotVoice(false);
    if (micLarge) micLarge.onclick = () => oneShotVoice(true);
  }

  function upgradeVoice() {
    if (typeof miloVoice !== "undefined") {
      miloVoice = (text, rate = 0.82) =>
        window.MILO_PET_VOICE.speak(text, rate);
    }
  }

  const originalRenderPetHub = renderPetHub;
  renderPetHub = function () {
    originalRenderPetHub();
    syncPetChoice();
  };

  const originalUpdateGrade = updateGrade;
  updateGrade = function () {
    originalUpdateGrade();
    syncPetChoice();
  };

  mountProfile();
  updateProfileUI();
  mountTutorIntro();
  bindTutorForms();
  bindPetChoiceGuard();
  upgradeVoice();
  syncPetChoice();
  window.MILO_TUTOR_UI = {
    ask: tutorAsk,
    startLiveConversation,
    stopLiveConversation,
  };

  document.querySelector("#continueBtn").onclick = openLesson;
  document.querySelector("#openUnitBtn").onclick = openLesson;
  document.querySelector("#openFreeAi")?.addEventListener("click", () => {
    if (typeof setView === "function") setView("chat");
  });

  window.MILO_PROFILE = { showProfile, showRegistration };
})();
