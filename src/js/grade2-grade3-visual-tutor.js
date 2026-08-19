/**
 * Milo Visual Tutor Engine (Grade 2 & Grade 3) - Dedicated Vietnamese AI Teacher Suite
 * Interactive 7-Stage Guided Learning Journey with Dedicated Vietnamese AI Teacher Hub & Neural Audio
 * Author: Teacher Milo - World-Class Kids English Pedagogical Expert
 */
(function () {
  "use strict";

  let activeStage = 1; // 1 to 7
  let activeWordIdx = 0; // 0 to vocabList.length - 1
  let isFullscreenTheater = false;

  const STAGES = [
    { num: 1, icon: "🎬", name: "1. Khởi động" },
    { num: 2, icon: "📖", name: "2. Từ vựng" },
    { num: 3, icon: "💬", name: "3. Mẫu câu" },
    { num: 4, icon: "📚", name: "4. Đọc hiểu" },
    { num: 5, icon: "🗣️", name: "5. Luyện nói" },
    { num: 6, icon: "🎮", name: "6. Câu đố" },
    { num: 7, icon: "🏆", name: "7. Nhận thưởng" }
  ];

  let curriculumData = (typeof window !== "undefined" && window.MILO_VISUAL_CURRICULUM_DATA) || null;
  let curriculumPromise = null;

  function loadCurriculum() {
    if (curriculumData) return Promise.resolve(curriculumData);
    if (typeof window !== "undefined" && window.MILO_VISUAL_CURRICULUM_DATA) {
      curriculumData = window.MILO_VISUAL_CURRICULUM_DATA;
      return Promise.resolve(curriculumData);
    }
    if (curriculumPromise) return curriculumPromise;
    curriculumPromise = (async () => {
      try {
        let res = await fetch("CHUONG_TRINH_TOAN_DIEN_24_UNIT_LOP_2_VA_LOP_3.json");
        if (!res.ok) {
          res = await fetch("GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json");
        }
        if (res.ok) {
          curriculumData = await res.json();
          return curriculumData;
        }
      } catch (e) {
        console.warn("[MiloVisualTutor] Failed to fetch curriculum json:", e);
      }
      return null;
    })();
    return curriculumPromise;
  }

  // Pre-load immediately at script evaluation time
  loadCurriculum();

  // ==========================================================================
  // VIP PRO MAX VOICE ENGINE (NEURAL EN + NATURAL VI SPEECH)
  // ==========================================================================
  function playAudioStreamFallback(text, lang = "vi") {
    return new Promise((resolve) => {
      try {
        const cleanText = encodeURIComponent(String(text || "").slice(0, 200));
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${cleanText}`;
        const audio = new Audio(url);
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.play().catch(() => resolve(false));
      } catch (e) {
        resolve(false);
      }
    });
  }

  function playVietnameseOnly(textVi, rate = 0.88) {
    if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.speak === "function") {
      window.MILO_CUTE_VOICE.speak(textVi, rate, "vi-VN", { profile: "natural" });
      return;
    }
    if (!("speechSynthesis" in window)) {
      playAudioStreamFallback(textVi, "vi");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith("vi") && /natural|neural|hoaimy|linh|an|vietnam|google/i.test(v.name)) || voices.find(v => v.lang.startsWith("vi"));
    if (!viVoice) {
      playAudioStreamFallback(textVi, "vi");
    } else {
      window.speechSynthesis.cancel();
      const uVi = new SpeechSynthesisUtterance(textVi);
      uVi.lang = "vi-VN";
      uVi.rate = rate;
      uVi.voice = viVoice;
      window.speechSynthesis.speak(uVi);
    }
  }

  function playBilingual(textEn, textVi, rate = 0.82) {
    if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.speak === "function") {
      window.MILO_CUTE_VOICE.speak(
        [
          { lang: "en-US", text: textEn },
          { lang: "vi-VN", text: textVi }
        ],
        rate,
        "en-US",
        { profile: "natural", pause: 140 }
      );
      return;
    }

    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith("en") && /natural|neural|jenny|aria|samantha|zira|google/i.test(v.name)) || voices.find(v => v.lang.startsWith("en"));
    const viVoice = voices.find(v => v.lang.startsWith("vi") && /natural|neural|hoaimy|linh|an|vietnam|google/i.test(v.name)) || voices.find(v => v.lang.startsWith("vi"));

    const uEn = new SpeechSynthesisUtterance(textEn);
    uEn.lang = "en-US";
    uEn.rate = rate;
    if (enVoice) uEn.voice = enVoice;

    uEn.onend = async () => {
      if (!textVi) return;
      if (!viVoice) {
        await playAudioStreamFallback(textVi, "vi");
      } else {
        const uVi = new SpeechSynthesisUtterance(textVi);
        uVi.lang = "vi-VN";
        uVi.rate = 0.88;
        uVi.voice = viVoice;
        window.speechSynthesis.speak(uVi);
      }
    };

    window.speechSynthesis.speak(uEn);
  }

  function playSlowWord(textEn) {
    if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.speak === "function") {
      window.MILO_CUTE_VOICE.speak(textEn, 0.55, "en-US", { profile: "extra-slow" });
      return;
    }
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith("en") && /natural|neural|jenny|aria|samantha|zira/i.test(v.name)) || voices.find(v => v.lang.startsWith("en"));
      const uEn = new SpeechSynthesisUtterance(textEn);
      uEn.lang = "en-US";
      uEn.rate = 0.55;
      if (enVoice) uEn.voice = enVoice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(uEn);
    }
  }

  function resolveUnitNumber() {
    const unitSelect = document.getElementById("unitSelect");
    if (unitSelect) {
      if (unitSelect.selectedIndex >= 0) {
        return unitSelect.selectedIndex + 1;
      }
      const val = Number(unitSelect.value);
      if (!isNaN(val) && val >= 0 && val <= 11) {
        return val + 1;
      }
    }
    const params = new URLSearchParams(location.search);
    const urlUnit = params.get("unit");
    if (urlUnit !== null && urlUnit !== undefined) {
      const num = Number(urlUnit);
      if (!isNaN(num)) {
        if (num >= 0 && num <= 11) return num + 1;
        if (num >= 1 && num <= 12) return num;
      }
    }
    return 1;
  }

  function getUnitData(grade, unitNum) {
    if (!curriculumData) return null;
    const gradeKey = Number(grade) === 2 ? "grade2" : Number(grade) === 3 ? "grade3" : null;
    if (!gradeKey || !Array.isArray(curriculumData[gradeKey])) return null;
    return curriculumData[gradeKey].find((u) => Number(u.unit) === Number(unitNum)) || curriculumData[gradeKey][0];
  }

  function setStage(stageNum) {
    activeStage = Math.max(1, Math.min(7, stageNum));
    const container = document.getElementById("miloVisualLessonBox");
    if (!container) return;

    // Update Tab Buttons
    container.querySelectorAll(".milo-tab-node").forEach((btn) => {
      const num = Number(btn.dataset.step);
      btn.classList.toggle("active", num === activeStage);
      btn.classList.toggle("done", num < activeStage);
    });

    // Update Panels
    container.querySelectorAll(".milo-stage-panel").forEach((panel) => {
      const num = Number(panel.dataset.stage);
      panel.classList.toggle("active", num === activeStage);
    });

    // Update Progress Indicator Badge
    const progressBadge = container.querySelector("#miloStageProgressBadge");
    if (progressBadge) {
      progressBadge.innerHTML = `⭐ Trạm ${activeStage} / 7: ${STAGES[activeStage - 1].name}`;
    }

    // Scroll smoothly to top of lesson box
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function toggleFullscreenTheater() {
    const container = document.getElementById("miloVisualLessonBox");
    const toggleBtn = document.getElementById("miloFullscreenToggleBtn");
    if (!container) return;

    isFullscreenTheater = !isFullscreenTheater;
    container.classList.toggle("is-fullscreen", isFullscreenTheater);

    if (toggleBtn) {
      toggleBtn.innerHTML = isFullscreenTheater ? `🗗 Thu Gọn` : `⛶ Toàn Màn Hình`;
    }

    if (isFullscreenTheater && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      try {
        document.documentElement.requestFullscreen().catch(() => {});
      } catch (e) {}
    } else if (!isFullscreenTheater && document.exitFullscreen && document.fullscreenElement) {
      try {
        document.exitFullscreen().catch(() => {});
      } catch (e) {}
    }
  }

  // ==========================================================================
  // DEDICATED VIETNAMESE TEACHER AI MODAL
  // ==========================================================================
  function openVietnameseAiTeacherModal(unitData) {
    const modal = document.getElementById("miloVietnameseAiModal");
    if (!modal || !unitData) return;

    const vocabList = unitData.vocabulary || unitData.magicWords || [];
    const currentWord = vocabList[activeWordIdx] || vocabList[0] || {};

    const greetingText = `Chào con yêu! Cô Milo là gia sư AI chuyên giảng bài bằng tiếng Việt cho con đây. Trong bài học Unit ${unitData.unit} (${unitData.vi || unitData.theme}), con có điều gì chưa hiểu muốn cô giảng giải bằng tiếng Việt không?`;

    modal.innerHTML = `
      <div class="milo-vn-ai-modal-card">
        <div class="milo-vn-ai-modal-header">
          <div class="milo-vn-ai-modal-title">
            <div class="milo-vn-teacher-avatar">👩‍🏫</div>
            <div>
              <h3>CÔ GIÁO AI MILO · GIẢNG BÀI TIẾNG VIỆT</h3>
              <small style="color: #be123c; font-weight: 700;">Gia sư AI 100% tiếng Việt chuẩn truyền cảm</small>
            </div>
          </div>
          <button type="button" class="milo-ai-instant-close-btn" style="font-size: 24px;" onclick="document.getElementById('miloVietnameseAiModal').classList.remove('open')">✖</button>
        </div>

        <div class="milo-vn-ai-chat-box" id="miloVnAiTeacherMessageBox">
          <p style="margin: 0 0 10px 0;"><b>🦊 Cô Milo chào con:</b></p>
          <p style="margin: 0; font-size: 15.5px; font-weight: 700;" id="miloVnAiSpeechText">${greetingText}</p>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button type="button" class="milo-btn-3d-green" id="miloVnAiSpeakGreetingBtn" style="padding: 6px 14px; font-size: 13px;">
              🔊 Cô Milo Đọc Lại Bằng Tiếng Việt
            </button>
          </div>
        </div>

        <b style="color: #9f1239; font-size: 13.5px; display: block; margin-bottom: 8px;">💡 BẤM ĐỂ CÔ MILO GIẢNG BÀI BẰNG TIẾNG VIỆT:</b>
        <div class="milo-vn-ai-quick-grid">
          <button type="button" class="milo-vn-ai-quick-btn" id="miloVnAiExplainWordBtn">
            📖 <b>Giảng từ "${currentWord.term}"</b><br>
            <small style="color: #64748b;">Giải thích nghĩa, âm tiết và mẹo nhớ</small>
          </button>
          <button type="button" class="milo-vn-ai-quick-btn" id="miloVnAiExplainGrammarBtn">
            💬 <b>Giảng mẫu câu cốt lõi</b><br>
            <small style="color: #64748b;">Cách đặt câu và ngữ pháp thực tế</small>
          </button>
          <button type="button" class="milo-vn-ai-quick-btn" id="miloVnAiMemoryTipBtn">
            💡 <b>Mẹo nhớ siêu tốc</b><br>
            <small style="color: #64748b;">Bí quyết nhớ từ chỉ trong 3 giây</small>
          </button>
          <button type="button" class="milo-vn-ai-quick-btn" id="miloVnAiPraiseBtn">
            🌟 <b>Khen ngợi & động viên bé</b><br>
            <small style="color: #64748b;">Truyền cảm hứng học tiếng Anh</small>
          </button>
        </div>

        <!-- Vietnamese Direct Question Input -->
        <div style="background: #f8fafc; border-radius: 18px; padding: 14px 18px; border: 1.5px solid #e2e8f0;">
          <b style="color: #0369a1; font-size: 13px; display: block; margin-bottom: 6px;">✍️ HOẶC BÉ HỎI CÔ MILO BẤT KỲ CÂU HỎI TIẾNG VIỆT NÀO:</b>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="miloVnAiCustomQuestionInput" style="flex: 1; border: 2px solid #cbd5e1; border-radius: 12px; padding: 10px 14px; font-size: 14.5px; font-family: inherit;" placeholder="Ví dụ: Giảng lại từ này giúp con, Đặt câu với từ này...">
            <button type="button" class="milo-btn-3d-blue" id="miloVnAiSubmitQuestionBtn" style="padding: 10px 20px; font-size: 14px;">
              Gửi Cô Milo
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("open");
    playVietnameseOnly(greetingText);

    const updateTeacherBox = (heading, message) => {
      const msgBox = modal.querySelector("#miloVnAiTeacherMessageBox");
      const speechText = modal.querySelector("#miloVnAiSpeechText");
      if (speechText) speechText.innerHTML = `<b>${heading}:</b><br>${message}`;
      playVietnameseOnly(message.replace(/<[^>]*>/g, ""));
    };

    modal.querySelector("#miloVnAiSpeakGreetingBtn")?.addEventListener("click", () => {
      const text = modal.querySelector("#miloVnAiSpeechText")?.textContent || greetingText;
      playVietnameseOnly(text);
    });

    modal.querySelector("#miloVnAiExplainWordBtn")?.addEventListener("click", () => {
      const msg = `Từ tiếng Anh "${currentWord.term}" có nghĩa là "${currentWord.meaning}". Tách âm tiết đọc là "${currentWord.syllables || currentWord.term}". Khi dùng trong câu ví dụ: "${currentWord.exampleSentence || ''}", nghĩa tiếng Việt là: "${currentWord.exampleVi || ''}". Bé nhớ đọc to rõ từng âm nhé!`;
      updateTeacherBox("📖 Cô Milo Giảng Nghĩa Từ", msg);
    });

    modal.querySelector("#miloVnAiExplainGrammarBtn")?.addEventListener("click", () => {
      const msg = `Trong bài này, chúng ta học mẫu câu: "${unitData.pattern?.[0] || ''}". Dịch sang tiếng Việt là câu hỏi về chủ đề bài học. Khi trả lời, bé dùng: "${unitData.pattern?.[1] || ''}". Quy tắc nhớ là: ${unitData.grammarRule || 'luôn giữ đúng cấu trúc chủ ngữ và động từ'}.`;
      updateTeacherBox("💬 Cô Milo Giảng Mẫu Câu", msg);
    });

    modal.querySelector("#miloVnAiMemoryTipBtn")?.addEventListener("click", () => {
      const msg = `Mẹo nhớ siêu tốc từ cô Milo: ${currentWord.phonicsTip || `Bé hãy tưởng tượng hình ảnh "${currentWord.meaning}" thật rõ nét và nhẩm lại 3 lần!`}`;
      updateTeacherBox("💡 Mẹo Nhớ Từ Siêu Tốc", msg);
    });

    modal.querySelector("#miloVnAiPraiseBtn")?.addEventListener("click", () => {
      const msg = `Bé học bài cực kỳ chăm chỉ và thông minh! Cô Milo rất tự hào về con. Hãy tiếp tục khám phá bài học để rinh trọn 5 sao vàng xuất sắc nhé!`;
      updateTeacherBox("🌟 Lời Khen Từ Cô Milo", msg);
    });

    const submitQuestion = () => {
      const input = modal.querySelector("#miloVnAiCustomQuestionInput");
      const q = input?.value?.trim();
      if (!q) return;
      const ans = `Cô Milo đã nhận được câu hỏi "${q}" của con. Trong Unit ${unitData.unit} về chủ đề "${unitData.vi || unitData.theme}", từ vựng trọng tâm là "${currentWord.term}" (${currentWord.meaning}). Con hãy nhớ áp dụng vào các câu giao tiếp hàng ngày nhé!`;
      updateTeacherBox("🦊 Cô Milo Trả Lời Con", ans);
      if (input) input.value = "";
    };

    modal.querySelector("#miloVnAiSubmitQuestionBtn")?.addEventListener("click", submitQuestion);
    modal.querySelector("#miloVnAiCustomQuestionInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitQuestion();
    });
  }

  // ==========================================================================
  // IN-CONTEXT AI ASSISTANT SYSTEM
  // ==========================================================================
  function showInstantAiWordDrawer(w) {
    const drawer = document.getElementById("miloAiWordInstantDrawer");
    if (!drawer || !w) return;

    drawer.innerHTML = `
      <div class="milo-ai-instant-header">
        <div class="milo-ai-instant-header-title">
          <span>🤖</span> GIA SƯ AI MILO: PHÂN TÍCH TỪ "${w.term.toUpperCase()}"
        </div>
        <button type="button" class="milo-ai-instant-close-btn" onclick="this.closest('.milo-ai-instant-card').classList.remove('open')">✖</button>
      </div>
      <div class="milo-ai-instant-body">
        <p><b>🧠 Nghĩa & Loại từ:</b> Từ <i>"${w.term}"</i> (${w.ipa || ""}) có nghĩa là <b>${w.meaning}</b>. Âm tiết phân tách: <b>${w.syllables || w.term}</b>.</p>
        <p><b>💡 Mẹo ghi nhớ siêu tốc:</b> ${w.phonicsTip || `Hình dung hình ảnh đồ vật "${w.meaning}" trong đầu và đọc to 3 lần cùng Milo!`}</p>
        <div style="background: #ffffff; border-radius: 12px; padding: 10px 14px; border: 1px solid #ddd6fe; margin: 10px 0;">
          <b style="color: #6d28d9; font-size: 13px;">🎭 3 Câu Giao Tiếp Mới Do AI Đặt:</b>
          <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 14px;">
            <li>"I see a ${w.term} in my room." <i>(Tôi thấy ${w.meaning} trong phòng)</i></li>
            <li>"Do you have a ${w.term}?" <i>(Bạn có ${w.meaning} không?)</i></li>
            <li>"This ${w.term} is very nice!" <i>(Đồ vật này rất đẹp!)</i></li>
          </ul>
        </div>
        <div class="milo-ai-quick-prompts-row">
          <button type="button" class="milo-ai-prompt-chip" id="miloAiSpeakWordExplanation">🔊 Nghe AI Giải Thích</button>
          <button type="button" class="milo-ai-prompt-chip" id="miloAiSpellSlow">🐢 Đánh Vần Từng Chữ Cái</button>
          <button type="button" class="milo-ai-prompt-chip" id="miloAiPraiseStudent">⭐ Khen Thưởng Bé</button>
        </div>
      </div>
    `;

    drawer.classList.add("open");

    drawer.querySelector("#miloAiSpeakWordExplanation")?.addEventListener("click", () => {
      playVietnameseOnly(`Từ ${w.term} nghĩa tiếng Việt là ${w.meaning}. Ví dụ: ${w.exampleVi || ''}`);
    });

    drawer.querySelector("#miloAiSpellSlow")?.addEventListener("click", () => {
      if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.spell === "function") {
        window.MILO_CUTE_VOICE.spell(w.term);
      } else {
        const letters = w.term.split("").join(" - ");
        playBilingual(letters, "Đánh vần từng chữ cái");
      }
    });

    drawer.querySelector("#miloAiPraiseStudent")?.addEventListener("click", () => {
      playVietnameseOnly(`Tuyệt vời! Bé đã nắm vững từ vựng "${w.term}" (${w.meaning}) rồi đấy!`);
    });

    playVietnameseOnly(`Cô Milo đang phân tích từ ${w.term}, nghĩa là ${w.meaning}`);
  }

  function showInstantAiSentenceDrawer(enSentence, viSentence, context = "Giao tiếp") {
    const drawer = document.getElementById("miloAiSentenceInstantDrawer");
    if (!drawer) return;

    drawer.innerHTML = `
      <div class="milo-ai-instant-header">
        <div class="milo-ai-instant-header-title">
          <span>🤖</span> GIA SƯ AI MILO: PHÂN TÍCH CÂU "${enSentence}"
        </div>
        <button type="button" class="milo-ai-instant-close-btn" onclick="this.closest('.milo-ai-instant-card').classList.remove('open')">✖</button>
      </div>
      <div class="milo-ai-instant-body">
        <p><b>💬 Câu tiếng Anh:</b> "${enSentence}"</p>
        <p><b>👉 Dịch nghĩa tự nhiên:</b> ${viSentence}</p>
        <p><b>🔑 Ngữ cảnh & Cấu trúc:</b> [${context}] - Mẫu câu giao tiếp tự nhiên chuẩn bản ngữ. Giúp bé tự tin giao tiếp trong các tình huống thực tế!</p>
        <div class="milo-ai-quick-prompts-row">
          <button type="button" class="milo-ai-prompt-chip" id="miloAiSpeakSentenceFast">🔊 Nghe Tốc Độ Chuẩn</button>
          <button type="button" class="milo-ai-prompt-chip" id="miloAiSpeakSentenceSlow">🐢 Nghe Tốc Độ Chậm</button>
          <button type="button" class="milo-ai-prompt-chip" id="miloAiSpeakSentenceVi">🇻🇳 Nghe Cô Milo Giảng Tiếng Việt</button>
        </div>
      </div>
    `;

    drawer.classList.add("open");

    drawer.querySelector("#miloAiSpeakSentenceFast")?.addEventListener("click", () => {
      playBilingual(enSentence, viSentence, 0.85);
    });

    drawer.querySelector("#miloAiSpeakSentenceSlow")?.addEventListener("click", () => {
      if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.speak === "function") {
        window.MILO_CUTE_VOICE.speak(enSentence, 0.58, "en-US", { profile: "extra-slow" });
      } else {
        playBilingual(enSentence, "", 0.58);
      }
    });

    drawer.querySelector("#miloAiSpeakSentenceVi")?.addEventListener("click", () => {
      playVietnameseOnly(`Câu này nghĩa tiếng Việt là: "${viSentence}". Ngữ cảnh sử dụng: ${context}.`);
    });

    playBilingual(enSentence, "AI phân tích câu");
  }

  // ==========================================================================
  // ==========================================================================
  // AI READING & PRONUNCIATION SCORER (CHẤM ĐIỂM ĐỌC AI)
  // ==========================================================================
  let activeRecognition = null;
  let isListeningScorer = false;
  let listenTimeoutTimer = null;

  function cleanScorerWord(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  function levenshteinDistance(s1, s2) {
    const m = s1.length, n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  function wordSimilarity(w1, w2) {
    const c1 = cleanScorerWord(w1);
    const c2 = cleanScorerWord(w2);
    if (!c1 || !c2) return 0;
    if (c1 === c2) return 1.0;
    const maxLen = Math.max(c1.length, c2.length);
    const dist = levenshteinDistance(c1, c2);
    const sim = (maxLen - dist) / maxLen;
    return Math.max(0, sim);
  }

  function calculateAccuracy(targetText, spokenText) {
    const targetWords = String(targetText || "").trim().split(/\s+/).filter(Boolean);
    const spokenWords = String(spokenText || "").trim().split(/\s+/).filter(Boolean);

    if (!spokenWords.length) {
      return {
        score: 0,
        breakdown: targetWords.map(w => ({ word: w, status: 'missed', sim: 0 })),
        spoken: "",
        empty: true
      };
    }

    let totalSim = 0;
    const breakdown = targetWords.map((tWord) => {
      let bestSim = 0;
      for (const sWord of spokenWords) {
        const sim = wordSimilarity(tWord, sWord);
        if (sim > bestSim) bestSim = sim;
      }
      totalSim += bestSim;
      if (bestSim >= 0.82) {
        return { word: tWord, status: 'correct', sim: bestSim };
      } else if (bestSim >= 0.45) {
        return { word: tWord, status: 'close', sim: bestSim };
      } else {
        return { word: tWord, status: 'missed', sim: bestSim };
      }
    });

    const avgSim = totalSim / Math.max(targetWords.length, 1);
    const score = Math.max(0, Math.min(100, Math.round(avgSim * 100)));
    return {
      score,
      breakdown,
      spoken: spokenWords.join(" "),
      empty: false
    };
  }

  function openReadingScorer(targetText, targetVi = "", targetIpa = "", contextTitle = "Từ Vựng Trọng Tâm") {
    let modal = document.getElementById("miloReadingScorerModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "miloReadingScorerModal";
      modal.className = "milo-reading-scorer-modal-overlay";
      document.body.appendChild(modal);
    }

    const cleanTarget = String(targetText || "").trim();

    modal.innerHTML = `
      <div class="milo-reading-scorer-card">
        <div class="milo-scorer-header">
          <div class="milo-scorer-title-badge">
            <span>🎙️</span> PHÒNG LUYỆN ĐỌC & CHẤM ĐIỂM AI
          </div>
          <button type="button" class="milo-ai-instant-close-btn" id="miloScorerCloseBtn">✖</button>
        </div>

        <div class="milo-scorer-target-box">
          <span style="font-size:12px; font-weight:800; color:#7e22ce; background:#f3e8ff; padding:3px 12px; border-radius:10px; display:inline-block; margin-bottom:8px;">${contextTitle}</span>
          <h2 class="milo-scorer-target-text">${cleanTarget}</h2>
          <div class="milo-scorer-target-meta">
            ${targetIpa ? `<code>${targetIpa}</code>` : ""}
            ${targetVi ? `<b>👉 ${targetVi}</b>` : ""}
          </div>
          <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
            <button type="button" class="milo-choice-btn" id="miloScorerHearStandard" style="padding:6px 14px; font-size:13px; color:#0284c7; border-color:#bae6fd;">
              🔊 Nghe phát âm chuẩn
            </button>
            <button type="button" class="milo-choice-btn" id="miloScorerHearSlow" style="padding:6px 14px; font-size:13px; color:#7c3aed; border-color:#ddd6fe;">
              🐢 Đọc chậm từng âm
            </button>
          </div>
        </div>

        <div class="milo-scorer-mic-stage">
          <button type="button" class="milo-scorer-big-mic-btn" id="miloScorerBigMicBtn" title="Bấm để bắt đầu đọc">
            🎙️
          </button>
          <div class="milo-scorer-status-pill" id="miloScorerStatusPill">
            👆 Bấm vào Mic để đọc to từ trên
          </div>
        </div>

        <div id="miloScorerResultArea"></div>
      </div>
    `;

    modal.classList.add("open");

    const micBtn = modal.querySelector("#miloScorerBigMicBtn");
    const statusPill = modal.querySelector("#miloScorerStatusPill");
    const resultArea = modal.querySelector("#miloScorerResultArea");

    function stopListening() {
      if (listenTimeoutTimer) {
        clearTimeout(listenTimeoutTimer);
        listenTimeoutTimer = null;
      }
      if (activeRecognition) {
        try { activeRecognition.stop(); } catch {}
        activeRecognition = null;
      }
      isListeningScorer = false;
      micBtn?.classList.remove("listening");
    }

    // Close button
    modal.querySelector("#miloScorerCloseBtn")?.addEventListener("click", () => {
      stopListening();
      modal.classList.remove("open");
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        stopListening();
        modal.classList.remove("open");
      }
    });

    // Audio helper
    modal.querySelector("#miloScorerHearStandard")?.addEventListener("click", () => {
      playBilingual(cleanTarget, targetVi, 0.82);
    });

    modal.querySelector("#miloScorerHearSlow")?.addEventListener("click", () => {
      if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.speak === "function") {
        window.MILO_CUTE_VOICE.speak(cleanTarget, 0.58, "en-US", { profile: "extra-slow" });
      } else {
        playBilingual(cleanTarget, "", 0.58);
      }
    });

    function renderScorerResult(evalResult) {
      const { score, breakdown, spoken, empty } = evalResult;
      
      let starsCount = "☆☆☆";
      let scoreClass = "retry";
      let praiseTitle = "❌ PHÁT ÂM CHƯA ĐÚNG";
      let praiseDetail = `Bé hãy nghe mẫu phát âm chuẩn và thử đọc lại nhé!`;
      let praiseAudio = "Not quite right. Let's listen and try again!";

      if (empty || score === 0) {
        starsCount = "☆☆☆";
        scoreClass = "retry";
        praiseTitle = "⚠️ CHƯA NGHE THẤY BÉ ĐỌC";
        praiseDetail = `Micro chưa thu được giọng đọc của bé. Bé hãy để micro gần hơn, bấm nút Mic và đọc to rõ từ "${cleanTarget}" nhé!`;
        praiseAudio = "I did not hear you. Please speak louder into the microphone!";
      } else if (score >= 90) {
        starsCount = "⭐⭐⭐";
        scoreClass = "";
        praiseTitle = "🏆 TUYỆT VỜI! PHÁT ÂM CHUẨN XUẤT SẮC!";
        praiseDetail = `Bé phát âm hoàn hảo 100 điểm, đúng chuẩn ngữ điệu của từ "${cleanTarget}"!`;
        praiseAudio = "Awesome! 100 points! Excellent pronunciation!";
      } else if (score >= 75) {
        starsCount = "⭐⭐☆";
        scoreClass = "great";
        praiseTitle = `🌟 RẤT TỐT! ĐẠT ${score} ĐIỂM!`;
        praiseDetail = `Bé đã đọc rất chuẩn! Nhấn rõ âm đuôi một chút nữa là đạt điểm 100 tuyệt đối!`;
        praiseAudio = "Great job! Very well done!";
      } else if (score >= 50) {
        starsCount = "⭐☆☆";
        scoreClass = "retry";
        praiseTitle = `👍 KHÁ TỐT (${score} ĐIỂM)`;
        praiseDetail = `Bé đọc là "${spoken}", đã gần đúng rồi. Cố gắng phát âm tròn âm hơn nhé!`;
        praiseAudio = "Good try! Keep practicing!";
      } else {
        starsCount = "☆☆☆";
        scoreClass = "retry";
        praiseTitle = `❌ CẦN CỐ GẮNG HƠN (${score} ĐIỂM)`;
        praiseDetail = `Bé đọc là "${spoken}", chưa đúng với "${cleanTarget}". Bé hãy bấm "Nghe phát âm chuẩn" ở trên và đọc lại nhé!`;
        praiseAudio = "Good try, but not quite right. Listen and try again!";
      }

      // Add stars to student progress only when score is high
      if (score >= 75) {
        const curStars = Number(localStorage.getItem('milo-stars') || 0) + (score >= 90 ? 10 : 5);
        localStorage.setItem('milo-stars', String(curStars));
        const starsEl = document.querySelector("#stars");
        if (starsEl) starsEl.textContent = curStars;
      }

      const breakdownHtml = breakdown.map(item => `
        <span class="milo-score-word-pill ${item.status}">
          ${item.status === 'correct' ? '✓' : item.status === 'close' ? '△' : '×'} ${item.word}
        </span>
      `).join("");

      resultArea.innerHTML = `
        <div class="milo-scorer-result-card">
          <div class="milo-scorer-score-display">
            <div class="milo-score-circle ${scoreClass}">
              <span>${score}</span>
              <small>/100</small>
            </div>
            <div style="text-align:left;">
              <div class="milo-score-stars" style="color:#f59e0b;">${starsCount}</div>
              <div class="milo-score-message">${praiseTitle}</div>
            </div>
          </div>

          <div style="background:#f8fafc; border-radius:14px; padding:10px 14px; margin:10px 0; font-size:14px; color:#475569;">
            <b>🎧 Âm thanh AI nghe được:</b> <span style="color:${score >= 75 ? '#16a34a' : '#dc2626'}; font-weight:800;">"${spoken || '(Chưa có âm thanh)'}"</span>
          </div>

          <div class="milo-score-words-feedback">
            ${breakdownHtml}
          </div>

          <div class="milo-scorer-teacher-bubble">
            <span style="font-size:22px;">👩‍🏫</span>
            <div>
              <b style="display:block; margin-bottom:2px;">Nhận xét từ Cô Milo:</b>
              <span>${praiseDetail}</span>
            </div>
          </div>

          <div class="milo-scorer-actions-row">
            <button type="button" class="milo-btn-3d-purple" id="miloScorerTryAgainBtn" style="padding:10px 22px; font-size:14px;">
              🔄 Bé Đọc Lại
            </button>
            <button type="button" class="milo-btn-3d-green" id="miloScorerDoneBtn" style="padding:10px 22px; font-size:14px;">
              ${score >= 75 ? `✓ Hoàn Thành (+${score >= 90 ? 10 : 5} ⭐)` : `✓ Đóng`}
            </button>
          </div>
        </div>
      `;

      modal.querySelector("#miloScorerTryAgainBtn")?.addEventListener("click", () => {
        resultArea.innerHTML = "";
        startListening();
      });

      modal.querySelector("#miloScorerDoneBtn")?.addEventListener("click", () => {
        stopListening();
        modal.classList.remove("open");
      });

      // Play cute praise voice
      if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.speak === "function") {
        window.MILO_CUTE_VOICE.speak(praiseAudio, 0.88, "en-US", { profile: score >= 75 ? "happy" : "gentle" });
      }
    }

    function startListening() {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        statusPill.textContent = "⚠️ Trình duyệt chưa hỗ trợ Web Speech trên thiết bị này.";
        statusPill.className = "milo-scorer-status-pill evaluating";
        return;
      }

      try {
        if (activeRecognition) {
          activeRecognition.stop();
        }

        const rec = new Recognition();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 3;

        let speechReceived = false;

        rec.onstart = () => {
          isListeningScorer = true;
          speechReceived = false;
          micBtn.classList.add("listening");
          statusPill.textContent = "🔴 Đang lắng nghe... Bé hãy đọc to từ \"" + cleanTarget + "\"!";
          statusPill.className = "milo-scorer-status-pill recording";

          // Auto stop after 6 seconds if no speech detected
          listenTimeoutTimer = setTimeout(() => {
            if (!speechReceived && isListeningScorer) {
              stopListening();
              renderScorerResult({ score: 0, breakdown: [{ word: cleanTarget, status: 'missed' }], spoken: "", empty: true });
              statusPill.textContent = "⚠️ Hết thời gian thu âm. Bấm lại để đọc!";
              statusPill.className = "milo-scorer-status-pill";
            }
          }, 6000);
        };

        rec.onresult = (e) => {
          speechReceived = true;
          if (listenTimeoutTimer) clearTimeout(listenTimeoutTimer);
          
          let spoken = "";
          if (e.results && e.results[0] && e.results[0][0]) {
            spoken = e.results[0][0].transcript.trim();
          }
          
          statusPill.textContent = "⏳ AI đang phân tích âm điệu: \"" + spoken + "\"...";
          statusPill.className = "milo-scorer-status-pill evaluating";
          
          setTimeout(() => {
            const evalResult = calculateAccuracy(cleanTarget, spoken);
            renderScorerResult(evalResult);
            statusPill.textContent = "✓ Đã chấm điểm xong!";
            statusPill.className = "milo-scorer-status-pill";
          }, 400);
        };

        rec.onerror = (err) => {
          console.warn("[MiloReadingScorer] SpeechRecognition error:", err);
          stopListening();
          
          // Strict error handling: DO NOT award 100 points!
          if (err.error === 'no-speech') {
            renderScorerResult({ score: 0, breakdown: [{ word: cleanTarget, status: 'missed' }], spoken: "", empty: true });
            statusPill.textContent = "⚠️ Chưa nghe thấy tiếng nói. Bé hãy thử lại!";
          } else if (err.error === 'not-allowed') {
            statusPill.textContent = "⚠️ Quyền Micro chưa được bật trên trình duyệt.";
          } else {
            renderScorerResult({ score: 0, breakdown: [{ word: cleanTarget, status: 'missed' }], spoken: "", empty: true });
            statusPill.textContent = "⚠️ Chưa nhận diện được giọng đọc. Bé hãy thử lại!";
          }
          statusPill.className = "milo-scorer-status-pill";
        };

        rec.onend = () => {
          stopListening();
        };

        activeRecognition = rec;
        rec.start();
      } catch (e) {
        console.warn("[MiloReadingScorer] start failed:", e);
        stopListening();
        statusPill.textContent = "⚠️ Không khởi động được micro.";
        statusPill.className = "milo-scorer-status-pill";
      }
    }

    micBtn.onclick = () => {
      if (isListeningScorer) {
        stopListening();
        statusPill.textContent = "⏹️ Đã dừng. Bấm để đọc lại";
        statusPill.className = "milo-scorer-status-pill";
      } else {
        startListening();
      }
    };

    // Prompt target sound initially
    playBilingual(cleanTarget, targetVi, 0.85);
  }

  function updateVocabFocusView(unitData) {
    const container = document.getElementById("miloVisualLessonBox");
    if (!container || !unitData) return;

    const vocabList = unitData.vocabulary || unitData.magicWords || [];
    if (!vocabList.length) return;

    activeWordIdx = Math.max(0, Math.min(vocabList.length - 1, activeWordIdx));
    const currentWord = vocabList[activeWordIdx];

    // Hide previous word AI drawer
    const wordDrawer = document.getElementById("miloAiWordInstantDrawer");
    if (wordDrawer) wordDrawer.classList.remove("open");

    // Update Word Chips
    container.querySelectorAll(".milo-word-chip").forEach((chip) => {
      const idx = Number(chip.dataset.wordIdx);
      chip.classList.toggle("active", idx === activeWordIdx);
      chip.classList.toggle("done", idx < activeWordIdx);
    });

    // Update Left Image
    const heroImg = container.querySelector("#miloVocab3DImg");
    if (heroImg) {
      heroImg.src = currentWord.flashcard3D || currentWord.flashcard || "assets/lessons/milo_school_fun_1786937097491.jpg";
      heroImg.alt = currentWord.term;
    }

    // Update Right Details
    const mainTerm = container.querySelector("#miloVocabMainTermHeading");
    if (mainTerm) mainTerm.textContent = currentWord.term;

    const syllableBadge = container.querySelector("#miloVocabSyllableBadge");
    if (syllableBadge) syllableBadge.textContent = `Âm tiết: ${currentWord.syllables || currentWord.term}`;

    const ipaBadge = container.querySelector("#miloVocabIpaBadge");
    if (ipaBadge) ipaBadge.textContent = currentWord.ipa || `/${currentWord.term.toLowerCase()}/`;

    const meaningHeading = container.querySelector("#miloVocabMeaningHeading");
    if (meaningHeading) meaningHeading.textContent = `👉 ${currentWord.meaning}`;

    const phonicsTip = container.querySelector("#miloVocabPhonicsTip");
    if (phonicsTip) {
      phonicsTip.textContent = currentWord.phonicsTip || `Lắng nghe cô Milo phát âm mẫu và lặp lại rõ từng âm tiết: ${currentWord.syllables || currentWord.term}.`;
    }

    const exampleSentence = container.querySelector("#miloVocabExampleSentence");
    if (exampleSentence) {
      exampleSentence.innerHTML = `"${currentWord.exampleSentence || `I like learning ${currentWord.term}.`}"<br><small>👉 ${currentWord.exampleVi || `Tôi thích học từ ${currentWord.meaning}.`}</small>`;
    }

    const appliedSentence2 = container.querySelector("#miloVocabAppliedSentence2");
    if (appliedSentence2) {
      appliedSentence2.innerHTML = `"${currentWord.appliedSentence2 || `We use ${currentWord.term} in daily English.`}"<br><small>👉 ${currentWord.appliedVi2 || `Chúng ta dùng từ ${currentWord.meaning} trong giao tiếp hàng ngày.`}</small>`;
    }

    // Update Footer Buttons
    const prevWordBtn = container.querySelector("#miloVocabPrevBtn");
    if (prevWordBtn) {
      prevWordBtn.style.visibility = activeWordIdx > 0 ? "visible" : "hidden";
      if (activeWordIdx > 0) {
        prevWordBtn.textContent = `⬅ ${vocabList[activeWordIdx - 1].term}`;
      }
    }

    const nextWordBtn = container.querySelector("#miloVocabNextBtn");
    if (nextWordBtn) {
      if (activeWordIdx < vocabList.length - 1) {
        nextWordBtn.textContent = `Tiếp: "${vocabList[activeWordIdx + 1].term}" ➔`;
      } else {
        nextWordBtn.textContent = `✓ Xong 16 từ! Sang Trạm 3 ➔`;
      }
    }
  }

  function renderVisualLesson(container, unitData) {
    if (!container || !unitData) return;

    document.body.classList.add("has-visual-tutor");

    let existing = document.getElementById("miloVisualLessonBox");
    if (!existing) {
      existing = document.createElement("section");
      existing.id = "miloVisualLessonBox";
      existing.className = "milo-visual-lesson-container";
      container.prepend(existing);
    }

    // Hide any legacy micro lesson or other sibling elements in lessonContent
    Array.from(container.children).forEach((child) => {
      if (child.id !== "miloVisualLessonBox") {
        child.style.setProperty("display", "none", "important");
      }
    });

    let vnModal = document.getElementById("miloVietnameseAiModal");
    if (!vnModal) {
      vnModal = document.createElement("div");
      vnModal.id = "miloVietnameseAiModal";
      vnModal.className = "milo-vn-ai-modal-overlay";
      document.body.appendChild(vnModal);
    }

    const vocabList = unitData.vocabulary || unitData.magicWords || [];
    const currentWord = vocabList[activeWordIdx] || vocabList[0] || {};

    const wordChipsHtml = vocabList.map((w, idx) => `
      <button type="button" class="milo-word-chip ${idx === activeWordIdx ? 'active' : ''} ${idx < activeWordIdx ? 'done' : ''}" data-word-idx="${idx}">
        ${idx < activeWordIdx ? '✓ ' : ''}${idx + 1}. ${w.term}
      </button>
    `).join("");

    const askSentence = unitData.pattern?.[0] || "What do we learn today?";
    const answerSentence = unitData.pattern?.[1] || `We learn English Unit ${unitData.unit}.`;

    // 6 Applied Sentences HTML with Instant AI & Vietnamese Buttons
    const appliedGrammarHtml = (unitData.grammarAppliedExamples || []).map((ex) => `
      <div style="background:#f8fafc; border-radius:16px; padding:14px 18px; border:1.5px solid #e2e8f0; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div style="flex:1; min-width:240px;">
          <span style="font-size:12px; font-weight:800; color:#0369a1; background:#e0f2fe; padding:3px 10px; border-radius:8px; display:inline-block; margin-bottom:3px;">${ex.context}</span>
          <p style="margin:0; font-size:15.5px; font-weight:800; color:#0f172a;">"${ex.en}"</p>
          <small style="color:#047857; font-weight:600; display:block; margin-top:2px;">👉 ${ex.vi}</small>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" class="milo-btn-3d-blue" style="padding:7px 16px; font-size:13px;" data-speak-en="${ex.en}" data-speak-vi="${ex.vi}">
            🔊 Nghe
          </button>
          <button type="button" class="milo-btn-ai-vn-direct" data-speak-vn-only="${ex.vi}">
            🇻🇳 Tiếng Việt
          </button>
          <button type="button" class="milo-btn-ai-incontext" data-ai-sentence="${ex.en}" data-ai-vi="${ex.vi}" data-ai-context="${ex.context}">
            🤖 Hỏi AI
          </button>
        </div>
      </div>
    `).join("");

    // 4 Grammar Exercises HTML
    const grammarExercisesHtml = (unitData.grammarExercises || []).map((gEx, idx) => `
      <div class="milo-quiz-question-card">
        <b style="color:#9a3412; font-size:13.5px;">⚡ ${gEx.title || `Bài tập ${idx + 1}`}:</b>
        <p>${gEx.question}</p>
        <div class="milo-options-grid">
          ${(gEx.options || []).map((opt) => `
            <button type="button" class="milo-choice-btn" data-correct="${opt === gEx.correct}">
              ${opt}
            </button>
          `).join("")}
        </div>
        <div class="milo-feedback-pill">
          🎉 Chính xác! ${gEx.explain || ""}
        </div>
      </div>
    `).join("");

    // 4 Reading Exercises HTML
    const readingExercisesHtml = (unitData.readingExercises || []).map((rEx, idx) => `
      <div class="milo-quiz-question-card" style="border-color:#86efac; border-bottom-color:#4ade80;">
        <b style="color:#065f46; font-size:13.5px;">🔎 ${rEx.title || `Câu hỏi đọc hiểu ${idx + 1}`}:</b>
        <p>${rEx.q}</p>
        <div class="milo-options-grid">
          ${(rEx.options || []).map((opt) => `
            <button type="button" class="milo-choice-btn" data-correct="${opt === rEx.correct}">
              ${opt}
            </button>
          `).join("")}
        </div>
        <div class="milo-feedback-pill">
          🎉 Chính xác! Bé đã đọc hiểu đoạn văn rất xuất sắc!
        </div>
      </div>
    `).join("");

    // 5 Quiz Arena Questions HTML
    const quiz3DHtml = (unitData.quiz3D || []).map((qItem, idx) => `
      <div class="milo-quiz-question-card">
        <b style="color:#b45309; font-size:13.5px;">⚡ Thử thách ${idx + 1}:</b>
        <p>${qItem.q}</p>
        <div class="milo-options-grid">
          ${(qItem.options || []).map((opt) => `
            <button type="button" class="milo-choice-btn" data-correct="${opt === qItem.correct}">
              ${opt}
            </button>
          `).join("")}
        </div>
        <div class="milo-feedback-pill">
          🎉 Bingo! +10 điểm xuất sắc! ⭐⭐⭐
        </div>
      </div>
    `).join("");

    // Writing Template Chips HTML
    const writingTemplatesHtml = (unitData.writingTemplates || [
      `On Monday, I study ${vocabList[0]?.term || 'math'}.`,
      `In the morning, I have ${vocabList[1]?.term || 'science'}.`,
      `My favourite subject is ${vocabList[0]?.term || 'English'}.`
    ]).map((tmpl) => `
      <button type="button" class="milo-choice-btn" style="padding:7px 14px; font-size:13px; border-radius:14px;" data-template="${tmpl.replace(/^Template \d+: /, '')}">
        📝 ${tmpl.replace(/^Template \d+: /, '')}
      </button>
    `).join("");

    const stepperTabsHtml = STAGES.map((s) => `
      <button type="button" class="milo-tab-node ${s.num === activeStage ? 'active' : ''}" data-step="${s.num}">
        <span>${s.icon}</span> ${s.name}
      </button>
    `).join("");

    existing.innerHTML = `
      <!-- 1. FULL WIDTH CLEAN HEADER WITH DEDICATED VIETNAMESE AI BUTTON & EXIT BUTTONS -->
      <div class="milo-clean-header">
        <div class="milo-clean-title-group" style="display: flex; align-items: center; gap: 12px;">
          <a href="index.html?view=journey" class="milo-btn-exit-journey" id="miloHeaderExitBtn" title="Quay lại Bản đồ Hành trình" aria-label="Thoát bài học">
            <span style="font-size: 15px; font-weight: 900;">✕</span> <span>Thoát</span>
          </a>
          <span class="milo-unit-badge-pill">LỚP ${unitData.grade || 2} · UNIT ${unitData.unit}</span>
          <h3 class="milo-unit-main-heading">${unitData.title}</h3>
        </div>
        <div class="milo-header-actions">
          <button type="button" class="milo-btn-vn-teacher" id="miloOpenVnTeacherModalBtn">
            👩‍🏫 Cô Giáo AI Tiếng Việt
          </button>
          <button type="button" class="milo-choice-btn" id="miloVipHeaderBtn" data-action="open-vip-plans" data-open-vip-plans style="background:linear-gradient(135deg,#7c3aed,#ec4899); color:#fff; font-weight:800; border:none; padding:8px 16px; border-radius:12px; box-shadow:0 6px 14px rgba(124,58,237,0.3); cursor:pointer;">
            👑 Gói VIP PRO MAX
          </button>
          <button type="button" id="miloTopUpdateBadgeBtn" style="background:linear-gradient(135deg,#059669,#10b981); color:#fff; font-weight:800; border:none; padding:8px 14px; border-radius:12px; box-shadow:0 4px 12px rgba(16,185,129,0.35); cursor:pointer; display:${window.MiloUpdater && window.MiloUpdater.hasUpdate && window.MiloUpdater.hasUpdate() ? 'inline-flex' : 'none'}; align-items:center; gap:6px;">
            🔔 Cập nhật (V60.25.0)
          </button>
          <span class="milo-stage-progress-badge" id="miloStageProgressBadge">
            ⭐ Trạm ${activeStage} / 7: ${STAGES[activeStage - 1].name}
          </span>
          <button type="button" class="milo-btn-fullscreen-toggle" id="miloFullscreenToggleBtn">
            ⛶ Toàn Màn Hình
          </button>
          <a href="index.html?view=journey" class="milo-btn-exit-top" id="miloHeaderCloseBtn" title="Đóng bài học, quay lại Hành trình" aria-label="Đóng bài học">
            ✕
          </a>
        </div>
      </div>

      <!-- 2. TACTILE 3D STEPPER TRACK -->
      <div class="milo-stepper-track">
        ${stepperTabsHtml}
      </div>

      <!-- STAGE 1: WARM-UP & BIG QUESTION -->
      <div class="milo-stage-panel ${activeStage === 1 ? 'active' : ''}" data-stage="1">
        <div class="milo-hero-welcome-card">
          <div class="milo-big-mascot-avatar">🦊</div>
          <h3>${unitData.title}</h3>
          <p>👉 ${unitData.vi || unitData.theme || ""}</p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="milo-btn-3d-green" id="miloWarmupSpeakBtn" style="padding: 14px 34px; font-size: 16px;">
              🔊 Bắt Đầu Bài Học Cùng Cô Milo
            </button>
            <button type="button" class="milo-btn-vn-teacher" id="miloWarmupVnAiBtn" style="padding: 14px 26px; font-size: 15px;">
              👩‍🏫 Cô Giáo AI Giảng Tiếng Việt
            </button>
            <button type="button" class="milo-btn-ai-incontext" id="miloWarmupAiBtn" style="padding: 14px 24px; font-size: 15px;">
              🤖 Khám Phá Chủ Đề
            </button>
          </div>
          <div class="milo-ai-instant-card" id="miloWarmupAiDrawer"></div>
        </div>
        <div class="milo-footer-nav-row">
          <span></span>
          <button type="button" class="milo-btn-footer-next" id="miloStage1NextBtn">
            Khám Phá Từ Vựng ➔
          </button>
        </div>
      </div>

      <!-- STAGE 2: EXPANSIVE 2-COLUMN VOCABULARY STUDIO WITH VIETNAMESE AI -->
      <div class="milo-stage-panel ${activeStage === 2 ? 'active' : ''}" data-stage="2">
        <div class="milo-vocab-selector-row">
          ${wordChipsHtml}
        </div>

        <div class="milo-vocab-duo-stage">
          <!-- Left: Big 3D Card -->
          <div class="milo-vocab-image-box">
            <img id="miloVocab3DImg" src="${currentWord.flashcard3D || 'assets/lessons/milo_school_fun_1786937097491.jpg'}" alt="${currentWord.term}">
            <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
              <button type="button" class="milo-btn-3d-blue" id="miloVocabNativeSpeakBtn" style="flex: 1; justify-content: center; font-size: 14.5px;">
                🔊 Phát Âm
              </button>
              <button type="button" class="milo-btn-ai-vn-direct" id="miloVocabSpeakVnDirectBtn" style="padding: 8px 14px; font-size: 13.5px;">
                🇻🇳 Tiếng Việt
              </button>
              <button type="button" class="milo-btn-ai-incontext" id="miloVocabInstantAiBtn" style="padding: 8px 14px; font-size: 13.5px;">
                🤖 Hỏi AI
              </button>
            </div>
          </div>

          <!-- Right: Pedagogical Details -->
          <div class="milo-vocab-info-box">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <h2 class="milo-vocab-big-word" id="miloVocabMainTermHeading">${currentWord.term}</h2>
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="milo-btn-vn-teacher" id="miloVocabAskTeacherBtn" style="padding: 6px 12px; font-size: 12.5px;">
                    👩‍🏫 Cô Giáo AI
                  </button>
                  <button type="button" class="milo-btn-ai-incontext" id="miloVocabInstantAiBtn2" style="padding: 6px 12px; font-size: 12.5px;">
                    🤖 Phân Tích
                  </button>
                </div>
              </div>
              <div class="milo-vocab-meta-pills">
                <span class="milo-pill-syllable" id="miloVocabSyllableBadge">Âm tiết: ${currentWord.syllables || currentWord.term}</span>
                <span class="milo-pill-ipa" id="miloVocabIpaBadge">${currentWord.ipa || `/${currentWord.term}/`}</span>
              </div>
              <h3 class="milo-vocab-meaning" id="miloVocabMeaningHeading">👉 ${currentWord.meaning}</h3>
            </div>

            <!-- Instant In-Context AI Drawer -->
            <div class="milo-ai-instant-card" id="miloAiWordInstantDrawer"></div>

            <!-- Phonics Tip -->
            <div class="milo-context-sentence-box" style="border-left-color: #0284c7;">
              <b style="color: #0369a1;">💡 Mẹo Khẩu Hình & Đánh Vần:</b>
              <p id="miloVocabPhonicsTip" style="font-weight: 600;">${currentWord.phonicsTip || `Lắng nghe cô Milo phát âm mẫu: ${currentWord.syllables || currentWord.term}.`}</p>
              <button type="button" class="milo-choice-btn" id="miloVocabSlowSpeakBtn" style="margin-top: 6px; padding: 6px 14px; font-size: 13px;">
                🐢 Đọc Chậm Từng Âm
              </button>
            </div>

            <!-- Applied Sentence 1 with Instant AI & VN Voice -->
            <div class="milo-context-sentence-box">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <b>💬 Câu Ví Dụ Bài Học:</b>
                <button type="button" class="milo-btn-ai-incontext" id="miloVocabEx1AiBtn" style="padding: 3px 8px; font-size: 11px;">🤖 AI Phân Tích</button>
              </div>
              <p id="miloVocabExampleSentence">
                "${currentWord.exampleSentence || `I like learning ${currentWord.term}.`}"<br>
                <small>👉 ${currentWord.exampleVi || `Tôi thích học từ ${currentWord.meaning}.`}</small>
              </p>
              <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                <button type="button" class="milo-choice-btn" id="miloVocabExampleSpeakBtn" style="padding: 5px 12px; font-size: 12px; color: #047857; border-color: #a7f3d0;">
                  🔊 Nghe Câu Ví Dụ 1
                </button>
                <button type="button" class="milo-choice-btn" id="miloVocabExampleVnSpeakBtn" style="padding: 5px 12px; font-size: 12px; color: #be123c; border-color: #fecdd3;">
                  🇻🇳 Nghe Tiếng Việt
                </button>
                <button type="button" class="milo-choice-btn" id="miloVocabEx1ScorerBtn" style="padding: 5px 12px; font-size: 12px; color: #7c3aed; border-color: #ddd6fe;">
                  🎙️ Chấm Điểm Đọc
                </button>
              </div>
            </div>

            <!-- Applied Sentence 2 with Instant AI & VN Voice -->
            <div class="milo-context-sentence-box" style="border-left-color: #0ea5e9;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <b style="color: #0284c7;">🌟 Câu Vận Dụng Đời Sống:</b>
                <button type="button" class="milo-btn-ai-incontext" id="miloVocabEx2AiBtn" style="padding: 3px 8px; font-size: 11px;">🤖 AI Phân Tích</button>
              </div>
              <p id="miloVocabAppliedSentence2">
                "${currentWord.appliedSentence2 || `We use ${currentWord.term} in daily conversation.`}"<br>
                <small>👉 ${currentWord.appliedVi2 || `Chúng ta dùng từ ${currentWord.meaning} trong đời sống.`}</small>
              </p>
              <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                <button type="button" class="milo-choice-btn" id="miloVocabApplied2SpeakBtn" style="padding: 5px 12px; font-size: 12px; color: #0369a1; border-color: #bae6fd;">
                  🔊 Nghe Câu Vận Dụng 2
                </button>
                <button type="button" class="milo-choice-btn" id="miloVocabApplied2VnSpeakBtn" style="padding: 5px 12px; font-size: 12px; color: #be123c; border-color: #fecdd3;">
                  🇻🇳 Nghe Tiếng Việt
                </button>
                <button type="button" class="milo-choice-btn" id="miloVocabEx2ScorerBtn" style="padding: 5px 12px; font-size: 12px; color: #7c3aed; border-color: #ddd6fe;">
                  🎙️ Chấm Điểm Đọc
                </button>
              </div>
            </div>

            <!-- Voice Practice -->
            <div>
              <button type="button" class="milo-btn-3d-purple" id="miloVocabMicPracticeBtn" style="width: 100%; justify-content: center; font-size: 15px;">
                🎙️ Bé Luyện Đọc & Chấm Điểm AI ⭐ (Nhận 10 Sao)
              </button>
            </div>
          </div>
        </div>

        <div class="milo-footer-nav-row">
          <button type="button" class="milo-btn-footer-prev" id="miloVocabPrevBtn" style="visibility: ${activeWordIdx > 0 ? 'visible' : 'hidden'};">
            ⬅ ${vocabList[Math.max(0, activeWordIdx - 1)]?.term || ''}
          </button>
          <button type="button" class="milo-btn-footer-next" id="miloVocabNextBtn">
            ${activeWordIdx < vocabList.length - 1 ? `Tiếp: "${vocabList[activeWordIdx + 1]?.term}" ➔` : `✓ Xong 16 từ! Sang Trạm 3 ➔`}
          </button>
        </div>
      </div>

      <!-- STAGE 3: COMIC SENTENCES & INSTANT AI ON EVERY ROW -->
      <div class="milo-stage-panel ${activeStage === 3 ? 'active' : ''}" data-stage="3">
        <div class="milo-card-box">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <h4 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">
              💬 MẪU CÂU GIAO TIẾP CỐT LÕI
            </h4>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="milo-btn-vn-teacher" id="miloGrammarAskTeacherBtn">
                👩‍🏫 Cô Giáo AI Giảng Mẫu Câu
              </button>
              <button type="button" class="milo-btn-ai-incontext" id="miloGrammarAiAskBtn">
                🤖 Phân Tích Cấu Trúc
              </button>
            </div>
          </div>

          <!-- Instant Sentence AI Drawer -->
          <div class="milo-ai-instant-card" id="miloAiSentenceInstantDrawer"></div>

          <!-- Comic Chat Dialogues -->
          <div class="milo-comic-chat-container">
            <div class="milo-comic-bubble-row">
              <div class="milo-comic-avatar">🦊</div>
              <div class="milo-comic-speech-bubble left">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                  <b>Milo hỏi:</b>
                  <button type="button" class="milo-btn-ai-incontext" style="padding: 2px 6px; font-size: 10.5px;" data-ai-sentence="${askSentence}" data-ai-vi="Hỏi về bài học" data-ai-context="Hội thoại">🤖 AI</button>
                </div>
                <p>"${askSentence}"</p>
                <small>👉 Hỏi về hoạt động bài học</small>
              </div>
            </div>
            <div class="milo-comic-bubble-row right">
              <div class="milo-comic-avatar student">👧</div>
              <div class="milo-comic-speech-bubble right">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                  <b>Bé trả lời:</b>
                  <button type="button" class="milo-btn-ai-incontext" style="padding: 2px 6px; font-size: 10.5px;" data-ai-sentence="${answerSentence}" data-ai-vi="Câu trả lời" data-ai-context="Hội thoại">🤖 AI</button>
                </div>
                <p>"${answerSentence}"</p>
                <small>👉 Câu trả lời chuẩn xác</small>
              </div>
            </div>
          </div>

          <button type="button" class="milo-btn-3d-blue" id="miloSentenceSpeakBtn" style="margin-bottom: 20px;">
            🔊 Nghe Toàn Bộ Hội Thoại
          </button>

          <!-- Grammar Rule -->
          <div style="background: #eef2ff; border-radius: 18px; padding: 16px 20px; border: 1.5px solid #c7d2fe; margin-bottom: 20px;">
            <b style="color: #3730a3; font-size: 13.5px; display: block; margin-bottom: 4px;">🔑 QUY TẮC NGỮ PHÁP CẦN NHỚ:</b>
            <p style="margin: 0; font-size: 15px; color: #1e1b4b; line-height: 1.55;">${unitData.grammarRule || "Nắm vững công thức và cấu trúc câu."}</p>
          </div>

          <!-- 6 Applied Sentences -->
          <div style="margin-bottom: 20px;">
            <b style="color: #0369a1; font-size: 14.5px; display: block; margin-bottom: 10px;">🌟 6 CÂU VẬN DỤNG THỰC TẾ ĐỜI SỐNG (KÈM GIẢNG GIẢI TIẾNG VIỆT):</b>
            ${appliedGrammarHtml}
          </div>

          <!-- 4 Grammar Exercises -->
          <div style="background: #fffbeb; border-radius: 20px; padding: 20px; border: 2px dashed #f59e0b;">
            <b style="color: #9a3412; font-size: 14.5px; display: block; margin-bottom: 14px;">⚡ BÀI TẬP VẬN DỤNG NGỮ PHÁP:</b>
            ${grammarExercisesHtml}
          </div>
        </div>

        <div class="milo-footer-nav-row">
          <button type="button" class="milo-btn-footer-prev" id="miloStage3PrevBtn">
            ⬅ Quay lại Trạm 2
          </button>
          <button type="button" class="milo-btn-footer-next" id="miloStage3NextBtn">
            Sang Trạm 4: Đọc hiểu ➔
          </button>
        </div>
      </div>

      <!-- STAGE 4: STORY & COMPREHENSION -->
      <div class="milo-stage-panel ${activeStage === 4 ? 'active' : ''}" data-stage="4">
        <div class="milo-card-box">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <h4 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">📚 BÀI ĐỌC HIỂU & CÂU CHUYỆN</h4>
            <span style="font-size: 13.5px; font-weight: 700; color: #0284c7;">Sách: <i>${unitData.readingTitles?.[0] || "Story"}</i> & <i>${unitData.readingTitles?.[1] || "Discovery"}</i></span>
          </div>

          <div style="font-size: 16.5px; line-height: 1.75; color: #1e293b; background: #f8fafc; padding: 20px; border-radius: 18px; border: 1.5px solid #e2e8f0; margin-bottom: 18px; font-weight: 600;">
            "${unitData.sampleReading || "We read and explore the story together with Teacher Milo."}"
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button type="button" class="milo-btn-3d-green" id="miloReadingSpeakBtn">
              🔊 Nghe Toàn Bài
            </button>
            <button type="button" class="milo-choice-btn" id="miloReadingSlowBtn">
              🐢 Nghe Đọc Chậm
            </button>
            <button type="button" class="milo-btn-vn-teacher" id="miloReadingVnExplainBtn">
              👩‍🏫 Cô Milo Dịch & Giảng Bài Đọc
            </button>
            <button type="button" class="milo-btn-3d-purple" id="miloReadingScorerBtn">
              🎙️ Bé Luyện Đọc Bài & Chấm Điểm AI ⭐
            </button>
          </div>

          <!-- 4 Reading Exercises -->
          <div style="background: #f0fdf4; border-radius: 20px; padding: 20px; border: 2px dashed #10b981;">
            <b style="color: #065f46; font-size: 14.5px; display: block; margin-bottom: 14px;">🔎 BÀI TẬP ĐỌC HIỂU NỘI DUNG:</b>
            ${readingExercisesHtml}
          </div>
        </div>

        <div class="milo-footer-nav-row">
          <button type="button" class="milo-btn-footer-prev" id="miloStage4PrevBtn">
            ⬅ Quay lại Trạm 3
          </button>
          <button type="button" class="milo-btn-footer-next" id="miloStage4NextBtn">
            Sang Trạm 5: Luyện nói ➔
          </button>
        </div>
      </div>

      <!-- STAGE 5: COMIC ROLE-PLAY & TPR ACTION WITH AI -->
      <div class="milo-stage-panel ${activeStage === 5 ? 'active' : ''}" data-stage="5">
        <div class="milo-card-box">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <h4 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">
              🗣️ ĐÓNG VAI PHẢN XẠ CÙNG BẠN MILO
            </h4>
            <button type="button" class="milo-btn-vn-teacher" id="miloDialogueVnCoachBtn">
              👩‍🏫 Cô Milo Hướng Dẫn Hội Thoại
            </button>
          </div>

          <!-- Comic Dialogue Bubbles with AI Chips -->
          <div class="milo-comic-chat-container">
            <div class="milo-comic-bubble-row">
              <div class="milo-comic-avatar">🦊</div>
              <div class="milo-comic-speech-bubble left">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <b>Milo:</b>
                  <button type="button" class="milo-btn-ai-incontext" style="padding: 2px 6px; font-size: 10.5px;" data-ai-sentence="${unitData.dialogue?.[0]?.en || askSentence}" data-ai-vi="${unitData.dialogue?.[0]?.vi || 'Milo hỏi'}" data-ai-context="Hội thoại TPR">🤖 AI</button>
                </div>
                <p>"${unitData.dialogue?.[0]?.en || askSentence}"</p>
                <small>👉 ${unitData.dialogue?.[0]?.vi || "Milo hỏi"}</small>
              </div>
            </div>
            <div class="milo-comic-bubble-row right">
              <div class="milo-comic-avatar student">👧</div>
              <div class="milo-comic-speech-bubble right">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <b>Bé:</b>
                  <button type="button" class="milo-btn-ai-incontext" style="padding: 2px 6px; font-size: 10.5px;" data-ai-sentence="${unitData.dialogue?.[1]?.en || answerSentence}" data-ai-vi="${unitData.dialogue?.[1]?.vi || 'Bé trả lời'}" data-ai-context="Hội thoại TPR">🤖 AI</button>
                </div>
                <p>"${unitData.dialogue?.[1]?.en || answerSentence}"</p>
                <small>👉 ${unitData.dialogue?.[1]?.vi || "Bé trả lời"}</small>
              </div>
            </div>
            <div class="milo-comic-bubble-row">
              <div class="milo-comic-avatar">🦊</div>
              <div class="milo-comic-speech-bubble left">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <b>Milo:</b>
                  <button type="button" class="milo-btn-ai-incontext" style="padding: 2px 6px; font-size: 10.5px;" data-ai-sentence="${unitData.dialogue?.[2]?.en || 'That sounds wonderful!'}" data-ai-vi="${unitData.dialogue?.[2]?.vi || 'Tuyệt vời!'}" data-ai-context="Hội thoại TPR">🤖 AI</button>
                </div>
                <p>"${unitData.dialogue?.[2]?.en || "That sounds wonderful!"}"</p>
                <small>👉 ${unitData.dialogue?.[2]?.vi || "Tuyệt vời!"}</small>
              </div>
            </div>
            <div class="milo-comic-bubble-row right">
              <div class="milo-comic-avatar student">👧</div>
              <div class="milo-comic-speech-bubble right">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <b>Bé:</b>
                  <button type="button" class="milo-btn-ai-incontext" style="padding: 2px 6px; font-size: 10.5px;" data-ai-sentence="${unitData.dialogue?.[3]?.en || `I love learning ${vocabList[0]?.term || 'English'}!`}" data-ai-vi="${unitData.dialogue?.[3]?.vi || 'Bé đối đáp'}" data-ai-context="Hội thoại TPR">🤖 AI</button>
                </div>
                <p>"${unitData.dialogue?.[3]?.en || `I love learning ${vocabList[0]?.term || 'English'}!`}"</p>
                <small>👉 ${unitData.dialogue?.[3]?.vi || "Bé đối đáp tự tin"}</small>
              </div>
            </div>
          </div>

          <!-- TPR Body Action -->
          <div style="background: #fef08a; border-radius: 18px; padding: 16px 20px; border: 1.5px solid #facc15; margin-bottom: 18px;">
            <b style="color: #854d0e; font-size: 13.5px;">💃 HƯỚNG DẪN VẬN ĐỘNG CƠ THỂ (TPR ACTION):</b>
            <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #713f12;">${unitData.tprAction || "👉 Bé đứng thẳng, vỗ tay và diễn hoạt theo từng câu thoại cùng bạn Milo!"}</p>
          </div>

          <button type="button" class="milo-btn-3d-purple" id="miloSpeakingPracticeBtn" style="padding: 13px 28px; font-size: 15.5px;">
            🎙️ Bé Luyện Nói & Tự Chấm Điểm 10/10
          </button>
        </div>

        <div class="milo-footer-nav-row">
          <button type="button" class="milo-btn-footer-prev" id="miloStage5PrevBtn">
            ⬅ Quay lại Trạm 4
          </button>
          <button type="button" class="milo-btn-footer-next" id="miloStage5NextBtn">
            Sang Trạm 6: Câu đố ➔
          </button>
        </div>
      </div>

      <!-- STAGE 6: 3D QUIZ ARENA & WRITING SANDBOX -->
      <div class="milo-stage-panel ${activeStage === 6 ? 'active' : ''}" data-stage="6">
        <div class="milo-card-box">
          <h4 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 900; color: #0f172a;">
            🎮 ĐẤU TRƯỜNG CÂU ĐỐ 3D & LUYỆN VIẾT
          </h4>

          <!-- 5 Quiz Cards -->
          <div style="margin-bottom: 22px;">
            ${quiz3DHtml}
          </div>

          <!-- Writing Box with Clickable Templates -->
          <div style="background: #f8fafc; border-radius: 20px; padding: 20px; border: 2px solid #e2e8f0;">
            <b style="color: #0369a1; font-size: 14.5px; display: block; margin-bottom: 6px;">✍️ NHIỆM VỤ LUYỆN VIẾT:</b>
            <p style="margin: 0 0 12px 0; font-size: 15px; color: #1e293b;">${unitData.writing || "Viết 3 câu về chủ đề bài học."}</p>

            <span style="font-size: 13px; font-weight: 800; color: #64748b;">Bấm vào mẫu để chèn câu vận dụng:</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 12px 0;">
              ${writingTemplatesHtml}
            </div>

            <textarea id="miloWritingTextarea" style="width: 100%; min-height: 110px; border: 2px solid #cbd5e1; border-radius: 16px; padding: 14px 16px; font-size: 15.5px; font-family: inherit; box-sizing: border-box; resize: vertical;" placeholder="Write your English sentences here..."></textarea>
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
              <span id="miloWritingWordCount" style="font-size: 13.5px; color: #64748b; font-weight: 800;">0 từ</span>
              <button type="button" class="milo-btn-3d-green" id="miloSaveWritingBtn" style="padding: 9px 20px; font-size: 13.5px;">
                💾 Lưu Bài Viết
              </button>
            </div>
          </div>
        </div>

        <div class="milo-footer-nav-row">
          <button type="button" class="milo-btn-footer-prev" id="miloStage6PrevBtn">
            ⬅ Quay lại Trạm 5
          </button>
          <button type="button" class="milo-btn-footer-next" id="miloStage6NextBtn">
            Sang Trạm 7: Nhận thưởng ➔
          </button>
        </div>
      </div>

      <!-- STAGE 7: 5-STAR PODIUM & PROJECT -->
      <div class="milo-stage-panel ${activeStage === 7 ? 'active' : ''}" data-stage="7">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%); border-radius: 28px; padding: 36px; color: white; text-align: center; box-shadow: 0 16px 40px rgba(124, 58, 237, 0.25);">
          <div style="font-size: 68px; animation: miloWiggle 3s infinite;">🏆</div>
          <h3 style="margin: 12px 0 8px 0; font-size: 26px; font-weight: 900;">BỤC VINH QUANG 5 SAO XUẤT SẮC!</h3>
          
          <div style="background: rgba(255,255,255,0.18); border-radius: 20px; padding: 16px 24px; margin: 18px 0; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 15.5px;"><b>🎨 Dự án vận dụng:</b> ${unitData.project || "Thực hành giao tiếp sáng tạo cùng bạn bè"}</p>
            <p style="margin: 0; font-size: 15.5px;"><b>⭐ Giá trị sống:</b> ${unitData.value || "Learn and grow every day"}</p>
          </div>

          <div style="display: flex; justify-content: center; gap: 14px; font-size: 36px; margin-bottom: 24px;">
            <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
          </div>

          <button type="button" class="milo-btn-3d-green" id="miloClaimStarsBtn" style="background: #ffffff; color: #7c3aed; border-bottom-color: #cbd5e1; padding: 15px 38px; font-size: 17px;">
            ✨ BÉ NHẬN 5 SAO VÀNG
          </button>
        </div>

        <div class="milo-footer-nav-row">
          <button type="button" class="milo-btn-footer-prev" id="miloStage7PrevBtn">
            ⬅ Quay lại Trạm 6
          </button>
          <span></span>
        </div>
      </div>
    `;

    // Bind Header Actions
    existing.querySelector("#miloFullscreenToggleBtn")?.addEventListener("click", toggleFullscreenTheater);
    existing.querySelector("#miloOpenVnTeacherModalBtn")?.addEventListener("click", () => openVietnameseAiTeacherModal(unitData));
    existing.querySelector("#miloTopUpdateBadgeBtn")?.addEventListener("click", () => {
      if (window.MiloUpdater && typeof window.MiloUpdater.openModal === "function") {
        window.MiloUpdater.openModal();
      }
    });
    existing.querySelector("#miloVipHeaderBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.SubscriptionUI && typeof window.SubscriptionUI.openPlans === "function") {
        window.SubscriptionUI.openPlans({ source: "visual-tutor-header" });
      } else if (window.MiloSubscriptionUI && typeof window.MiloSubscriptionUI.openPlans === "function") {
        window.MiloSubscriptionUI.openPlans({ source: "visual-tutor-header" });
      } else if (window.MILO_COMMERCE?.openVipPlans) {
        window.MILO_COMMERCE.openVipPlans({ source: "visual-tutor-header" });
      } else {
        const modal = document.querySelector("#premiumPaymentModal");
        if (modal) {
          modal.classList.remove("hidden");
        }
      }
    });

    // Bind Stepper Tabs
    existing.querySelectorAll(".milo-tab-node").forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = Number(btn.dataset.step);
        setStage(step);
      });
    });

    // Bind Footer Navigation Buttons
    existing.querySelector("#miloStage1NextBtn")?.addEventListener("click", () => setStage(2));
    existing.querySelector("#miloStage3PrevBtn")?.addEventListener("click", () => setStage(2));
    existing.querySelector("#miloStage3NextBtn")?.addEventListener("click", () => setStage(4));
    existing.querySelector("#miloStage4PrevBtn")?.addEventListener("click", () => setStage(3));
    existing.querySelector("#miloStage4NextBtn")?.addEventListener("click", () => setStage(5));
    existing.querySelector("#miloStage5PrevBtn")?.addEventListener("click", () => setStage(4));
    existing.querySelector("#miloStage5NextBtn")?.addEventListener("click", () => setStage(6));
    existing.querySelector("#miloStage6PrevBtn")?.addEventListener("click", () => setStage(5));
    existing.querySelector("#miloStage6NextBtn")?.addEventListener("click", () => setStage(7));
    existing.querySelector("#miloStage7PrevBtn")?.addEventListener("click", () => setStage(6));

    // Bind Word Chips
    existing.querySelectorAll(".milo-word-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        activeWordIdx = Number(chip.dataset.wordIdx);
        updateVocabFocusView(unitData);
        const w = vocabList[activeWordIdx];
        if (w) playBilingual(w.term, w.meaning);
      });
    });

    // Bind Vocabulary Prev / Next Controls
    existing.querySelector("#miloVocabPrevBtn")?.addEventListener("click", () => {
      if (activeWordIdx > 0) {
        activeWordIdx--;
        updateVocabFocusView(unitData);
        const w = vocabList[activeWordIdx];
        if (w) playBilingual(w.term, w.meaning);
      }
    });

    existing.querySelector("#miloVocabNextBtn")?.addEventListener("click", () => {
      if (activeWordIdx < vocabList.length - 1) {
        activeWordIdx++;
        updateVocabFocusView(unitData);
        const w = vocabList[activeWordIdx];
        if (w) playBilingual(w.term, w.meaning);
      } else {
        setStage(3);
      }
    });

    // Bind Instant AI Word Buttons
    const triggerWordAi = () => {
      const w = vocabList[activeWordIdx];
      if (w) showInstantAiWordDrawer(w);
    };
    existing.querySelector("#miloVocabInstantAiBtn")?.addEventListener("click", triggerWordAi);
    existing.querySelector("#miloVocabInstantAiBtn2")?.addEventListener("click", triggerWordAi);
    existing.querySelector("#miloVocabAskTeacherBtn")?.addEventListener("click", () => openVietnameseAiTeacherModal(unitData));

    existing.querySelector("#miloVocabSpeakVnDirectBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) playVietnameseOnly(`Từ ${w.term} nghĩa là ${w.meaning}`);
    });

    existing.querySelector("#miloVocabExampleVnSpeakBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) playVietnameseOnly(w.exampleVi || `Tôi thích học từ ${w.meaning}`);
    });

    existing.querySelector("#miloVocabApplied2VnSpeakBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) playVietnameseOnly(w.appliedVi2 || `Chúng ta dùng từ ${w.meaning} trong đời sống`);
    });

    existing.querySelector("#miloVocabEx1AiBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) showInstantAiSentenceDrawer(w.exampleSentence || w.term, w.exampleVi || w.meaning, "Ví dụ bài học");
    });
    existing.querySelector("#miloVocabEx2AiBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) showInstantAiSentenceDrawer(w.appliedSentence2 || w.term, w.appliedVi2 || w.meaning, "Vận dụng đời sống");
    });

    // Bind Audio Actions
    existing.querySelector("#miloVocabNativeSpeakBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) playBilingual(w.term, w.meaning, 0.82);
    });

    existing.querySelector("#miloVocabSlowSpeakBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) playSlowWord(w.term);
    });

    existing.querySelector("#miloVocabExampleSpeakBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) playBilingual(w.exampleSentence || w.term, w.exampleVi || w.meaning);
    });

    existing.querySelector("#miloVocabEx1ScorerBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) openReadingScorer(w.exampleSentence || w.term, w.exampleVi || w.meaning, "", "Luyện Đọc Câu Ví Dụ 1");
    });

    existing.querySelector("#miloVocabEx2ScorerBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) openReadingScorer(w.appliedSentence2 || w.term, w.appliedVi2 || w.meaning, "", "Luyện Đọc Câu Vận Dụng 2");
    });

    existing.querySelector("#miloVocabMicPracticeBtn")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) {
        openReadingScorer(w.term, w.meaning, w.ipa || `/${w.term}/`, "Từ Vựng Trọng Tâm");
      }
    });

    existing.querySelector("#miloReadingScorerBtn")?.addEventListener("click", () => {
      const sample = unitData.sampleReading || "We learn and practice English every day.";
      openReadingScorer(sample, "Bài đọc hiểu Unit " + (unitData.unit || 1), "", "Luyện Đọc Toàn Bài");
    });

    existing.querySelector("#miloSpeakingPracticeBtn")?.addEventListener("click", () => {
      const target = answerSentence || unitData.pattern?.[1] || "I study English every day.";
      openReadingScorer(target, "Câu đối thoại mẫu", "", "Luyện Nói & Đối Thoại");
    });

    // Click 3D Image to Speak
    existing.querySelector("#miloVocab3DImg")?.addEventListener("click", () => {
      const w = vocabList[activeWordIdx];
      if (w) playBilingual(w.term, w.meaning);
    });

    // Stage 1 & Stage 3 Actions
    existing.querySelector("#miloWarmupSpeakBtn")?.addEventListener("click", () => {
      playBilingual(unitData.title || "", unitData.vi || "");
    });
    existing.querySelector("#miloWarmupVnAiBtn")?.addEventListener("click", () => openVietnameseAiTeacherModal(unitData));

    existing.querySelector("#miloWarmupAiBtn")?.addEventListener("click", () => {
      const drawer = document.getElementById("miloWarmupAiDrawer");
      if (drawer) {
        drawer.innerHTML = `
          <div class="milo-ai-instant-header">
            <div class="milo-ai-instant-header-title">
              <span>🤖</span> GIA SƯ AI MILO: KHÁM PHÁ CHỦ ĐỀ
            </div>
            <button type="button" class="milo-ai-instant-close-btn" onclick="this.closest('.milo-ai-instant-card').classList.remove('open')">✖</button>
          </div>
          <div class="milo-ai-instant-body" style="text-align: left;">
            <p><b>🌟 Mục tiêu bài học:</b> Trong Unit ${unitData.unit} (${unitData.title}), con sẽ cùng cô Milo làm chủ 16 từ vựng chủ đề <i>"${unitData.vi || unitData.theme}"</i>, nắm vững mẫu câu giao tiếp và tham gia 5 thử thách câu đố 3D!</p>
            <p><b>🦊 Lời nhắn từ Milo:</b> "Let's explore English together and earn 5 golden stars!"</p>
          </div>
        `;
        drawer.classList.add("open");
        playVietnameseOnly(`Chào mừng con đến với bài học Unit ${unitData.unit}. Chủ đề là: ${unitData.vi || unitData.theme}`);
      }
    });

    existing.querySelector("#miloSentenceSpeakBtn")?.addEventListener("click", () => {
      playBilingual(`${askSentence} ${answerSentence}`, "Luyện mẫu câu giao tiếp cùng cô giáo Milo!");
    });

    existing.querySelector("#miloGrammarAskTeacherBtn")?.addEventListener("click", () => openVietnameseAiTeacherModal(unitData));
    existing.querySelector("#miloGrammarAiAskBtn")?.addEventListener("click", () => {
      showInstantAiSentenceDrawer(
        `${askSentence} - ${answerSentence}`,
        `Cặp câu hỏi và trả lời cốt lõi của Unit ${unitData.unit}`,
        "Ngữ pháp trọng tâm"
      );
    });

    // Generic Play Audio Buttons
    existing.querySelectorAll("button[data-speak-en]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const en = btn.dataset.speakEn;
        const vi = btn.dataset.speakVi;
        playBilingual(en, vi);
      });
    });

    // Generic Speak Vietnamese Only Buttons
    existing.querySelectorAll("button[data-speak-vn-only]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const vi = btn.dataset.speakVnOnly;
        playVietnameseOnly(vi);
      });
    });

    // Generic In-Context AI Sentence Buttons
    existing.querySelectorAll("button[data-ai-sentence]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const en = btn.dataset.aiSentence;
        const vi = btn.dataset.aiVi;
        const ctx = btn.dataset.aiContext || "Giao tiếp";
        showInstantAiSentenceDrawer(en, vi, ctx);
      });
    });

    // Interactive Choice Buttons
    existing.querySelectorAll(".milo-choice-btn[data-correct]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const parentCard = btn.closest(".milo-quiz-question-card");
        const feedback = parentCard?.querySelector(".milo-feedback-pill");
        const isCorrect = btn.dataset.correct === "true";

        if (isCorrect) {
          btn.classList.add("correct");
          if (feedback) feedback.style.display = "block";
          playVietnameseOnly("Chính xác tuyệt đối! Bé làm bài rất giỏi!");
        } else {
          btn.classList.add("wrong");
          playVietnameseOnly("Chưa đúng rồi! Bé hãy thử lại một đáp án khác nhé!");
        }
      });
    });

    // Reading Audio & AI
    existing.querySelector("#miloReadingSpeakBtn")?.addEventListener("click", () => {
      playBilingual(unitData.sampleReading || "", "Bé vừa lắng nghe bài đọc hiểu của Unit!");
    });

    existing.querySelector("#miloReadingSlowBtn")?.addEventListener("click", () => {
      if (window.MILO_CUTE_VOICE && typeof window.MILO_CUTE_VOICE.speak === "function") {
        window.MILO_CUTE_VOICE.speak(unitData.sampleReading || "", 0.6, "en-US", { profile: "extra-slow" });
      } else if ("speechSynthesis" in window) {
        const uEn = new SpeechSynthesisUtterance(unitData.sampleReading || "");
        uEn.lang = "en-US";
        uEn.rate = 0.6;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(uEn);
      }
    });

    existing.querySelector("#miloReadingVnExplainBtn")?.addEventListener("click", () => openVietnameseAiTeacherModal(unitData));
    existing.querySelector("#miloReadingScorerBtn")?.addEventListener("click", () => {
      openReadingScorer(unitData.sampleReading || "We explore English with Teacher Milo.", unitData.theme || "Bài đọc hiểu", "", "Bài Đọc Đoạn Văn Unit " + unitData.unit);
    });

    // Dialogue AI Coach
    existing.querySelector("#miloDialogueVnCoachBtn")?.addEventListener("click", () => openVietnameseAiTeacherModal(unitData));

    // Speaking Action
    existing.querySelector("#miloSpeakingPracticeBtn")?.addEventListener("click", () => {
      playVietnameseOnly("Tuyệt vời! Bé nói tiếng Anh rất tự nhiên và trôi chảy mười trên mười!");
    });

    // Writing Sandbox & Template Chips
    const writeArea = existing.querySelector("#miloWritingTextarea");
    const wordCount = existing.querySelector("#miloWritingWordCount");
    const saveKey = `milo-visual-writing-${unitData.grade || 2}-${unitData.unit || 1}`;

    if (writeArea) {
      writeArea.value = localStorage.getItem(saveKey) || "";
      const updateCount = () => {
        const words = writeArea.value.trim() ? writeArea.value.trim().split(/\s+/).length : 0;
        if (wordCount) wordCount.textContent = `${words} từ`;
      };
      writeArea.addEventListener("input", updateCount);
      updateCount();

      existing.querySelectorAll("button[data-template]").forEach((chip) => {
        chip.addEventListener("click", () => {
          const tmpl = chip.dataset.template;
          if (tmpl) {
            if (writeArea.value.trim()) {
              writeArea.value += "\n" + tmpl;
            } else {
              writeArea.value = tmpl;
            }
            updateCount();
            writeArea.focus();
            playVietnameseOnly("Đã chèn mẫu câu vận dụng!");
          }
        });
      });
    }

    existing.querySelector("#miloSaveWritingBtn")?.addEventListener("click", () => {
      if (writeArea) {
        localStorage.setItem(saveKey, writeArea.value);
        playVietnameseOnly("Đã lưu bài viết thành công!");
      }
    });

    // Claim Stars
    existing.querySelector("#miloClaimStarsBtn")?.addEventListener("click", () => {
      playVietnameseOnly("Chúc mừng thiên thần nhỏ đã nhận trọn vẹn 5 sao vàng xuất sắc!");
    });
  }

  async function updateView() {
    const gradeSelect = document.getElementById("gradeSelect");
    const lessonContent = document.getElementById("lessonContent");

    const grade = gradeSelect?.value || new URLSearchParams(location.search).get("grade") || "2";
    const unitNum = resolveUnitNumber();

    if (Number(grade) === 2 || Number(grade) === 3) {
      document.body.classList.add("has-visual-tutor");
      await loadCurriculum();
      const unitData = getUnitData(grade, unitNum);
      if (unitData && lessonContent) {
        renderVisualLesson(lessonContent, unitData);
      }
    } else {
      document.body.classList.remove("has-visual-tutor");
      const existing = document.getElementById("miloVisualLessonBox");
      if (existing) existing.remove();
    }
  }

  function init() {
    activeStage = 1;
    activeWordIdx = 0;
    updateView();
    const gradeSelect = document.getElementById("gradeSelect");
    const unitSelect = document.getElementById("unitSelect");
    gradeSelect?.addEventListener("change", () => {
      activeStage = 1;
      activeWordIdx = 0;
      setTimeout(updateView, 100);
    });
    unitSelect?.addEventListener("change", () => {
      activeStage = 1;
      activeWordIdx = 0;
      setTimeout(updateView, 100);
    });
    window.addEventListener("milo:unit-changed", () => {
      activeStage = 1;
      activeWordIdx = 0;
      updateView();
    });
    window.addEventListener("milo:grade-changed", () => {
      activeStage = 1;
      activeWordIdx = 0;
      updateView();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const activeModals = document.querySelectorAll(".modal:not(.hidden), .milo-vn-teacher-modal-overlay:not(.hidden), #premiumPaymentModal:not(.hidden)");
        if (activeModals.length === 0) {
          window.location.href = "index.html?view=journey";
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.MiloVisualCurriculum = {
    loadCurriculum,
    openVietnameseAiTeacherModal,
    playVietnameseOnly,
    renderVisualLesson,
    resolveUnitNumber,
    setStage,
    showInstantAiWordDrawer,
    showInstantAiSentenceDrawer,
    toggleFullscreenTheater,
    updateVocabFocusView,
    updateView,
    version: "60.70.0"
  };
})();
