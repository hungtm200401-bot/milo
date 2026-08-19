(function () {
  "use strict";

  const ACCESS_KEY = "milo-commerce-access-v1";
  const TOKEN_KEY = "milo-commerce-token-v1";
  const MODE_KEY = "milo-ai-preferred-tier-v60";
  const SCORE_KEY = "milo-vocab-pronunciation-scores-v60";
  const VOICE_REPLY_KEY = "milo-ai-voice-reply-v60";

  const partMeta = {
    vipmax: { icon: "👑", label: "Bản đồ VIP Max", assistant: "pathway", difficulty: "unit", prompt: "Hãy chỉ cho con mục tiêu quan trọng nhất của Unit và chia thành ba bước học ngắn." },
    sourcebook: { icon: "📕", label: "Sách nguồn", assistant: "pathway", difficulty: "unit", prompt: "Hãy giúp con đọc trang nguồn đang học, nêu từ khóa và giải thích phần khó bằng lời thật dễ hiểu." },
    warmup: { icon: "🎈", label: "Khởi động", assistant: "conversation", difficulty: "conversation", prompt: "Hãy dẫn con khởi động bằng một cuộc hội thoại thật ngắn theo chủ đề Unit." },
    vocabulary: { icon: "📚", label: "Bài 1 · Từ mới", assistant: "vocabulary", difficulty: "vocabulary", prompt: "Hãy dạy con ba từ mới của Unit: nghĩa, cách nhớ, phát âm và một câu ví dụ ngắn." },
    phonics: { icon: "🔤", label: "Bài 2 · Phát âm", assistant: "pronunciation", difficulty: "pronunciation", prompt: "Hãy dạy con âm trọng tâm, khẩu hình, vị trí lưỡi và cho con một vòng luyện ngắn." },
    language: { icon: "🧠", label: "Bài 3 · Mẫu câu", assistant: "grammar", difficulty: "grammar", prompt: "Hãy giải thích mẫu câu của Unit, nêu một lỗi dễ nhầm và cho con điền một câu." },
    grammar: { icon: "🚀", label: "Grammar Levels", assistant: "grammar", difficulty: "grammar", prompt: "Hãy kiểm tra con đang ở mức ngữ pháp nào rồi dạy đúng một bước tiếp theo." },
    listening: { icon: "🎧", label: "Bài 4 · Nghe", assistant: "listening", difficulty: "listening", prompt: "Hãy dạy con cách bắt từ khóa trong bài nghe và cho một lượt nghe chậm ngắn." },
    speaking: { icon: "💬", label: "Bài 5 · Nói", assistant: "conversation", difficulty: "speaking", prompt: "Hãy đóng vai bạn nói chuyện, hỏi con từng câu và sửa một lỗi quan trọng sau mỗi lượt." },
    reading: { icon: "📖", label: "Bài 6 · Đọc", assistant: "test", difficulty: "reading", prompt: "Hãy chỉ con cách tìm ý chính, từ khóa và bằng chứng trong bài đọc hiện tại." },
    writing: { icon: "✍️", label: "Bài 7 · Viết", assistant: "writing", difficulty: "writing", prompt: "Hãy giúp con lập ý, viết một câu mẫu rồi để con tự viết lại bằng ý của mình." },
    project: { icon: "🎨", label: "Vận dụng", assistant: "pathway", difficulty: "unit", prompt: "Hãy chia dự án Unit thành các bước nhỏ và kiểm tra con đã dùng đúng từ mới, mẫu câu chưa." },
    games: { icon: "🎮", label: "Game Zone", assistant: "test", difficulty: "test", prompt: "Hãy ôn nhanh kiến thức con vừa sai trong trò chơi và cho một câu thử lại." },
    test: { icon: "✅", label: "Kiểm tra", assistant: "test", difficulty: "test", prompt: "Hãy giải thích câu con đang sai bằng từ khóa, lý do và cách tự kiểm tra lần sau." },
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);

  function readJson(key, fallback = null) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  }

  function access() {
    return readJson(ACCESS_KEY, {});
  }

  function isVip() {
    const current = access();
    if (!["vip-pro-max", "vip-pro-max-trial"].includes(current?.accessLevel)) return false;
    const expiresAt = new Date(current?.activeUntil || "").getTime();
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }

  function activeTier() {
    return isVip() ? "pro" : "plus";
  }

  function syncTierWithAccess() {
    const tier = activeTier();
    localStorage.setItem(MODE_KEY, tier);
    const meta = partMeta[currentPart()] || partMeta.warmup;
    window.MILO_ACTIVE_ASSISTANT = tier === "pro" ? (meta.assistant || "conversation") : "general";
    return tier;
  }

  function tierText() {
    const current = access();
    if (current?.accessLevel === "vip-pro-max") return "VIP PRO MAX đã kích hoạt";
    if (current?.accessLevel === "vip-pro-max-trial") return "VIP PRO MAX dùng thử 24 giờ";
    return localStorage.getItem(TOKEN_KEY)
      ? "AI Plus đang sẵn sàng"
      : "Đăng nhập để dùng AI Plus";
  }


  function voiceReplyEnabled() {
    return localStorage.getItem(VOICE_REPLY_KEY) !== "0";
  }

  function cleanSpeechText(value) {
    return String(value || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[*_#>`~]/g, " ")
      .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1800);
  }

  function speakAiReply(value) {
    if (!voiceReplyEnabled()) return Promise.resolve(false);
    const payload = Array.isArray(value) ? value : cleanSpeechText(value);
    if (!payload || (Array.isArray(payload) && !payload.length)) return Promise.resolve(false);
    return window.MILO_PET_VOICE?.speak?.(payload, .82) || Promise.resolve(false);
  }

  function startDrawerVoiceQuestion() {
    ensureLessonDrawer();
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = drawer.querySelector("#journeyAiMic");
    const status = drawer.querySelector("#journeyAiVoiceStatus");
    const input = drawer.querySelector("#journeyAiInput");
    if (!Recognition) {
      if (status) status.textContent = "Milo cần quyền micro và máy hỗ trợ nhận giọng nói.";
      return;
    }
    const recognition = new Recognition();
    recognition.lang = window.MILO_AI_LANGUAGE?.recognitionLocale?.(
      drawer.querySelector("#journeyAiLanguage")?.value || "auto",
      currentPart(),
    ) || "vi-VN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;
    let finalText = "";
    recognition.onstart = () => {
      mic?.classList.add("is-listening");
      if (mic) mic.textContent = "⏹ Đang nghe…";
      if (status) status.textContent = "Con nói trực tiếp; Milo sẽ tự gửi khi nghe xong.";
    };
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += transcript;
        else interim += transcript;
      }
      input.value = (finalText || interim).trim();
    };
    recognition.onerror = (event) => {
      if (status) status.textContent = event.error === "not-allowed" ? "Micro đang bị chặn. Hãy cho phép quyền micro." : "Milo chưa nghe rõ, con thử nói lại nhé.";
    };
    recognition.onend = () => {
      mic?.classList.remove("is-listening");
      if (mic) mic.textContent = "🎤 Hỏi trực tiếp";
      const question = String(finalText || input.value || "").trim();
      if (!question) return;
      window.MILO_AI_LANGUAGE?.remember?.(question);
      input.value = "";
      if (status) status.textContent = "Đã nghe câu hỏi. Milo đang trả lời bằng giọng nói…";
      askLessonAssistant(question, "voice");
    };
    recognition.start();
  }

  function currentGrade() {
    return Number(document.querySelector("#gradeSelect")?.value || localStorage.getItem("milo-grade") || 3);
  }

  function currentUnitIndex(grade = currentGrade()) {
    return Number(document.querySelector("#unitSelect")?.value || localStorage.getItem(`milo-unit-${grade}`) || 0);
  }

  function currentUnit() {
    const grade = currentGrade();
    const gradeData = window.MILO_CURRICULUM?.[grade];
    const unitIndex = Math.max(0, Math.min(11, currentUnitIndex(grade)));
    return { grade, gradeData, unitIndex, unit: gradeData?.units?.[unitIndex] || gradeData?.units?.[0] || null };
  }

  function currentPart() {
    if (!document.body.classList.contains("lesson-app")) return "journey";
    const grade = currentGrade();
    const unit = currentUnitIndex(grade);
    return location.hash.slice(1) || localStorage.getItem(`milo-last-part-${grade}-${unit}`) || "warmup";
  }

  function openPlans() {
    if (window.SubscriptionUI && typeof window.SubscriptionUI.openPlans === "function") {
      window.SubscriptionUI.openPlans({ source: "global-dock" });
      return;
    }
    if (window.MiloSubscriptionUI && typeof window.MiloSubscriptionUI.openPlans === "function") {
      window.MiloSubscriptionUI.openPlans({ source: "global-dock" });
      return;
    }
    if (window.MILO_COMMERCE?.openVipPlans) {
      window.MILO_COMMERCE.openVipPlans({ source: "global-dock" });
      return;
    }
    if (window.MILO_COMMERCE?.openAiPlans) {
      window.MILO_COMMERCE.openAiPlans();
      return;
    }
    const returnUrl = `${location.pathname.split("/").pop() || "lesson.html"}${location.search}${location.hash}`;
    location.href = `index.html?view=journey&payment=1&openPlans=1&return=${encodeURIComponent(returnUrl)}`;
  }

  function setPreferredTier(tier) {
    if (tier === "pro" && !isVip()) {
      openPlans();
      return false;
    }
    localStorage.setItem(MODE_KEY, tier);
    window.MILO_ACTIVE_ASSISTANT = tier === "pro" ? (window.MILO_ACTIVE_ASSISTANT === "general" ? "conversation" : window.MILO_ACTIVE_ASSISTANT || "conversation") : "general";
    window.dispatchEvent(new CustomEvent("milo:assistant-tier-changed", { detail: { tier } }));
    window.dispatchEvent(new Event("milo:access-updated"));
    return true;
  }

  function openMainChat(tier = activeTier(), prompt = "") {
    const effectiveTier = syncTierWithAccess();
    setPreferredTier(effectiveTier);
    if (typeof window.setView === "function") window.setView("chat");
    else document.querySelector('[data-view="chat"]')?.click();
    setTimeout(() => {
      const input = document.querySelector("#chatText");
      if (input && prompt) input.value = prompt;
      input?.focus();
      refreshMainChatUi();
    }, 40);
  }

  function mountGlobalDock() {
    if (document.querySelector("#miloAiGlobalDock")) return;
    const dock = document.createElement("aside");
    dock.className = "milo-ai-global-dock";
    dock.id = "miloAiGlobalDock";
    dock.innerHTML = `
      <div class="milo-ai-dock-head">
        <span class="milo-ai-dock-logo" id="miloAiDockLogo">✦</span>
        <div class="milo-ai-dock-copy"><b id="miloAiDockTitle">Trợ lý AI Plus</b><small id="miloAiDockCopy">Hỏi AI ở bất kỳ trang nào</small></div>
        <button class="milo-ai-dock-toggle" type="button" aria-label="Thu gọn trợ lý">−</button>
      </div>
      <div class="milo-ai-dock-body">
        <button class="milo-ai-dock-action current plus" type="button" data-global-ai-current><b id="miloAiDockActionTitle">✦ Hỏi AI Plus</b><small id="miloAiDockActionCopy">Quyền mặc định của tài khoản</small></button>
        <button class="milo-ai-dock-action pro" type="button" id="miloAiDockBuyVipBtn" data-action="open-vip-plans" data-open-vip-plans title="Xem các gói VIP PRO MAX">
          <b id="miloAiDockBuyTitle" style="color:#7c3aed;">👑 Mua VIP PRO MAX</b>
          <small id="miloAiDockBuyCopy">3 Gói: 1T / 6T / 1 Năm</small>
        </button>
      </div>
      <div class="milo-ai-dock-tier" id="miloAiDockTier"></div>`;
    document.body.appendChild(dock);
    dock.querySelector(".milo-ai-dock-toggle").onclick = () => {
      const minimized = dock.classList.toggle("is-minimized");
      dock.querySelector(".milo-ai-dock-toggle").textContent = minimized ? "+" : "−";
    };
    dock.querySelector("[data-global-ai-current]").onclick = () => {
      const tier = activeTier();
      if (document.body.classList.contains("lesson-app")) openLessonDrawer(tier);
      else openMainChat(tier);
    };
    dock.querySelector("#miloAiDockBuyVipBtn")?.addEventListener("click", () => {
      openPlans();
    });
    updateDock();
  }

  function syncDockVisibility() {
    const dock = document.querySelector("#miloAiGlobalDock");
    const chatView = document.querySelector("#view-chat");
    if (!dock || !chatView) return;
    const visible = !chatView.classList.contains("hidden");
    dock.classList.toggle("hidden", visible);
    document.body.classList.toggle("milo-chat-page-open", visible);
  }

  function updateDock() {
    const vip = isVip();
    const action = document.querySelector("[data-global-ai-current]");
    if (action) {
      action.classList.toggle("plus", !vip);
      action.classList.toggle("pro", vip);
      const title = action.querySelector("#miloAiDockActionTitle");
      const copy = action.querySelector("#miloAiDockActionCopy");
      if (title) title.textContent = vip ? "👑 Hỏi VIP PRO MAX" : "✦ Hỏi AI Plus";
      if (copy) copy.textContent = vip ? "Đã kích hoạt · tự dùng trợ lý chuyên môn" : "Quyền mặc định khi chưa mua gói";
    }
    const buyBtn = document.querySelector("#miloAiDockBuyVipBtn");
    const buyTitle = document.querySelector("#miloAiDockBuyTitle");
    const buyCopy = document.querySelector("#miloAiDockBuyCopy");
    if (buyTitle) buyTitle.textContent = vip ? "👑 Đã Mở VIP" : "👑 Mua VIP PRO MAX";
    if (buyCopy) buyCopy.textContent = vip ? "Gói cao cấp đang dùng" : "3 Gói: 1T / 6T / 1 Năm";
    const logo = document.querySelector("#miloAiDockLogo");
    const title = document.querySelector("#miloAiDockTitle");
    const copy = document.querySelector("#miloAiDockCopy");
    if (logo) logo.textContent = vip ? "👑" : "✦";
    if (title) title.textContent = vip ? "Trợ lý VIP PRO MAX" : "Trợ lý AI Plus";
    if (copy) copy.textContent = vip ? "Tự động dùng quyền VIP trên toàn app" : "Hỏi AI ở bất kỳ trang nào";
    const tier = document.querySelector("#miloAiDockTier");
    if (tier) {
      tier.textContent = tierText();
      tier.dataset.tier = vip ? "pro" : "plus";
    }
  }

  function mainContextLabel() {
    const { grade, unitIndex, unit } = currentUnit();
    return {
      title: `Lớp ${grade} · Unit ${unitIndex + 1}`,
      detail: unit?.title || "Bài đang học",
    };
  }

  function enhanceMainChat() {
    const chatView = document.querySelector("#view-chat");
    if (!chatView || document.querySelector("#miloChatProLayout")) return;
    chatView.classList.add("milo-chat-pro-view");
    const layout = document.createElement("div");
    layout.className = "milo-chat-pro-layout";
    layout.id = "miloChatProLayout";
    layout.innerHTML = `
      <main class="milo-chat-pro-main" id="miloChatProMain">
        <header class="milo-chat-workspace-head">
          <div class="milo-chat-avatar" aria-hidden="true">🦊</div>
          <div class="milo-chat-workspace-title"><small>TRÒ CHUYỆN CÙNG MILO</small><h2>Hỏi bài, luyện nói và sửa câu</h2><span class="milo-friendly-status" id="miloFriendlyStatus" data-state="connecting"><i></i><b>Milo đang kết nối…</b></span></div>
          <div class="milo-chat-workspace-chips"><span id="miloChatUnitChip">Unit đang học</span><b id="miloChatActiveTier">AI Plus</b></div>
          <button id="miloStatusRetry" class="milo-status-retry hidden" type="button">Thử lại</button>
        </header>
      </main>`;
    chatView.appendChild(layout);
    const main = layout.querySelector("#miloChatProMain");
    [...chatView.children].forEach((node) => {
      if (node === layout || node.classList?.contains("section-top")) return;
      main.appendChild(node);
    });
    refreshMainChatUi();
  }

  function refreshMainChatUi() {
    syncTierWithAccess();
    const context = mainContextLabel();
    const unitChip = document.querySelector("#miloChatUnitChip");
    if (unitChip) unitChip.textContent = context.title;
    const pageUnit = document.querySelector("#miloChatPageUnit");
    if (pageUnit) pageUnit.textContent = context.title;
    const activeTierChip = document.querySelector("#miloChatActiveTier");
    if (activeTierChip) activeTierChip.textContent = isVip() ? "VIP PRO MAX" : "AI Plus";
    const badge = document.querySelector("#chatAccessBadge");
    if (badge) {
      badge.textContent = isVip() ? "VIP PRO MAX" : "AI Plus";
      badge.className = `chat-access-badge ${isVip() ? "pro" : "plus"}`;
    }
    document.querySelector("#miloVipMiniCard")?.classList.toggle("hidden", isVip());
  }

  function updateAccessCopy() {
    syncTierWithAccess();
    const lessonToggle = document.querySelector("#lessonTutorToggle");
    if (lessonToggle) lessonToggle.textContent = isVip()
      ? "👑 Hỏi Milo chuyên sâu về chặng đang học"
      : "✦ Hỏi Milo về chặng đang học";
    updateDock();
    refreshMainChatUi();
    updateDrawerMode();
    const stageCard = document.querySelector(".journey-ai-stage-card");
    if (stageCard) {
      stageCard.remove();
      injectLessonStageCard();
    }
  }

  let drawer = null;
  let drawerTier = "plus";

  function ensureLessonDrawer() {
    if (drawer) return drawer;
    drawer = document.createElement("div");
    drawer.id = "journeyAiDrawer";
    drawer.className = "journey-ai-drawer hidden";
    drawer.innerHTML = `
      <section class="journey-ai-drawer-panel">
        <header class="journey-ai-drawer-head"><span id="journeyAiDrawerIcon">✨</span><div><small id="journeyAiDrawerTier">AI PLUS</small><b id="journeyAiDrawerTitle">Trợ lý của chặng học</b></div><button class="journey-ai-drawer-close" type="button" aria-label="Đóng">×</button></header>
        <div class="journey-ai-auto-tier"><b id="journeyAiAutoTier">✦ AI Plus đang hoạt động</b><span>Quyền trợ lý tự đổi theo tài khoản, không cần chọn thủ công.</span></div>
        <div class="journey-ai-drawer-messages" id="journeyAiMessages"></div>
        <form class="journey-ai-drawer-form" id="journeyAiForm">
          <div class="journey-ai-voice-controls">
            <select id="journeyAiLanguage" aria-label="Ngôn ngữ micro"><option value="auto">Tự động Việt–Anh</option><option value="vi-VN">🇻🇳 Tiếng Việt</option><option value="en-US">🇬🇧 English</option></select>
            <button id="journeyAiMic" class="journey-ai-mic" type="button">🎤 Hỏi trực tiếp</button>
            <button id="journeyAiVoiceToggle" class="journey-ai-voice-toggle" type="button">🔊 AI trả lời bằng giọng nói: Bật</button>
          </div>
          <small id="journeyAiVoiceStatus" class="journey-ai-voice-status">Có thể nói bằng tiếng Việt hoặc tiếng Anh.</small>
          <textarea id="journeyAiInput" placeholder="Hỏi về đúng phần con đang học…"></textarea>
          <div class="journey-ai-submit-row"><small id="journeyAiFormStatus">AI Plus dùng bối cảnh Unit và chặng hiện tại.</small><button type="submit">Gửi cho Milo →</button></div>
        </form>
      </section>`;
    document.body.appendChild(drawer);
    drawer.querySelector(".journey-ai-drawer-close").onclick = closeLessonDrawer;
    const voiceToggle = drawer.querySelector("#journeyAiVoiceToggle");
    const refreshVoiceToggle = () => {
      if (!voiceToggle) return;
      voiceToggle.classList.toggle("is-off", !voiceReplyEnabled());
      voiceToggle.textContent = voiceReplyEnabled() ? "🔊 AI trả lời bằng giọng nói: Bật" : "🔇 AI trả lời bằng giọng nói: Tắt";
    };
    refreshVoiceToggle();
    voiceToggle.onclick = () => {
      localStorage.setItem(VOICE_REPLY_KEY, voiceReplyEnabled() ? "0" : "1");
      if (!voiceReplyEnabled()) window.speechSynthesis?.cancel?.();
      refreshVoiceToggle();
    };
    drawer.querySelector("#journeyAiMic").onclick = startDrawerVoiceQuestion;
    drawer.querySelector("#journeyAiLanguage").onchange = (event) => window.MILO_AI_LANGUAGE?.setMode?.(event.target.value);
    drawer.addEventListener("click", (event) => {
      if (event.target === drawer) closeLessonDrawer();
    });

    drawer.querySelector("#journeyAiForm").onsubmit = (event) => {
      event.preventDefault();
      const input = drawer.querySelector("#journeyAiInput");
      const question = input.value.trim();
      if (!question) return;
      input.value = "";
      askLessonAssistant(question);
    };
    return drawer;
  }

  function updateDrawerMode() {
    if (!drawer) return;
    drawerTier = syncTierWithAccess();
    drawer.querySelectorAll("[data-drawer-tier]").forEach((button) => {
      const matches = button.dataset.drawerTier === drawerTier;
      button.classList.toggle("active", matches);
      button.classList.toggle("tier-hidden", !matches);
      button.disabled = matches;
      button.textContent = drawerTier === "pro" ? "👑 Đang dùng VIP PRO MAX" : "✦ Đang dùng AI Plus";
    });
    const part = currentPart();
    const meta = partMeta[part] || partMeta.warmup;
    drawer.querySelector("#journeyAiDrawerTier").textContent = drawerTier === "pro"
      ? "VIP PRO MAX · TRỢ LÝ CHUYÊN MÔN"
      : "AI PLUS · ĐANG SẴN SÀNG";
    drawer.querySelector("#journeyAiDrawerIcon").textContent = drawerTier === "pro" ? "👑" : meta.icon;
    drawer.querySelector("#journeyAiDrawerTitle").textContent = `${meta.label} · ${drawerTier === "pro" ? "dạy chuyên sâu" : "hướng dẫn từng bước"}`;
    const autoTier = drawer.querySelector("#journeyAiAutoTier");
    if (autoTier) autoTier.textContent = drawerTier === "pro" ? "👑 VIP PRO MAX đang tự động hoạt động" : "✦ AI Plus đang tự động hoạt động";
    const language = drawer.querySelector("#journeyAiLanguage");
    if (language) language.value = localStorage.getItem("milo-ai-input-language-v60") || "auto";
    drawer.querySelector("#journeyAiFormStatus").textContent = drawerTier === "pro"
      ? "VIP PRO MAX dùng trợ lý chuyên môn và bộ nhớ tiến bộ dài hạn."
      : "AI Plus dùng bối cảnh Unit và chặng hiện tại, không mở tính năng VIP.";
  }

  function addDrawerMessage(role, text, thinking = false) {
    const messages = drawer.querySelector("#journeyAiMessages");
    const bubble = document.createElement("div");
    bubble.className = `journey-ai-message ${role}${thinking ? " thinking" : ""}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  async function askLessonAssistant(question, conversationMode = "chat") {
    ensureLessonDrawer();
    const { grade, gradeData, unit } = currentUnit();
    const part = currentPart();
    const meta = partMeta[part] || partMeta.warmup;
    addDrawerMessage("user", question);
    const thinking = addDrawerMessage("milo", "Milo đang xem đúng Unit và chặng con đang học…", true);
    try {
      const result = await window.MILO_TUTOR.ask({
        question,
        grade,
        gradeData,
        unit,
        petName: document.querySelector("#lessonCoachImage")?.alt?.split(" Level")[0] || "Milo",
        part: meta.label,
        difficulty: meta.difficulty,
        conversationMode,
        assistantMode: drawerTier === "pro" ? meta.assistant : "general",
      });
      thinking.textContent = result.answer;
      thinking.classList.remove("thinking");
      window.MILO_AI_FEEDBACK?.renderAfter?.(thinking, result, {
        compact: true,
        onRetry: (prompt) => {
          const input = drawer.querySelector("#journeyAiInput");
          if (input) input.value = prompt || "";
          startDrawerVoiceQuestion();
        },
      });
      const voiceStatus = drawer.querySelector("#journeyAiVoiceStatus");
      if (voiceStatus) voiceStatus.textContent = voiceReplyEnabled() ? "Milo đang đọc đúng giọng Việt và giọng Anh." : "Câu trả lời bằng giọng nói đang tắt.";
      speakAiReply(result.speechSegments?.length ? result.speechSegments : result.answer);
      if (drawerTier === "pro" && !["vip-pro-max", "vip-pro-max-trial"].includes(result.accessLevel)) {
        drawerTier = "plus";
        updateDrawerMode();
      }
    } catch {
      thinking.textContent = "Milo chưa kết nối được AI trực tuyến. Con vẫn có thể nghe mẫu và luyện phát âm ở phần này.";
      thinking.classList.remove("thinking");
    }
  }

  function openLessonDrawer(tier = activeTier(), prompt = "") {
    ensureLessonDrawer();
    drawerTier = syncTierWithAccess();
    setPreferredTier(drawerTier);
    updateDrawerMode();
    drawer.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    const messages = drawer.querySelector("#journeyAiMessages");
    if (!messages.children.length) {
      const meta = partMeta[currentPart()] || partMeta.warmup;
      addDrawerMessage("milo", `${meta.icon} Mình đang ở ${meta.label}. Con có thể hỏi đúng phần đang học; Milo sẽ hướng dẫn từng bước, không trả lời lan man.`);
    }
    if (prompt) {
      drawer.querySelector("#journeyAiInput").value = prompt;
    }
    setTimeout(() => drawer.querySelector("#journeyAiInput")?.focus(), 40);
  }

  function closeLessonDrawer() {
    drawer?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function vocabScores() {
    return readJson(SCORE_KEY, {});
  }

  function saveVocabScore(target, score) {
    if (!target || !Number.isFinite(Number(score))) return;
    const { grade, unitIndex } = currentUnit();
    const all = vocabScores();
    const key = `${grade}-${unitIndex}-${String(target).toLowerCase()}`;
    all[key] = Math.max(Number(all[key] || 0), Math.round(Number(score)));
    localStorage.setItem(SCORE_KEY, JSON.stringify(all));
  }

  function scoreFor(target) {
    const { grade, unitIndex } = currentUnit();
    return Number(vocabScores()[`${grade}-${unitIndex}-${String(target).toLowerCase()}`] || 0);
  }

  function vocabularyLab(unit) {
    if (!unit?.words?.length) return "";
    return `<section class="journey-vocab-coach">
      <div class="journey-vocab-coach-head"><div><h4>🎯 Phòng luyện phát âm từ mới</h4><small>Nghe mẫu → nói vào micro → xem điểm trực tiếp → luyện lại từ chưa rõ.</small></div><div class="journey-vocab-score"><strong id="journeyVocabLiveScore">—</strong><small>điểm gần nhất</small></div></div>
      <div class="journey-vocab-word-grid">${unit.words.map((word) => {
        const score = scoreFor(word[0]);
        return `<article class="journey-vocab-word" data-vocab-word="${escapeHtml(word[0])}" ${score ? `data-score="${score}"` : ""}><div><span class="emoji">${word[2] || "🔤"}</span><div><b>${escapeHtml(word[0])}</b><small>${escapeHtml(word[1])}</small></div></div><footer><button class="listen" type="button" data-vocab-listen="${escapeHtml(word[0])}">🔊 Nghe</button><button class="score" type="button" data-vocab-score="${escapeHtml(word[0])}">🎤 Chấm điểm</button></footer></article>`;
      }).join("")}</div>
    </section>`;
  }

  function stagePrompts(meta, unit) {
    const word = unit?.words?.[0]?.[0] || "từ đầu tiên";
    const prompts = [meta.prompt];
    if (currentPart() === "vocabulary") {
      prompts.push(`Hãy hướng dẫn con phát âm từ “${word}” thật chậm và mô tả khẩu hình dễ làm.`);
      prompts.push("Hãy kiểm tra con nhớ nghĩa ba từ mới bằng ba câu hỏi ngắn.");
    } else if (currentPart() === "writing") {
      prompts.push("Hãy xem ý tưởng của con và cho một câu khung, không viết hộ cả bài.");
    } else if (currentPart() === "reading") {
      prompts.push("Hãy hỏi con một câu tìm ý chính và chỉ cách quay lại tìm bằng chứng.");
    } else {
      prompts.push("Hãy kiểm tra con bằng một câu thật ngắn về phần này.");
    }
    return prompts.slice(0, 3);
  }

  function injectLessonStageCard() {
    const content = document.querySelector("#lessonContent");
    if (!content) return;
    const existing = content.querySelector(".journey-ai-stage-card");
    if (document.body.classList.contains("micro-focus-mode")) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const { unit } = currentUnit();
    const part = currentPart();
    const meta = partMeta[part] || partMeta.warmup;
    const card = document.createElement("section");
    card.className = "journey-ai-stage-card";
    card.innerHTML = `
      <div class="journey-ai-stage-head"><span class="journey-ai-stage-icon">${isVip() ? "👑" : "✦"}</span><div class="journey-ai-stage-copy"><small>${isVip() ? "VIP PRO MAX · TRỢ LÝ CHUYÊN MÔN" : "AI PLUS · TRỢ LÝ THEO CHẶNG"}</small><h3>Milo dạy cùng con ở ${escapeHtml(meta.label)}</h3><p>${isVip() ? "Gói VIP đã kích hoạt nên chặng này tự dùng trợ lý chuyên môn VIP PRO MAX." : "Tài khoản đang ở Plus nên chặng này tự dùng AI Plus. Khi VIP được kích hoạt, nút sẽ tự chuyển sang VIP PRO MAX."}</p></div><span class="journey-ai-stage-badge" data-tier="${isVip() ? "pro" : "plus"}">${escapeHtml(tierText())}</span></div>
      <div class="journey-ai-stage-actions"><button class="${isVip() ? "pro" : "plus"}" type="button" data-stage-ai-current><b>${isVip() ? "👑 Hỏi VIP PRO MAX về chặng này" : "✦ Hỏi AI Plus về chặng này"}</b><small>${isVip() ? "Tự dùng trợ lý chuyên môn đã kích hoạt" : "Quyền Plus mặc định của tài khoản"}</small></button></div>
      <div class="journey-ai-prompts">${stagePrompts(meta, unit).map((prompt) => `<button type="button" data-stage-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("")}</div>
      ${part === "vocabulary" ? vocabularyLab(unit) : ""}`;
    const heading = content.querySelector(".content-heading");
    if (heading?.nextSibling) heading.parentNode.insertBefore(card, heading.nextSibling);
    else content.prepend(card);
    card.querySelector("[data-stage-ai-current]").onclick = () => openLessonDrawer(activeTier(), meta.prompt);
    card.querySelectorAll("[data-stage-prompt]").forEach((button) => {
      button.onclick = () => openLessonDrawer(activeTier(), button.dataset.stagePrompt);
    });
    card.querySelectorAll("[data-vocab-listen]").forEach((button) => {
      button.onclick = () => window.MILO_PET_VOICE?.speak?.(button.dataset.vocabListen, .62);
    });
    card.querySelectorAll("[data-vocab-score]").forEach((button) => {
      button.onclick = () => {
        card.querySelectorAll(".journey-vocab-word").forEach((item) => item.classList.toggle("is-active", item.dataset.vocabWord === button.dataset.vocabScore));
        window.MILO_PRONUNCIATION_COACH?.open?.(button.dataset.vocabScore);
      };
    });
  }

  function mountLessonAssistant() {
    const content = document.querySelector("#lessonContent");
    if (!content) return;
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        injectLessonStageCard();
      });
    };
    new MutationObserver(schedule).observe(content, { childList: true, subtree: false });
    window.addEventListener("hashchange", () => setTimeout(schedule, 20));
    schedule();
  }

  function handlePronunciationScore(detail = {}) {
    if (!detail.target || !Number.isFinite(Number(detail.score))) return;
    saveVocabScore(detail.target, Number(detail.score));
    const live = document.querySelector("#journeyVocabLiveScore");
    if (live) live.textContent = String(Math.round(Number(detail.score)));
    document.querySelectorAll(".journey-vocab-word").forEach((item) => {
      if (item.dataset.vocabWord?.toLowerCase() === String(detail.target).toLowerCase()) {
        item.dataset.score = String(Math.round(Number(detail.score)));
        item.classList.add("is-active");
      }
    });
  }

  function start() {
    syncTierWithAccess();
    mountGlobalDock();
    enhanceMainChat();
    const chatView = document.querySelector("#view-chat");
    if (chatView) {
      new MutationObserver(syncDockVisibility).observe(chatView, { attributes: true, attributeFilter: ["class"] });
      syncDockVisibility();
    }
    mountLessonAssistant();
    updateAccessCopy();
    const query = new URLSearchParams(location.search);
    if (query.get("openPlans") === "1" || query.get("payment") === "1") {
      setTimeout(openPlans, 350);
    }
  }

  window.addEventListener("milo:access-updated", updateAccessCopy);
  window.addEventListener("milo:trial-started", updateAccessCopy);
  window.addEventListener("milo:payment-confirmed", updateAccessCopy);
  window.addEventListener("milo:pronunciation-scored", (event) => handlePronunciationScore(event.detail || {}));
  window.addEventListener("milo:learning-event", (event) => {
    if (event.detail?.type === "pronunciation") handlePronunciationScore(event.detail);
  });

  window.MILO_AI_JOURNEY = {
    openCurrent: (prompt = "") => document.body.classList.contains("lesson-app") ? openLessonDrawer(activeTier(), prompt) : openMainChat(activeTier(), prompt),
    openPlus: (prompt = "") => document.body.classList.contains("lesson-app") ? openLessonDrawer(activeTier(), prompt) : openMainChat(activeTier(), prompt),
    openPro: (prompt = "") => isVip()
      ? (document.body.classList.contains("lesson-app") ? openLessonDrawer("pro", prompt) : openMainChat("pro", prompt))
      : openPlans(),
    isVip,
    tier: activeTier,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
