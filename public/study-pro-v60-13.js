// Nhịp học ngắn mỗi ngày; chỉ tính thời gian khi trẻ đang hoạt động.
(function () {
  "use strict";

  const DURATION_KEY = "milo-study-duration-v1";
  const SESSION_PREFIX = "milo-study-session-v1";
  const PROFILE_KEY = "milo-child-profile-v1";
  const TOKEN_KEY = "milo-commerce-token-v1";
  const LAST_NICKNAME_KEY = "milo-last-nickname-v1";
  const IDLE_LIMIT_MS = 60_000;
  const SAVE_INTERVAL_SECONDS = 10;
  const ALLOWED_DURATIONS = [10, 15, 20];
  const PLANS = Object.freeze({
    10: [1, 2, 1, 1, 1, 2, 1, 1],
    15: [2, 3, 3, 1, 2, 2, 1, 1],
    20: [3, 4, 4, 1, 3, 2, 2, 1],
  });
  const STAGES = Object.freeze([
    {
      icon: "📖",
      title: "Ôn bài hôm qua",
      bubble: "Mình ôn nhanh những từ đã học nhé!",
    },
    {
      icon: "Aa",
      title: "Khám phá từ mới",
      bubble: "Nhìn hình, nghe từ rồi nói cùng mình!",
    },
    {
      icon: "🎤",
      title: "Luyện phát âm",
      bubble: "Nói rõ từng từ, Milo sẽ giúp con sửa.",
    },
    {
      icon: "☕",
      title: "Nghỉ và vận động",
      bubble: "Con đứng lên, uống nước và nhìn xa nhé!",
    },
    {
      icon: "💬",
      title: "Mẫu câu trong tình huống",
      bubble: "Ghép từ mới vào câu hoàn chỉnh nào!",
    },
    {
      icon: "👥",
      title: "Trò chuyện cùng Milo",
      bubble: "Con hãy dùng câu vừa học để trả lời nhé!",
    },
    {
      icon: "🎮",
      title: "Game kiểm tra phản xạ",
      bubble: "Vượt thử thách để mở rương nào!",
    },
    {
      icon: "🎁",
      title: "Nhận thưởng cuối buổi",
      bubble: "Sắp mở được Rương Ánh Sáng rồi!",
    },
  ]);

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const readJson = (key, fallback = null) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function profile() {
    return readJson(PROFILE_KEY, {});
  }

  function nickname() {
    return (
      String(profile()?.nickname || "").trim().toLowerCase() ||
      String(localStorage.getItem(LAST_NICKNAME_KEY) || "").trim().toLowerCase() ||
      "guest"
    );
  }

  function sessionKey(dateKey = localDateKey()) {
    return `${SESSION_PREFIX}:${nickname()}:${dateKey}`;
  }

  function normalizedDuration(value) {
    const duration = Number(value);
    return ALLOWED_DURATIONS.includes(duration) ? duration : 15;
  }

  function duration() {
    return normalizedDuration(localStorage.getItem(DURATION_KEY));
  }

  function loadSession() {
    const currentDuration = duration();
    const saved = readJson(sessionKey(), {});
    return {
      dateKey: localDateKey(),
      duration: currentDuration,
      seconds: Math.max(0, Number(saved?.seconds) || 0),
      completedRecorded: Boolean(saved?.completedRecorded),
      lastSavedSecond: -1,
    };
  }

  let session = loadSession();
  let lastInteraction = Date.now();
  let lastRenderedStage = -1;
  let parentAuthorizedUntil = 0;

  function plan() {
    return PLANS[session.duration] || PLANS[15];
  }

  function totalSeconds() {
    return session.duration * 60;
  }

  function stageStartSeconds(index) {
    return plan()
      .slice(0, index)
      .reduce((total, minutes) => total + minutes * 60, 0);
  }

  function stageEndSeconds(index) {
    return stageStartSeconds(index) + (plan()[index] || 0) * 60;
  }

  function activeStage() {
    if (session.seconds >= totalSeconds()) return STAGES.length - 1;
    for (let index = 0; index < plan().length; index += 1) {
      if (session.seconds < stageEndSeconds(index)) return index;
    }
    return STAGES.length - 1;
  }

  function completedStages() {
    if (session.seconds >= totalSeconds()) return STAGES.length;
    return plan().filter((_, index) => session.seconds >= stageEndSeconds(index))
      .length;
  }

  function saveSession(force = false) {
    const wholeSecond = Math.floor(session.seconds);
    if (
      !force &&
      wholeSecond - session.lastSavedSecond < SAVE_INTERVAL_SECONDS
    ) {
      return;
    }
    session.lastSavedSecond = wholeSecond;
    localStorage.setItem(
      sessionKey(session.dateKey),
      JSON.stringify({
        seconds: wholeSecond,
        duration: session.duration,
        completedRecorded: session.completedRecorded,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  function speak(text) {
    if (!text) return;
    if (window.MILO_PET_VOICE?.speak) {
      window.MILO_PET_VOICE.speak(text, 0.76);
      return;
    }
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.74;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

  function context() {
    const grade = Number(
      $("#gradeSelect")?.value || localStorage.getItem("milo-grade") || 3,
    );
    const gradeData = window.MILO_CURRICULUM?.[grade];
    const unitIndex = Math.max(
      0,
      Math.min(
        Number(localStorage.getItem(`milo-unit-${grade}`) || 0),
        (gradeData?.units?.length || 1) - 1,
      ),
    );
    return {
      grade,
      unitIndex,
      unit: gradeData?.units?.[unitIndex] || {},
    };
  }

  function renderPathDurations() {
    $$(".study-path-item").forEach((item, index) => {
      const minutes = plan()[index];
      const label = item.querySelector("small");
      if (label) label.textContent = `${minutes} phút`;
    });
  }

  function renderHeader() {
    const child = profile();
    const displayName = String(child?.name || child?.displayName || "").trim();
    if ($("#studyGreeting")) {
      $("#studyGreeting").textContent = displayName
        ? `${displayName}, sẵn sàng học cùng Milo!`
        : "Sẵn sàng học cùng Milo!";
    }
    if ($("#studyDurationTop")) {
      $("#studyDurationTop").textContent = `${session.duration} phút`;
    }
    if ($("#studyTopStars") && $("#stars")) {
      $("#studyTopStars").textContent = $("#stars").textContent;
    }
  }

  function renderProgress() {
    const elapsed = Math.min(session.seconds, totalSeconds());
    const doneMinutes = Math.floor(elapsed / 60);
    const remainingMinutes = Math.max(
      0,
      Math.ceil((totalSeconds() - elapsed) / 60),
    );
    const progress = Math.min(1, elapsed / Math.max(totalSeconds(), 1));
    const done = completedStages();
    if ($("#studyMinutesDone")) {
      $("#studyMinutesDone").textContent =
        `${doneMinutes}/${session.duration}`;
    }
    if ($("#studyMinutesLeft")) {
      $("#studyMinutesLeft").textContent = `${remainingMinutes} phút`;
    }
    if ($("#studyStagesDone")) {
      $("#studyStagesDone").textContent = `${done}/8 chặng`;
    }
    $("#studyProgressRing")?.style.setProperty(
      "--study-progress",
      `${progress * 360}deg`,
    );

    const stage = activeStage();
    $$(".study-path-item").forEach((item, index) => {
      item.classList.toggle("active", index === stage);
      item.classList.toggle("done", index < done);
      item.disabled = index !== stage;
      item.setAttribute(
        "aria-label",
        index > stage
          ? `${STAGES[index].title} — chưa mở`
          : `${STAGES[index].title} — đang học`,
      );
    });

    if (lastRenderedStage !== stage) {
      lastRenderedStage = stage;
      renderStage(stage);
    } else if (stage === 3 || stage === 7) {
      renderSpecialStage(stage);
    }
  }

  function showCore(show) {
    $("#quickStageCore")?.classList.toggle("hidden", !show);
    $("#studySpecialStage")?.classList.toggle("hidden", show);
    $("#quickNext")?.classList.toggle("hidden", !show);
  }

  function renderStage(index) {
    const stage = STAGES[index];
    if ($("#studyStageIcon")) $("#studyStageIcon").textContent = stage.icon;
    if ($("#studyStageKicker")) {
      $("#studyStageKicker").textContent = `CHẶNG ${index + 1}/8`;
    }
    if ($("#studyStageTitle")) $("#studyStageTitle").textContent = stage.title;
    if ($("#studyMiloBubble")) $("#studyMiloBubble").textContent = stage.bubble;
    if (index <= 1) {
      showCore(true);
      return;
    }
    showCore(false);
    renderSpecialStage(index);
  }

  function configureSpecial({ visual, title, text, content, action, disabled }) {
    if ($("#studySpecialVisual")) $("#studySpecialVisual").textContent = visual;
    if ($("#studySpecialTitle")) $("#studySpecialTitle").textContent = title;
    if ($("#studySpecialText")) $("#studySpecialText").textContent = text;
    if ($("#studySpecialContent")) {
      $("#studySpecialContent").textContent = content || "";
    }
    const button = $("#studySpecialAction");
    if (button) {
      button.textContent = action;
      button.disabled = Boolean(disabled);
      button.onclick = null;
    }
    return button;
  }

  function renderSpecialStage(index) {
    const current = context();
    const words = current.unit?.words || [];
    const patterns = current.unit?.pattern || [];
    const word = words[0]?.[0] || "Hello";
    const remainingStageSeconds = Math.max(
      0,
      Math.ceil(stageEndSeconds(index) - session.seconds),
    );
    const remainingStageMinutes = Math.floor(remainingStageSeconds / 60);
    const remainingStagePart = remainingStageSeconds % 60;

    if (index === 2) {
      const button = configureSpecial({
        visual: "🎤",
        title: `Nói rõ từ “${word}”`,
        text: "Nghe mẫu, nói lại và luyện đến khi Milo xác nhận con đã tiến bộ.",
        content: "Mỗi lần luyện đúng sẽ được cộng vào báo cáo phát âm.",
        action: "🎯 Bắt đầu luyện phát âm",
      });
      if (button) {
        button.onclick = () => {
          if (window.MILO_PRONUNCIATION_COACH?.open) {
            window.MILO_PRONUNCIATION_COACH.open(word);
          } else {
            speak(word);
          }
        };
      }
      return;
    }

    if (index === 3) {
      const button = configureSpecial({
        visual: "🌿",
        title: "Nghỉ mắt và vận động",
        text: "Đứng lên, uống nước và nhìn một vật ở xa. Khi con sẵn sàng, mình học tiếp nhé.",
        content:
          `Còn ${String(remainingStageMinutes).padStart(2, "0")}:${String(
            remainingStagePart,
          ).padStart(2, "0")} phút nghỉ gợi ý`,
        action: "Con đã nghỉ xong →",
      });
      if (button) {
        button.onclick = () => {
          session.seconds = Math.max(session.seconds, stageEndSeconds(index));
          lastInteraction = Date.now();
          saveSession(true);
          renderAll();
        };
      }
      return;
    }

    if (index === 4) {
      const sample = patterns.filter(Boolean).join("  •  ") ||
        "Hello! How are you?  •  I am great!";
      const button = configureSpecial({
        visual: "💬",
        title: "Nghe và dùng mẫu câu",
        text: "Milo đọc mẫu, sau đó con thay từ mới vào câu để nói.",
        content: sample,
        action: "🔊 Nghe mẫu câu",
      });
      if (button) button.onclick = () => patterns.filter(Boolean).forEach(speak);
      return;
    }

    if (index === 5) {
      const button = configureSpecial({
        visual: "👥",
        title: "Trò chuyện cùng Milo",
        text: "Dùng từ và mẫu câu vừa học để trả lời bằng tiếng Anh.",
        content: patterns[0] || `Can you say “${word}” in a sentence?`,
        action: "💬 Mở phòng trò chuyện",
      });
      if (button) {
        button.onclick = () => {
          if (typeof window.setView === "function") window.setView("chat");
        };
      }
      return;
    }

    if (index === 6) {
      const button = configureSpecial({
        visual: "🎮",
        title: "Đại thử thách cuối buổi",
        text: "Game kiểm tra nghe, từ vựng, mẫu câu và phản xạ của con.",
        content: "Cần đạt tối thiểu 80% để hoàn thành thử thách.",
        action: "🎮 Bắt đầu game kiểm tra",
      });
      if (button) {
        button.onclick = () => {
          if (typeof window.setView === "function") window.setView("test");
          setTimeout(() => $("#startQuiz")?.click(), 0);
        };
      }
      return;
    }

    const complete = session.seconds >= totalSeconds();
    const button = configureSpecial({
      visual: complete ? "🎉" : "🎁",
      title: complete ? "Con đã hoàn thành buổi học!" : "Sắp mở Rương Ánh Sáng",
      text: complete
        ? "Milo đã lưu tiến bộ hôm nay. Con có thể nhận sao và xem thành tích."
        : "Hoàn thành đủ thời lượng để nhận phần thưởng cuối buổi.",
      content: complete
        ? "✓ Đủ 8/8 chặng"
        : `Còn ${Math.max(0, Math.ceil((totalSeconds() - session.seconds) / 60))} phút`,
      action: complete ? "🏆 Nhận thưởng ngay" : "Chưa đủ thời lượng",
      disabled: !complete,
    });
    if (button && complete) {
      button.onclick = () => {
        if (typeof window.setView === "function") window.setView("badges");
      };
    }
  }

  function currentViewName() {
    return $(".view:not(.hidden)")?.id?.replace(/^view-/, "") || "quick";
  }

  function shouldCountTime() {
    if (document.hidden) return false;
    if (!$("#studySettingsModal")?.classList.contains("hidden")) return false;
    if (["parent", "assistants", "home"].includes(currentViewName())) return false;
    if (activeStage() === 3) return true;
    return Date.now() - lastInteraction <= IDLE_LIMIT_MS;
  }

  function renderActivityState(counting) {
    const notice = $("#studyIdleNotice");
    if (!notice) return;
    notice.classList.toggle("paused", !counting);
    notice.textContent = counting
      ? activeStage() === 3
        ? "Đang tính thời gian nghỉ gợi ý"
        : "Đang tính thời gian học"
      : "Đã tạm dừng vì bé không thao tác";
  }

  function recordCompletionOnce() {
    if (session.completedRecorded || session.seconds < totalSeconds()) return;
    session.completedRecorded = true;
    const detail = {
      type: "lesson",
      skill: "daily-plan",
      score: 100,
      durationMinutes: session.duration,
      source: "daily-learning-rhythm",
      completedStages: 8,
    };
    if (window.MILO_LEARNING?.record) {
      window.MILO_LEARNING.record(detail);
    } else {
      window.dispatchEvent(new CustomEvent("milo:learning-event", { detail }));
    }
    saveSession(true);
    speak("Amazing! You completed today's learning adventure!");
  }

  function checkNewDay() {
    const today = localDateKey();
    if (session.dateKey === today) return;
    saveSession(true);
    session = loadSession();
    lastRenderedStage = -1;
    renderAll();
  }

  function tick() {
    checkNewDay();
    const counting = shouldCountTime();
    if (counting && session.seconds < totalSeconds()) {
      session.seconds += 1;
      saveSession();
    }
    renderActivityState(counting);
    renderProgress();
    recordCompletionOnce();
  }

  function openSettings() {
    const modal = $("#studySettingsModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    const option = $(
      `input[name="studyDuration"][value="${session.duration}"]`,
    );
    if (option) option.checked = true;
    if ($("#studyParentPin")) {
      $("#studyParentPin").value = "";
      setTimeout(() => $("#studyParentPin")?.focus(), 30);
    }
    if ($("#studySettingsError")) $("#studySettingsError").textContent = "";
  }

  function closeSettings() {
    $("#studySettingsModal")?.classList.add("hidden");
    if ($("#studyParentPin")) $("#studyParentPin").value = "";
  }

  async function verifyParentAndSave(event) {
    event.preventDefault();
    const error = $("#studySettingsError");
    const pin = String($("#studyParentPin")?.value || "");
    const selected = normalizedDuration(
      $('input[name="studyDuration"]:checked')?.value,
    );
    const childNickname = nickname();
    if (childNickname === "guest") {
      if (error) {
        error.textContent =
          "Hãy đăng nhập tài khoản học viên trước khi lưu nhịp học.";
      }
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      if (error) error.textContent = "PIN phụ huynh phải có đúng 6 chữ số.";
      return;
    }
    const submit = event.currentTarget.querySelector(
      ".study-settings-save",
    );
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Đang kiểm tra PIN…";
    }
    if (error) error.textContent = "";
    try {
      const response = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ nickname: childNickname, pin }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "PIN phụ huynh không đúng.");
      }
      if (payload.token) localStorage.setItem(TOKEN_KEY, payload.token);
      localStorage.setItem(DURATION_KEY, String(selected));
      session.duration = selected;
      parentAuthorizedUntil = Date.now() + 5 * 60_000;
      renderAll();
      saveSession(true);
      closeSettings();
      if (typeof window.showToast === "function") {
        window.showToast(`Đã lưu nhịp học ${selected} phút mỗi ngày`);
      }
    } catch (reason) {
      if (error) error.textContent = reason.message;
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Lưu nhịp học";
      }
    }
  }

  function openParentCenter() {
    if (Date.now() > parentAuthorizedUntil) {
      const error = $("#studySettingsError");
      if (error) {
        error.textContent =
          "Nhập đúng PIN và bấm “Lưu nhịp học” trước khi xem báo cáo.";
      }
      return;
    }
    closeSettings();
    if (typeof window.setView === "function") window.setView("parent");
  }

  function syncPet() {
    const hero = $("#heroMiloImage");
    const study = $("#studyMiloImage");
    if (hero?.src && study) study.src = hero.src;
    if ($("#heroPetName") && $("#studyPetName")) {
      $("#studyPetName").textContent = $("#heroPetName").textContent || "Milo";
    }
  }

  function renderAll() {
    session.duration = duration();
    renderPathDurations();
    renderHeader();
    renderProgress();
    syncPet();
  }

  function bind() {
    ["pointerdown", "keydown", "input", "touchstart"].forEach((name) => {
      document.addEventListener(
        name,
        () => {
          lastInteraction = Date.now();
        },
        { passive: true },
      );
    });
    $("#studyDurationButton")?.addEventListener("click", openSettings);
    $("#closeStudySettings")?.addEventListener("click", closeSettings);
    $("#studySettingsForm")?.addEventListener("submit", verifyParentAndSave);
    $("#openParentCenter")?.addEventListener("click", openParentCenter);
    $("#studySettingsModal")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeSettings();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSettings();
    });
    $("#gradeSelect")?.addEventListener("change", () => {
      setTimeout(() => {
        lastRenderedStage = -1;
        renderAll();
      }, 0);
    });
    const hero = $("#heroMiloImage");
    if (hero && window.MutationObserver) {
      new MutationObserver(syncPet).observe(hero, {
        attributes: true,
        attributeFilter: ["src"],
      });
    }
    const stars = $("#stars");
    if (stars && window.MutationObserver) {
      new MutationObserver(renderHeader).observe(stars, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
    window.addEventListener("beforeunload", () => saveSession(true));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) saveSession(true);
      else lastInteraction = Date.now();
    });
    renderAll();
    setInterval(tick, 1000);
  }

  window.MILO_STUDY_SESSION = Object.freeze({
    snapshot: () => ({
      date: session.dateKey,
      duration: session.duration,
      elapsedSeconds: Math.floor(session.seconds),
      activeStage: activeStage() + 1,
      completedStages: completedStages(),
    }),
    openParentSettings: openSettings,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
