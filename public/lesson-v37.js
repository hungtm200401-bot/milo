(function () {
  const $ = (selector) => document.querySelector(selector);
  const panel = $("#lessonTutorPanel");
  const toggle = $("#lessonTutorToggle");
  const form = $("#lessonTutorForm");
  const input = $("#lessonTutorInput");
  const answer = $("#lessonTutorAnswer");
  const rail = $("#lessonCoachRail");
  const railToggle = $("#lessonCoachRailToggle");
  const railStateKey = "milo-lesson-ai-rail-collapsed-v1";
  let liveConversation = false;
  let liveBusy = false;
  let liveRecognition = null;

  function profile() {
    try {
      return JSON.parse(localStorage.getItem("milo-child-profile-v1") || "null");
    } catch {
      return null;
    }
  }

  function setRailCollapsed(collapsed, remember = true) {
    const isCollapsed = Boolean(collapsed);
    document.body.classList.toggle("milo-coach-rail-collapsed", isCollapsed);
    rail?.classList.toggle("is-collapsed", isCollapsed);
    if (railToggle) {
      railToggle.setAttribute("aria-expanded", String(!isCollapsed));
      railToggle.title = isCollapsed ? "Mở rộng trợ lý AI" : "Thu gọn trợ lý AI";
      const icon = railToggle.querySelector("span");
      const label = railToggle.querySelector("b");
      if (icon) icon.textContent = isCollapsed ? "⇤" : "⇥";
      if (label) label.textContent = isCollapsed ? "Mở AI" : "Thu gọn";
    }
    if (remember) {
      try { localStorage.setItem(railStateKey, isCollapsed ? "1" : "0"); } catch {}
    }
  }

  let savedRailCollapsed = false;
  try { savedRailCollapsed = localStorage.getItem(railStateKey) === "1"; } catch {}
  setRailCollapsed(savedRailCollapsed, false);
  railToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    setRailCollapsed(!document.body.classList.contains("milo-coach-rail-collapsed"));
  });
  rail?.addEventListener("click", () => {
    if (document.body.classList.contains("milo-coach-rail-collapsed")) {
      setRailCollapsed(false);
    }
  });

  function context(question, extra = {}) {
    const grade = Number($("#gradeSelect")?.value || 3);
    const unitIndex = Number($("#unitSelect")?.value || 0);
    const gradeData = window.MILO_CURRICULUM[grade];
    const petName =
      $("#coachCompanionLabel")?.textContent.replace(" ĐỒNG HÀNH", "") || "Milo";
    return {
      question,
      grade,
      gradeData,
      unit: gradeData.units[unitIndex],
      petName:
        petName.charAt(0).toUpperCase() + petName.slice(1).toLowerCase(),
      childName: profile()?.name || "",
      part: location.hash.slice(1) || "warmup",
      ...extra,
    };
  }

  function renderAnswer(response) {
    answer.textContent = response.answer;
    if (response.diagnosis?.label && response.mode !== "locked") {
      answer.insertAdjacentHTML(
        "beforeend",
        `<small class="ai-diagnosis-chip">🧭 Milo nhận ra: ${String(
          response.diagnosis.label,
        ).replace(/[&<>"']/g, "")}</small>`,
      );
    }
    window.MILO_AI_FEEDBACK?.renderInside?.(answer, response, {
      compact: true,
      onRetry: (prompt) => {
        if (input) input.value = prompt || "";
        startLive();
      },
    });
    if (response.mode === "locked") {
      answer.insertAdjacentHTML(
        "beforeend",
        `<a class="ai-unlock-cta" href="index.html?ai=1">Đăng nhập để dùng AI Plus miễn phí</a>`,
      );
    }
  }

  async function ask(question, extra = {}) {
    const clean = String(question || "").trim();
    if (!clean) return null;
    answer.classList.remove("hidden");
    answer.textContent = "Pet đang tìm đúng chỗ con gặp khó…";
    const response = await window.MILO_TUTOR.ask(context(clean, extra));
    renderAnswer(response);
    const coachMessage = $("#miloMessage");
    if (coachMessage) coachMessage.textContent = response.answer;
    if (window.MILO_AI_LANGUAGE?.voiceEnabled?.() !== false) {
      await window.MILO_PET_VOICE.speak(
        response.speechSegments?.length ? response.speechSegments : response.answer,
      );
    }
    return response;
  }

  function liveStatus(message, state = "") {
    const status = $("#lessonAiLiveStatus");
    if (status) {
      status.textContent = message;
      status.dataset.state = state;
    }
  }

  function stopLive(message = "Đã dừng trò chuyện trực tiếp.") {
    liveConversation = false;
    liveBusy = false;
    liveRecognition?.abort?.();
    liveRecognition = null;
    window.speechSynthesis?.cancel?.();
    $("#lessonAiLive")?.classList.remove("hidden");
    $("#lessonAiLiveStop")?.classList.add("hidden");
    liveStatus(message, "stopped");
  }

  function listenAgain() {
    if (!liveConversation || liveBusy) return;
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      stopLive("Máy này chưa hỗ trợ trò chuyện bằng micro. Con có thể gõ câu trả lời.");
      return;
    }
    liveRecognition?.abort?.();
    const recognition = new Recognition();
    liveRecognition = recognition;
    recognition.lang = window.MILO_AI_LANGUAGE?.recognitionLocale?.(
      $("#lessonAiLiveLanguage")?.value || "auto",
      location.hash.slice(1) || "conversation",
    ) || "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onstart = () => liveStatus("Milo đang nghe…", "listening");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      window.MILO_AI_LANGUAGE?.remember?.(transcript);
      liveBusy = true;
      liveStatus(`Con: “${transcript}” · Milo đang suy nghĩ…`, "thinking");
      ask(transcript, { conversationMode: "voice" })
        .then((response) => {
          liveBusy = false;
          if (response?.mode === "locked") {
            stopLive("Cần kích hoạt gói Trợ lý AI để tiếp tục trò chuyện.");
            return;
          }
          liveStatus("Milo đã trả lời. Đang nghe lượt tiếp theo…", "speaking");
          setTimeout(listenAgain, 180);
        })
        .catch(() => {
          liveBusy = false;
          liveStatus("Milo chưa xử lý được. Con hãy nói lại.", "error");
          setTimeout(listenAgain, 500);
        });
    };
    recognition.onerror = (event) => {
      if (!liveConversation) return;
      liveStatus(
        event.error === "not-allowed"
          ? "Hãy cấp quyền micro cho trình duyệt."
          : "Milo chưa nghe rõ. Con nói lại nhé.",
        "error",
      );
    };
    recognition.onend = () => {
      if (liveConversation && !liveBusy) setTimeout(listenAgain, 350);
    };
    try {
      recognition.start();
    } catch {
      setTimeout(listenAgain, 450);
    }
  }

  function startLive() {
    if (!window.MILO_TUTOR.hasActiveAiAccess()) {
      liveStatus("Hãy đăng nhập để dùng AI Plus miễn phí.", "locked");
      answer.classList.remove("hidden");
      answer.innerHTML =
        'AI Plus miễn phí có trò chuyện trực tiếp và luyện phát âm. <a class="ai-unlock-cta" href="index.html?ai=1">Đăng nhập tài khoản</a>';
      return;
    }
    liveConversation = true;
    $("#lessonAiLive")?.classList.add("hidden");
    $("#lessonAiLiveStop")?.classList.remove("hidden");
    listenAgain();
  }

  toggle?.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    toggle.setAttribute(
      "aria-expanded",
      String(!panel.classList.contains("hidden")),
    );
    if (!panel.classList.contains("hidden")) input?.focus();
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = "";
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest?.("#lessonAiLive")) startLive();
    if (event.target.closest?.("#lessonAiLiveStop")) stopLive();
  });

  document.querySelectorAll("[data-lesson-help]").forEach((button) => {
    button.addEventListener("click", () => ask(button.dataset.lessonHelp));
  });

  if (document.body.classList.contains("micro-focus-mode") && panel) {
    panel.classList.remove("hidden");
    toggle?.setAttribute("aria-expanded", "true");
  }

  if (typeof window.MILO_PET_VOICE !== "undefined") {
    $("#miloRead")?.addEventListener(
      "click",
      (event) => {
        event.stopImmediatePropagation();
        window.MILO_PET_VOICE.speak($("#miloMessage").textContent);
      },
      true,
    );
  }
})();
