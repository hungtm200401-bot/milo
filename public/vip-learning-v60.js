(function () {
  const ACCESS_KEY = "milo-commerce-access-v1";
  const PROFILE_KEY = "milo-child-profile-v1";
  const TOKEN_KEY = "milo-commerce-token-v1";
  const MAX_LOCAL_EVENTS = 500;
  let remoteProfile = null;
  let dailyBusy = false;

  const assistantCatalog = [
    {
      id: "general",
      icon: "✨",
      name: "Gia sư tổng hợp",
      copy: "Hỏi bài và được hướng dẫn đúng trọng tâm.",
      vip: false,
    },
    {
      id: "pronunciation",
      icon: "🎯",
      name: "Phát âm chuyên sâu",
      copy: "Sửa âm, khẩu hình, nhịp và lỗi lặp lại.",
      vip: true,
    },
    {
      id: "conversation",
      icon: "💬",
      name: "Phản xạ hội thoại",
      copy: "Dẫn dắt con nói tiếp theo tình huống.",
      vip: true,
    },
    {
      id: "vocabulary",
      icon: "📚",
      name: "Gia sư từ vựng",
      copy: "Học nghĩa, cụm từ và cách nhớ lâu.",
      vip: true,
    },
    {
      id: "grammar",
      icon: "🧠",
      name: "Gia sư ngữ pháp",
      copy: "Sửa cấu trúc và lỗi dễ nhầm theo lớp.",
      vip: true,
    },
    {
      id: "writing",
      icon: "✍️",
      name: "Gia sư viết",
      copy: "Chữa câu, giải thích và cho con viết lại.",
      vip: true,
    },
    {
      id: "listening",
      icon: "🎧",
      name: "Huấn luyện nghe",
      copy: "Chia cụm, tìm từ khóa và tăng tốc dần.",
      vip: true,
    },
    {
      id: "test",
      icon: "📝",
      name: "Bài tập & kiểm tra",
      copy: "Chỉ từ khóa, lý do và cách tự kiểm tra.",
      vip: true,
    },
    {
      id: "pathway",
      icon: "📈",
      name: "Cố vấn lộ trình",
      copy: "Chọn mục tiêu tiếp theo từ điểm yếu của con.",
      vip: true,
    },
  ];

  const dailySteps = [
    {
      id: "review",
      icon: "🔁",
      title: "Khởi động và ôn bài cũ",
      time: "2 phút",
      assistant: "pathway",
      prompt: ({ unit }) =>
        `Bắt đầu buổi học hôm nay. Hãy ôn thật ngắn một kiến thức quan trọng của ${unit.title}, sau đó hỏi con đúng một câu kiểm tra dễ.`,
    },
    {
      id: "pronunciation",
      icon: "🎯",
      title: "Sửa một câu phát âm",
      time: "2 phút",
      assistant: "pronunciation",
    },
    {
      id: "vocabulary",
      icon: "📚",
      title: "Nhớ từ trong ngữ cảnh",
      time: "2 phút",
      assistant: "vocabulary",
      prompt: ({ unit }) =>
        `Dạy con hai từ quan trọng trong ${unit.title}. Dùng một cách nhớ dễ hiểu, một cụm từ tự nhiên và cho con đặt một câu rất ngắn.`,
    },
    {
      id: "grammar",
      icon: "🧠",
      title: "Dùng đúng mẫu câu",
      time: "2 phút",
      assistant: "grammar",
      prompt: ({ unit }) =>
        `Dạy lại mẫu câu “${unit.pattern?.[0] || ""} ${unit.pattern?.[1] || ""}”. Chỉ nêu một quy tắc ngắn, một lỗi dễ nhầm và một câu cho con tự điền.`,
    },
    {
      id: "conversation",
      icon: "💬",
      title: "Luyện phản xạ hội thoại",
      time: "2 phút",
      assistant: "conversation",
      prompt: ({ unit }) =>
        `Tạo một lượt hội thoại ngắn theo chủ đề ${unit.title}. Hãy nói tự nhiên như đang ngồi cạnh con, rồi hỏi đúng một câu để con trả lời thành tiếng.`,
    },
    {
      id: "check",
      icon: "✅",
      title: "Kiểm tra và chốt mục tiêu",
      time: "2 phút",
      assistant: "test",
      prompt: ({ unit }) =>
        `Kết thúc buổi học bằng ba câu kiểm tra cực ngắn về ${unit.title}: một từ vựng, một mẫu câu và một câu giao tiếp. Chưa đưa đáp án cho đến khi con trả lời.`,
    },
  ];

  const skillLabels = {
    translation: "Dịch đúng ý",
    vocabulary: "Từ vựng",
    word: "Nhớ từ",
    spelling: "Chính tả",
    listening: "Nghe",
    speaking: "Nói",
    conversation: "Phản xạ hội thoại",
    pronunciation: "Phát âm",
    grammar: "Ngữ pháp",
    reading: "Đọc hiểu",
    writing: "Viết",
    test: "Bài kiểm tra",
    unit: "Kiến thức Unit",
    general: "Kỹ năng tổng hợp",
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

  function childProfile() {
    return readJson(PROFILE_KEY, {});
  }

  function isVip() {
    const current = access();
    if (
      current?.activeUntil &&
      new Date(current.activeUntil).getTime() <= Date.now()
    ) {
      return false;
    }
    return ["vip-pro-max", "vip-pro-max-trial"].includes(current?.accessLevel);
  }

  function localEventKey() {
    return `milo-learning-events-v60-${childProfile()?.nickname || "guest"}`;
  }

  function localEvents() {
    const events = readJson(localEventKey(), []);
    return Array.isArray(events) ? events : [];
  }

  function saveLocalEvents(events) {
    localStorage.setItem(
      localEventKey(),
      JSON.stringify(events.slice(-MAX_LOCAL_EVENTS)),
    );
  }

  function eventId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeEvent(input = {}) {
    const score = Number(input.score);
    return {
      clientEventId: String(input.clientEventId || eventId()).slice(0, 80),
      id: String(input.clientEventId || input.id || "").slice(0, 80),
      type: String(input.type || "tutor").slice(0, 30),
      skill: String(input.skill || "general").slice(0, 30),
      score: Number.isFinite(score)
        ? Math.max(0, Math.min(100, Math.round(score)))
        : null,
      durationMinutes: Math.max(
        0,
        Math.min(30, Number(input.durationMinutes || 0)),
      ),
      target: String(input.target || "").slice(0, 240),
      assistantMode: String(input.assistantMode || "").slice(0, 40),
      issues: Array.isArray(input.issues)
        ? input.issues
            .slice(0, 12)
            .map((item) => String(item || "").slice(0, 120))
            .filter(Boolean)
        : [],
      metadata:
        input.metadata && typeof input.metadata === "object"
          ? { ...input.metadata }
          : {},
      createdAt: input.createdAt || new Date().toISOString(),
    };
  }

  function mergeEvents(left = [], right = []) {
    const merged = new Map();
    [...left, ...right].forEach((raw) => {
      const event = normalizeEvent(raw);
      const id = event.id || event.clientEventId;
      event.id = id;
      event.clientEventId = id;
      merged.set(id, event);
    });
    return [...merged.values()]
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      .slice(-MAX_LOCAL_EVENTS);
  }

  function localDayKey(value) {
    const date = new Date(value || "");
    if (!Number.isFinite(date.getTime())) return "";
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function summaryFrom(events = localEvents()) {
    const safeEvents = Array.isArray(events) ? events : [];
    const days = [
      ...new Set(
        safeEvents
          .map((event) => localDayKey(event.createdAt))
          .filter(Boolean),
      ),
    ].sort();
    const pronunciation = safeEvents.filter(
      (event) =>
        event.type === "pronunciation" && Number.isFinite(event.score),
    );
    const skillCounts = {};
    const issueCounts = {};
    safeEvents.forEach((event) => {
      const skill = event.skill || "general";
      skillCounts[skill] = Number(skillCounts[skill] || 0) + 1;
      (event.issues || []).forEach((issue) => {
        issueCounts[issue] = Number(issueCounts[issue] || 0) + 1;
      });
    });
    let streak = 0;
    const daySet = new Set(days);
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let index = 0; index < 366; index += 1) {
      const key = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0"),
      ].join("-");
      if (!daySet.has(key)) {
        if (index === 0) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      totalEvents: safeEvents.length,
      learningDays: days.length,
      streak,
      totalMinutes: Math.round(
        safeEvents.reduce(
          (total, event) => total + Number(event.durationMinutes || 0),
          0,
        ),
      ),
      pronunciationAttempts: pronunciation.length,
      averagePronunciation: pronunciation.length
        ? Math.round(
            pronunciation.reduce(
              (total, event) => total + Number(event.score || 0),
              0,
            ) / pronunciation.length,
          )
        : 0,
      bestPronunciation: pronunciation.length
        ? Math.max(
            ...pronunciation.map((event) => Number(event.score || 0)),
          )
        : 0,
      completedDailySessions: safeEvents.filter(
        (event) => event.type === "daily-session",
      ).length,
      skillCounts,
      repeatedIssues: Object.entries(issueCounts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([label, count]) => ({ label, count })),
      recentEvents: safeEvents.slice(-20).reverse(),
    };
  }

  async function record(input) {
    const event = normalizeEvent(input);
    event.id = event.clientEventId;
    const events = mergeEvents(localEvents(), [event]);
    saveLocalEvents(events);
    window.dispatchEvent(
      new CustomEvent("milo:learning-updated", {
        detail: { event, summary: summaryFrom(events) },
      }),
    );
    if (!isVip() || !localStorage.getItem(TOKEN_KEY) || !navigator.onLine) {
      return event;
    }
    try {
      const response = await fetch("/api/learning/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify(event),
      });
      const payload = await response.json();
      if (response.ok && payload?.profile) {
        remoteProfile = payload.profile;
        saveLocalEvents(mergeEvents(events, payload.profile.events || []));
      }
    } catch {
      // Bản ghi local vẫn được giữ và sẽ đồng bộ lại ở lần mở sau.
    }
    return event;
  }

  async function sync() {
    if (!isVip() || !localStorage.getItem(TOKEN_KEY) || !navigator.onLine) {
      return null;
    }
    try {
      const response = await fetch("/api/learning/profile", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.syncEnabled) return null;
      remoteProfile = payload.profile;
      const local = localEvents();
      const remote = payload.profile?.events || [];
      const remoteIds = new Set(
        remote.map((event) => event.id || event.clientEventId).filter(Boolean),
      );
      const pending = local
        .filter(
          (event) =>
            !remoteIds.has(event.id || event.clientEventId),
        )
        .slice(-200);
      if (pending.length) {
        const upload = await fetch("/api/learning/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          },
          body: JSON.stringify({ events: pending }),
        });
        const uploaded = await upload.json();
        if (upload.ok && uploaded?.profile) {
          remoteProfile = uploaded.profile;
        }
      }
      const merged = mergeEvents(
        local,
        remoteProfile?.events || remote,
      );
      saveLocalEvents(merged);
      window.dispatchEvent(
        new CustomEvent("milo:learning-updated", {
          detail: { synced: true, summary: summaryFrom(merged) },
        }),
      );
      return payload.profile;
    } catch {
      return null;
    }
  }

  function openUpgrade() {
    if (window.MILO_COMMERCE?.openAiPlans) {
      window.MILO_COMMERCE.openAiPlans();
      return;
    }
    document.querySelector("#premiumPaymentModal")?.classList.remove("hidden");
  }

  function showToastSafe(message) {
    if (typeof showToast === "function") showToast(message);
  }

  function openChatView() {
    updateChatAccessUi();
    if (typeof window.setView === "function") window.setView("chat");
  }

  function setPlusChat() {
    window.MILO_ACTIVE_ASSISTANT = "general";
    renderAssistants();
    updateChatAccessUi();
    openChatView();
  }

  function setProChat() {
    if (!isVip()) {
      openUpgrade();
      return;
    }
    const current = assistantCatalog.find(
      (item) => item.id === window.MILO_ACTIVE_ASSISTANT,
    );
    if (!current?.vip) window.MILO_ACTIVE_ASSISTANT = "conversation";
    renderAssistants();
    updateChatAccessUi();
    openChatView();
  }

  function updateChatAccessUi() {
    const active =
      assistantCatalog.find(
        (item) => item.id === (window.MILO_ACTIVE_ASSISTANT || "general"),
      ) || assistantCatalog[0];
    const proMode = Boolean(active.vip && isVip());
    if (active.vip && !isVip()) window.MILO_ACTIVE_ASSISTANT = "general";
    const badge = document.querySelector("#chatAccessBadge");
    const notice = document.querySelector("#chatModeNotice");
    if (badge) {
      badge.className = `chat-access-badge ${proMode ? "pro" : "plus"}`;
      badge.textContent = proMode
        ? `VIP PRO MAX · ${active.name}`
        : "AI PLUS MIỄN PHÍ";
    }
    if (notice) {
      notice.className = `chat-mode-notice ${proMode ? "pro" : "plus"}`;
      notice.innerHTML = proMode
        ? `<b>VIP PRO MAX · ${escapeHtml(active.name)}</b><span>Trò chuyện chuyên sâu, cá nhân hóa theo điểm yếu và ghi nhớ tiến bộ dài hạn của con.</span>`
        : "<b>AI Plus mặc định</b><span>Hỏi bài, dịch, sửa câu và luyện hội thoại cơ bản. Không dùng bộ nhớ học tập dài hạn.</span>";
    }
    const tutorMode = document.querySelector("#tutorMode");
    if (tutorMode) {
      tutorMode.dataset.mode = proMode ? "vip-pro-max" : "plus";
      tutorMode.textContent = proMode
        ? `● VIP PRO MAX · ${active.name}`
        : "● AI Plus mặc định";
    }
    const liveTitle = document.querySelector("#aiLiveTitle");
    const liveStatus = document.querySelector("#aiLiveStatus");
    if (liveTitle) {
      liveTitle.textContent = proMode
        ? `Trò chuyện VIP PRO MAX với ${active.name}`
        : "Trò chuyện cùng Milo";
    }
    if (liveStatus) {
      liveStatus.textContent = proMode
        ? "Phân tích chuyên sâu, cá nhân hóa và ghi nhớ tiến bộ dài hạn."
        : "Hỏi bài, luyện phản xạ và giao tiếp cơ bản trong lượt hiện tại.";
    }
  }

  function mountAssistantHub() {
    const mount = document.querySelector("#assistantHubMount");
    if (!mount || document.querySelector("#v60AssistantHub")) return;
    mount.insertAdjacentHTML(
      "beforeend",
      `<section class="v60-assistant-hub v60-tiered-assistant-hub" id="v60AssistantHub">
        <div class="v60-assistant-head">
          <div><small>CHỌN ĐÚNG CHẾ ĐỘ TRÒ CHUYỆN</small><h3>AI Plus và VIP PRO MAX được tách riêng</h3></div>
          <span>Không còn dùng chung một nút</span>
        </div>
        <div class="v60-assistant-tier-grid">
          <article class="v60-access-panel plus-panel">
            <header><div><small>MIỄN PHÍ</small><h4>AI Plus</h4></div><em>SẴN SÀNG</em></header>
            <p>Con có thể trò chuyện ngay sau khi đăng nhập.</p>
            <ul><li>Hỏi bài và giải thích ngắn gọn</li><li>Dịch, sửa câu và luyện giao tiếp</li><li>Sửa phát âm cơ bản trong lượt hiện tại</li><li>Không mở bộ nhớ dài hạn và trợ lý chuyên môn VIP</li></ul>
            <button class="v60-tier-chat plus" id="v60PlusChat" type="button">💬 Trò chuyện AI Plus →</button>
          </article>
          <article class="v60-access-panel pro-panel" id="v60ProPanel">
            <header><div><small>TRẢ PHÍ / DÙNG THỬ 24 GIỜ</small><h4>VIP PRO MAX</h4></div><em id="v60ProAccessBadge">ĐANG KIỂM TRA</em></header>
            <p>Trò chuyện chuyên sâu với 8 trợ lý chuyên môn và bộ nhớ học tập dài hạn.</p>
            <ul><li>Phát âm, hội thoại, từ vựng, ngữ pháp</li><li>Viết, nghe, kiểm tra và cố vấn lộ trình</li><li>Nhận ra lỗi lặp lại và cá nhân hóa cách dạy</li><li>Đồng bộ tiến bộ và báo cáo cho phụ huynh</li></ul>
            <button class="v60-assistant-toggle" id="v60AssistantToggle" type="button" aria-expanded="false">Chọn trợ lý VIP PRO MAX ↓</button>
            <div class="v60-assistant-grid is-collapsed" id="v60AssistantGrid"></div>
            <div class="v60-pro-active"><span>Đang chọn:</span><b id="v60AssistantActive">Phản xạ hội thoại</b></div>
            <button class="v60-tier-chat pro" id="v60ProChat" type="button">👑 Trò chuyện VIP PRO MAX →</button>
          </article>
        </div>
      </section>`,
    );
    const toggle = document.querySelector("#v60AssistantToggle");
    const grid = document.querySelector("#v60AssistantGrid");
    if (toggle && grid) {
      toggle.onclick = () => {
        if (!isVip()) {
          openUpgrade();
          return;
        }
        const collapsed = grid.classList.toggle("is-collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.textContent = collapsed
          ? "Chọn trợ lý VIP PRO MAX ↓"
          : "Thu gọn trợ lý ↑";
      };
    }
    document.querySelector("#v60PlusChat")?.addEventListener("click", setPlusChat);
    document.querySelector("#v60ProChat")?.addEventListener("click", setProChat);
    renderAssistants();
    updateChatAccessUi();
  }

  function renderAssistants() {
    const grid = document.querySelector("#v60AssistantGrid");
    if (!grid) return;
    const vip = isVip();
    const active = window.MILO_ACTIVE_ASSISTANT || "general";
    const proAssistants = assistantCatalog.filter((assistant) => assistant.vip);
    grid.innerHTML = proAssistants
      .map(
        (assistant) =>
          `<button type="button" class="v60-assistant ${!vip ? "locked" : ""} ${active === assistant.id ? "selected" : ""}" data-v60-assistant="${assistant.id}">
            <span>${assistant.icon}</span><b>${assistant.name}</b><small>${assistant.copy}</small><em>PRO</em>
          </button>`,
      )
      .join("");
    const proPanel = document.querySelector("#v60ProPanel");
    const proBadge = document.querySelector("#v60ProAccessBadge");
    const proButton = document.querySelector("#v60ProChat");
    const toggle = document.querySelector("#v60AssistantToggle");
    proPanel?.classList.toggle("locked", !vip);
    if (proBadge) {
      proBadge.textContent = vip ? "ĐÃ MỞ" : "ĐANG KHÓA";
      proBadge.dataset.state = vip ? "active" : "locked";
    }
    if (proButton) {
      proButton.textContent = vip
        ? "👑 Trò chuyện VIP PRO MAX →"
        : "🎁 Mở thử VIP PRO MAX 24 giờ";
    }
    if (toggle) {
      toggle.textContent = vip
        ? "Chọn trợ lý VIP PRO MAX ↓"
        : "🔒 Xem 8 trợ lý VIP PRO MAX";
    }
    const activeAssistant =
      proAssistants.find((assistant) => assistant.id === active) ||
      proAssistants.find((assistant) => assistant.id === "conversation") ||
      proAssistants[0];
    const activeLabel = document.querySelector("#v60AssistantActive");
    if (activeLabel) activeLabel.textContent = activeAssistant?.name || "Phản xạ hội thoại";
    grid.querySelectorAll("[data-v60-assistant]").forEach((button) => {
      button.onclick = () => selectAssistant(button.dataset.v60Assistant);
    });
    updateChatAccessUi();
  }

  function selectAssistant(id) {
    const assistant =
      assistantCatalog.find((item) => item.id === id) || assistantCatalog[0];
    if (assistant.vip && !isVip()) {
      showToastSafe(
        `${assistant.name} thuộc VIP PRO MAX. Anh/chị có thể mở thử toàn bộ trong 24 giờ.`,
      );
      openUpgrade();
      return;
    }
    window.MILO_ACTIVE_ASSISTANT = assistant.id;
    document.querySelectorAll("[data-v60-assistant]").forEach((button) => {
      button.classList.toggle(
        "selected",
        button.dataset.v60Assistant === assistant.id,
      );
    });
    const activeLabel = document.querySelector("#v60AssistantActive");
    if (activeLabel) activeLabel.textContent = assistant.name;
    const input = document.querySelector("#chatText");
    if (input) {
      input.placeholder = `Hỏi ${assistant.name.toLowerCase()} về phần con đang cần…`;
    }
    if (assistant.id === "pronunciation") {
      window.MILO_PRONUNCIATION_COACH?.open?.();
    }
    updateChatAccessUi();
    showToastSafe(`Đã chọn ${assistant.name} của VIP PRO MAX.`);
  }

  function lessonContext() {
    const grade = Number(
      document.querySelector("#gradeSelect")?.value ||
        localStorage.getItem("milo-grade") ||
        3,
    );
    const gradeData = window.MILO_CURRICULUM?.[grade];
    const unitIndex = Math.max(
      0,
      Number(localStorage.getItem(`milo-unit-${grade}`) || 0),
    );
    const unit = gradeData?.units?.[unitIndex] || gradeData?.units?.[0] || {
      title: "Unit đang học",
      pattern: ["Hello!", "Hello, my friend."],
      words: [],
    };
    const petName =
      document.querySelector("#petStatusName")?.textContent?.trim() || "Milo";
    return { grade, gradeData, unitIndex, unit, petName };
  }

  function dateKey() {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function dailyKey() {
    const context = lessonContext();
    return `milo-guided-daily-v60-${childProfile()?.nickname || "guest"}-${dateKey()}-${context.grade}`;
  }

  function dailyState() {
    const saved = readJson(dailyKey(), {});
    return {
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      active: Math.max(0, Math.min(dailySteps.length - 1, Number(saved.active || 0))),
      finishedAt: saved.finishedAt || null,
    };
  }

  function saveDailyState(value) {
    localStorage.setItem(dailyKey(), JSON.stringify(value));
  }

  function renderDaily() {
    const list = document.querySelector("#dailyStepList");
    if (!list) return;
    const state = dailyState();
    list.innerHTML = dailySteps
      .map((step, index) => {
        const done = state.completed.includes(step.id);
        const active = !state.finishedAt && index === state.active;
        return `<article class="v60-step ${done ? "done" : ""} ${active ? "active" : ""}">
          <span>${step.icon}</span><div><b>${index + 1}. ${step.title}</b><small>${step.time}</small></div><em>${done ? "✓ Xong" : active ? "Đang chờ" : "Tiếp theo"}</em>
        </article>`;
      })
      .join("");
    const badge = document.querySelector("#dailyAccessBadge");
    const lock = document.querySelector("#dailyVipLock");
    const primary = document.querySelector("#dailyPrimary");
    const complete = document.querySelector("#dailyComplete");
    if (badge) {
      badge.textContent = isVip()
        ? "VIP PRO MAX · Cá nhân hóa theo điểm yếu"
        : "Xem trước · Mở bằng VIP PRO MAX";
    }
    lock?.classList.toggle("hidden", isVip());
    if (state.finishedAt) {
      document.querySelector("#dailyCoachIcon").textContent = "🏆";
      document.querySelector("#dailyCoachStage").textContent =
        "HOÀN THÀNH HÔM NAY";
      document.querySelector("#dailyCoachTitle").textContent =
        "Con đã hoàn thành đủ 6 bước";
      document.querySelector("#dailyCoachOutput").textContent =
        "Milo đã ghi nhận buổi học. Phụ huynh có thể mở Trung tâm phụ huynh để xem nhịp học, phát âm và điểm cần tập trung.";
      primary.textContent = "Xem báo cáo phụ huynh";
      primary.classList.remove("hidden");
      complete.classList.add("hidden");
      return;
    }
    primary.textContent =
      state.completed.length > 0 ? "Tiếp tục buổi học" : "Bắt đầu buổi học";
    primary.classList.remove("hidden");
    complete.classList.add("hidden");
  }

  async function runDailyStep(index) {
    if (!isVip()) {
      openUpgrade();
      return;
    }
    if (dailyBusy) return;
    const step = dailySteps[index];
    if (!step) return;
    const context = lessonContext();
    const state = dailyState();
    state.active = index;
    saveDailyState(state);
    renderDaily();
    const output = document.querySelector("#dailyCoachOutput");
    const primary = document.querySelector("#dailyPrimary");
    const complete = document.querySelector("#dailyComplete");
    const pronunciationAction = document.querySelector(
      "#dailyPronunciationAction",
    );
    document.querySelector("#dailyCoachIcon").textContent = step.icon;
    document.querySelector("#dailyCoachStage").textContent =
      `BƯỚC ${index + 1}/${dailySteps.length} · ${step.time.toUpperCase()}`;
    document.querySelector("#dailyCoachTitle").textContent = step.title;
    primary.classList.add("hidden");
    pronunciationAction.classList.add("hidden");
    complete.classList.add("hidden");
    if (step.id === "pronunciation") {
      const target =
        context.unit?.pattern?.[1] ||
        context.unit?.words?.[0]?.[0] ||
        "Hello, my friend.";
      output.textContent = `Câu luyện hôm nay:\n“${target}”\n\nCon hãy nghe mẫu, phát âm, xem từ nào chưa rõ rồi luyện lại ít nhất một lần. Milo sẽ lưu điểm để so sánh tiến bộ.`;
      pronunciationAction.classList.remove("hidden");
      pronunciationAction.onclick = () =>
        window.MILO_PRONUNCIATION_COACH?.open?.(target);
      complete.classList.remove("hidden");
      return;
    }
    dailyBusy = true;
    output.classList.add("is-thinking");
    output.textContent =
      "Milo đang xem bài hiện tại và chọn cách hướng dẫn vừa sức với con…";
    try {
      const response = await window.MILO_TUTOR.ask({
        question: step.prompt(context),
        grade: context.grade,
        gradeData: context.gradeData,
        unit: context.unit,
        petName: context.petName,
        part: "buổi học hôm nay",
        difficulty: step.assistant === "pathway" ? "unit" : step.assistant,
        conversationMode: "chat",
        assistantMode: step.assistant,
      });
      output.textContent = response.answer;
      window.MILO_PET_VOICE?.speak?.(response.answer);
      complete.classList.remove("hidden");
    } catch {
      output.textContent =
        "Milo chưa kết nối được. Con thử lại bước này sau ít giây nhé.";
      primary.textContent = "Thử lại bước này";
      primary.classList.remove("hidden");
    } finally {
      output.classList.remove("is-thinking");
      dailyBusy = false;
    }
  }

  async function completeDailyStep() {
    const state = dailyState();
    const step = dailySteps[state.active];
    if (!step || state.completed.includes(step.id)) return;
    state.completed.push(step.id);
    await record({
      type: "daily-step",
      skill: step.assistant === "pathway" ? "unit" : step.assistant,
      assistantMode: step.assistant,
      durationMinutes: 2,
      metadata: { step: step.id },
    });
    if (state.completed.length >= dailySteps.length) {
      state.finishedAt = new Date().toISOString();
      saveDailyState(state);
      await record({
        type: "daily-session",
        skill: "general",
        durationMinutes: 12,
        metadata: { step: "completed" },
      });
      renderDaily();
      renderParent();
      showToastSafe("Đã hoàn thành buổi học hôm nay!");
      return;
    }
    state.active = Math.min(state.active + 1, dailySteps.length - 1);
    saveDailyState(state);
    await runDailyStep(state.active);
  }

  function bindDaily() {
    const primary = document.querySelector("#dailyPrimary");
    const complete = document.querySelector("#dailyComplete");
    if (!primary || !complete) return;
    primary.onclick = () => {
      const state = dailyState();
      if (state.finishedAt) {
        if (typeof setView === "function") setView("parent");
        renderParent();
        return;
      }
      runDailyStep(state.active);
    };
    complete.onclick = completeDailyStep;
  }

  function completedUnits() {
    const { grade } = lessonContext();
    const completed = readJson(`milo-completed-${grade}`, []);
    return Array.isArray(completed) ? completed.length : 0;
  }

  function weekData(events) {
    const rows = [];
    const formatter = new Intl.DateTimeFormat("vi-VN", { weekday: "short" });
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      rows.push({
        key,
        label: formatter.format(date).replace("Th ", "T"),
        count: events.filter(
          (event) => localDayKey(event.createdAt) === key,
        ).length,
      });
    }
    return rows;
  }

  function pronunciationTrend(events) {
    const scores = events
      .filter(
        (event) =>
          event.type === "pronunciation" && Number.isFinite(event.score),
      )
      .map((event) => Number(event.score));
    if (scores.length < 2) {
      return "Cần thêm ít nhất hai lượt phát âm để Milo so sánh sự tiến bộ.";
    }
    const first = scores.slice(0, Math.min(3, scores.length));
    const recent = scores.slice(-Math.min(3, scores.length));
    const average = (items) =>
      Math.round(items.reduce((total, score) => total + score, 0) / items.length);
    const delta = average(recent) - average(first);
    return delta > 0
      ? `Điểm phát âm gần đây tăng ${delta} điểm so với những lượt đầu.`
      : delta < 0
        ? `Điểm gần đây giảm ${Math.abs(delta)} điểm; nên luyện lại câu ngắn và âm cuối.`
        : "Điểm phát âm đang ổn định; hãy tăng dần độ dài của câu luyện.";
  }

  function renderParent() {
    if (!document.querySelector("#view-parent")) return;
    const events = localEvents();
    const summary = summaryFrom(events);
    const context = lessonContext();
    document.querySelector("#parentLearningDays").textContent = String(
      summary.learningDays,
    );
    document.querySelector("#parentStreak").textContent =
      `Chuỗi hiện tại: ${summary.streak} ngày`;
    document.querySelector("#parentMinutes").textContent = String(
      summary.totalMinutes,
    );
    document.querySelector("#parentPronunciation").textContent =
      summary.pronunciationAttempts
        ? `${summary.averagePronunciation}/100`
        : "—";
    document.querySelector("#parentPronunciationBest").textContent =
      `Tốt nhất: ${summary.pronunciationAttempts ? `${summary.bestPronunciation}/100` : "—"}`;
    document.querySelector("#parentUnits").textContent = String(completedUnits());
    document.querySelector("#parentGradeLabel").textContent =
      `Lớp ${context.grade} · ${context.unit.title}`;
    const planBadge = document.querySelector("#parentPlanBadge");
    planBadge.textContent = isVip()
      ? "VIP PRO MAX · Đồng bộ"
      : "AI Plus · Trên thiết bị";

    const week = weekData(events);
    const max = Math.max(1, ...week.map((day) => day.count));
    document.querySelector("#parentWeekChart").innerHTML = week
      .map(
        (day) =>
          `<div class="v60-day"><b>${day.count}</b><i style="height:${Math.max(5, Math.round((day.count / max) * 105))}px"></i><small>${day.label}</small></div>`,
      )
      .join("");

    const weaknesses = document.querySelector("#parentWeaknesses");
    const repeated = summary.repeatedIssues.slice(0, 4);
    const skills = Object.entries(summary.skillCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4);
    const focus = repeated.length
      ? repeated.map((item) => `${item.label} · ${item.count} lần`)
      : skills.map(
          ([skill, count]) =>
            `${skillLabels[skill] || "Kỹ năng tổng hợp"} · ${count} lượt`,
        );
    weaknesses.innerHTML = focus.length
      ? focus.map((label) => `<span>${escapeHtml(label)}</span>`).join("")
      : '<span class="empty">Chưa đủ dữ liệu · Hãy cho con luyện một lượt</span>';
    document.querySelector("#parentTrend").textContent =
      pronunciationTrend(events);

    const leadingSkill =
      skills.find(([skill]) => skill !== "general")?.[0] || "pronunciation";
    const leadingLabel = skillLabels[leadingSkill] || "phát âm";
    document.querySelector("#parentRecommendation").innerHTML = `
      <ol>
        <li>Dành 10–15 phút cho “Buổi học hôm nay” ít nhất 3 ngày trong tuần.</li>
        <li>Ưu tiên kỹ năng <b>${leadingLabel}</b> bằng câu ngắn, sau đó tăng dần độ khó.</li>
        <li>Luyện lại một câu phát âm cho đến khi điểm tăng tối thiểu 5 điểm.</li>
      </ol>`;

    const memory = document.querySelector("#parentVipPanel");
    const memoryTitle = document.querySelector("#parentMemoryTitle");
    const memoryCopy = document.querySelector("#parentMemoryCopy");
    memory.classList.toggle("is-vip", isVip());
    if (isVip()) {
      memoryTitle.textContent = "Đã bật bộ nhớ dài hạn theo tài khoản";
      memoryCopy.textContent = remoteProfile?.updatedAt
        ? `Dữ liệu đã được đồng bộ. Milo dùng ${summary.totalEvents} hoạt động gần đây để điều chỉnh cách dạy và đề xuất mục tiêu tiếp theo.`
        : "Milo đang lưu các hoạt động mới và sẽ đồng bộ khi có kết nối.";
    } else {
      memoryTitle.textContent = "AI Plus đang lưu cơ bản trên thiết bị này";
      memoryCopy.textContent =
        "VIP PRO MAX giúp Milo ghi nhớ tiến bộ khi đổi máy, nhận ra lỗi lặp lại lâu dài và cá nhân hóa buổi học tiếp theo.";
    }
  }

  function bindParent() {
    const refresh = document.querySelector("#parentRefresh");
    if (refresh) {
      refresh.onclick = async () => {
        refresh.disabled = true;
        refresh.textContent = "Đang đồng bộ…";
        await sync();
        renderParent();
        refresh.disabled = false;
        refresh.textContent = "↻ Cập nhật báo cáo";
      };
    }
    document
      .querySelector('[data-view="parent"]')
      ?.addEventListener("click", renderParent);
    document
      .querySelector('[data-view="daily"]')
      ?.addEventListener("click", renderDaily);
  }

  function bindUpgradeButtons() {
    document.querySelectorAll("[data-v60-upgrade]").forEach((button) => {
      button.onclick = openUpgrade;
    });
  }

  function start() {
    window.MILO_ACTIVE_ASSISTANT = window.MILO_ACTIVE_ASSISTANT || "general";
    mountAssistantHub();
    bindDaily();
    bindParent();
    bindUpgradeButtons();
    renderDaily();
    renderParent();
    sync().then(() => renderParent());
  }

  window.addEventListener("milo:learning-event", (event) => {
    record(event.detail || {});
  });
  window.addEventListener("milo:learning-updated", () => {
    renderParent();
  });
  window.addEventListener("milo:access-updated", () => {
    renderAssistants();
    updateChatAccessUi();
    renderDaily();
    sync().then(() => renderParent());
  });

  window.MILO_LEARNING = {
    record,
    sync,
    events: localEvents,
    summary: () => summaryFrom(localEvents()),
    isVip,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
