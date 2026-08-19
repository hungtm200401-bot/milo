(function () {
  const TOTAL_WORDS = 5;
  const TOTAL_QUIZ = 3;
  const quick = {
    mode: "learn",
    wordIndex: 0,
    quizIndex: 0,
    score: 0,
    words: [],
    questions: [],
    heard: false,
    spoken: new Set(),
    reviewCount: 0,
  };

  const $ = (selector) => document.querySelector(selector);

  function getContext() {
    const grade = Number(
      $("#gradeSelect")?.value || localStorage.getItem("milo-grade") || 3,
    );
    const gradeData = window.MILO_CURRICULUM?.[grade];
    const storedUnit = Number(localStorage.getItem(`milo-unit-${grade}`) || 0);
    const unitIndex = Math.max(
      0,
      Math.min(storedUnit, (gradeData?.units?.length || 1) - 1),
    );
    return {
      grade,
      unitIndex,
      unit: gradeData?.units?.[unitIndex],
    };
  }

  function shuffle(items) {
    const output = [...items];
    for (let index = output.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [output[index], output[target]] = [output[target], output[index]];
    }
    return output;
  }

  function speak(text) {
    if (!text) return;
    if (window.MILO_PET_VOICE?.speak) {
      window.MILO_PET_VOICE.speak(text, 0.74);
      return;
    }
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.72;
    utterance.pitch = 1.15;
    window.speechSynthesis.speak(utterance);
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function editDistance(left, right) {
    const rows = Array.from({ length: right.length + 1 }, (_, row) => [row]);
    rows[0] = Array.from({ length: left.length + 1 }, (_, column) => column);
    for (let row = 1; row <= right.length; row += 1) {
      for (let column = 1; column <= left.length; column += 1) {
        rows[row][column] = Math.min(
          rows[row - 1][column] + 1,
          rows[row][column - 1] + 1,
          rows[row - 1][column - 1] +
            (right[row - 1] === left[column - 1] ? 0 : 1),
        );
      }
    }
    return rows[right.length][left.length];
  }

  function isCloseEnough(transcript, target) {
    const heard = normalize(transcript);
    const expected = normalize(target);
    if (!heard || !expected) return false;
    if (heard === expected || heard.includes(expected)) return true;
    const distance = editDistance(heard, expected);
    return 1 - distance / Math.max(heard.length, expected.length) >= 0.72;
  }

  function setFeedback(message = "", tone = "") {
    const feedback = $("#quickFeedback");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `quick-feedback ${tone}`.trim();
  }

  function setPath(stage) {
    document.querySelectorAll("[data-quick-path]").forEach((item) => {
      item.classList.toggle("active", item.dataset.quickPath === stage);
    });
  }

  function currentWord() {
    return quick.words[quick.wordIndex] || ["Hello", "xin chào", "👋"];
  }

  function renderLearn() {
    const word = currentWord();
    quick.mode = "learn";
    quick.heard = false;
    $("#quickLearn")?.classList.remove("hidden");
    $("#quickQuiz")?.classList.add("hidden");
    $("#quickFinish")?.classList.add("hidden");
    if ($("#quickVisual")) {
      $("#quickVisual").textContent = word[2];
      $("#quickVisual").style.animation = "none";
      requestAnimationFrame(() => {
        $("#quickVisual").style.animation = "";
      });
    }
    if ($("#quickWord")) $("#quickWord").textContent = word[0];
    if ($("#quickMeaning")) $("#quickMeaning").textContent = word[1];
    if ($("#quickCount")) {
      $("#quickCount").textContent = `${quick.wordIndex + 1}/${quick.words.length}`;
    }
    if ($("#quickNext")) {
      $("#quickNext").textContent = "Tiếp tục học →";
    }
    $("#quickDetail")?.classList.add("hidden");
    setFeedback("");
    setPath("look");
  }

  function renderReviewPlan() {
    const plan = $("#quickReviewPlan");
    if (!plan) return;
    const freshCount = Math.max(0, quick.words.length - quick.reviewCount);
    plan.textContent = quick.reviewCount
      ? `Ôn lại ${quick.reviewCount} từ cần nhớ · ${freshCount} từ mới`
      : `Hôm nay làm quen ${quick.words.length} từ mới`;
  }

  function hearWord() {
    quick.heard = true;
    setPath("hear");
    setFeedback("Nghe và nhắc lại nhé!", "");
    speak(currentWord()[0]);
  }

  function startSpeaking() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const button = $("#quickSpeak");
    if (!Recognition) {
      setFeedback("Milo chưa nghe trực tiếp trên máy này. Con có thể nghe mẫu rồi gõ lại từ.", "retry");
      $("#quickDetail")?.classList.remove("hidden");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    button?.classList.add("listening");
    if (button) button.textContent = "Đang nghe…";
    setPath("speak");
    setFeedback("Con nói đi…", "");
    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results[0] || []).map(
        (result) => result.transcript,
      );
      const correct = alternatives.some((text) =>
        isCloseEnough(text, currentWord()[0]),
      );
      if (correct) {
        quick.spoken.add(quick.wordIndex);
        setFeedback("Đúng rồi! ⭐", "good");
        $("#quickDetail")?.classList.add("hidden");
        speak("Great job!");
      } else {
        setFeedback("Gần đúng. Nghe lại nhé!", "retry");
        $("#quickDetail")?.classList.remove("hidden");
        setTimeout(() => speak(currentWord()[0]), 350);
      }
    };
    recognition.onerror = () => {
      setFeedback("Milo chưa nghe rõ. Nói lại nhé!", "retry");
      $("#quickDetail")?.classList.remove("hidden");
    };
    recognition.onend = () => {
      button?.classList.remove("listening");
      if (button) button.textContent = "🎤 Con nói";
    };
    try {
      recognition.start();
    } catch {
      recognition.onend();
    }
  }

  function buildQuestions() {
    const context = getContext();
    const pool = context.unit?.words || quick.words;
    return shuffle(quick.words)
      .slice(0, TOTAL_QUIZ)
      .map((answer) => {
        const distractors = shuffle(
          pool.filter((word) => word[0] !== answer[0]),
        ).slice(0, 2);
        return { answer, choices: shuffle([answer, ...distractors]) };
      });
  }

  function nextWord() {
    if (!quick.heard) {
      hearWord();
      setFeedback("Nghe một lần rồi đi tiếp nhé!", "");
      return;
    }
    if (quick.wordIndex < quick.words.length - 1) {
      quick.wordIndex += 1;
      renderLearn();
      return;
    }
    quick.questions = buildQuestions();
    quick.quizIndex = 0;
    quick.score = 0;
    renderQuiz();
  }

  function renderQuiz() {
    quick.mode = "quiz";
    $("#quickLearn")?.classList.add("hidden");
    $("#quickQuiz")?.classList.remove("hidden");
    $("#quickFinish")?.classList.add("hidden");
    const question = quick.questions[quick.quizIndex];
    if (!question) {
      finishQuick();
      return;
    }
    setPath("pick");
    if ($("#quickQuizCount")) {
      $("#quickQuizCount").textContent =
        `${quick.quizIndex + 1}/${quick.questions.length}`;
    }
    if ($("#quickPrompt")) $("#quickPrompt").textContent = question.answer[0];
    const choices = $("#quickChoices");
    if (choices) {
      choices.innerHTML = "";
      question.choices.forEach((word) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quick-choice";
        button.textContent = word[2];
        button.setAttribute("aria-label", word[1]);
        button.onclick = () => choosePicture(button, word);
        choices.appendChild(button);
      });
    }
    setFeedback("Chọn đúng hình", "");
    speak(question.answer[0]);
  }

  function choosePicture(button, selected) {
    const question = quick.questions[quick.quizIndex];
    const buttons = Array.from(document.querySelectorAll(".quick-choice"));
    buttons.forEach((item) => {
      item.disabled = true;
    });
    if (selected[0] === question.answer[0]) {
      quick.score += 1;
      window.MILO_LEARNING_REVIEW?.recordWord?.({
        ...getContext(),
        word: question.answer,
        correct: true,
      });
      button.classList.add("correct");
      setFeedback("Đúng rồi! ⭐", "good");
      speak("Correct!");
    } else {
      window.MILO_LEARNING_REVIEW?.recordWord?.({
        ...getContext(),
        word: question.answer,
        correct: false,
      });
      button.classList.add("wrong");
      const correctIndex = question.choices.findIndex(
        (word) => word[0] === question.answer[0],
      );
      buttons[correctIndex]?.classList.add("correct");
      setFeedback("Đây là hình đúng nhé!", "retry");
      speak(question.answer[0]);
    }
    setTimeout(() => {
      quick.quizIndex += 1;
      renderQuiz();
    }, 900);
  }

  function recordCompletion() {
    const score = Math.round((quick.score / Math.max(quick.questions.length, 1)) * 100);
    const detail = {
      type: "lesson",
      skill: "vocabulary",
      score,
      durationMinutes: 5,
      source: "visual-quick-learn",
      words: quick.words.map((word) => word[0]),
    };
    if (window.MILO_LEARNING?.record) {
      window.MILO_LEARNING.record(detail);
    } else {
      window.dispatchEvent(new CustomEvent("milo:learning-event", { detail }));
    }
    localStorage.setItem("milo-quick-last", new Date().toISOString());
  }

  function finishQuick() {
    quick.mode = "finish";
    $("#quickLearn")?.classList.add("hidden");
    $("#quickQuiz")?.classList.add("hidden");
    $("#quickFinish")?.classList.remove("hidden");
    setPath("done");
    const stars = quick.score === TOTAL_QUIZ ? "⭐⭐⭐" : quick.score >= 2 ? "⭐⭐" : "⭐";
    if ($("#quickStars")) $("#quickStars").textContent = stars;
    if ($("#quickFinishText")) {
      $("#quickFinishText").textContent =
        `${quick.score}/${TOTAL_QUIZ} hình đúng · ${quick.spoken.size} từ đã nói`;
    }
    setFeedback("");
    speak(quick.score >= 2 ? "Amazing! Great job!" : "Good job! Keep going!");
    recordCompletion();
  }

  function startQuick() {
    const context = getContext();
    if (!context.unit?.words?.length) return;
    const reviewPlan = window.MILO_LEARNING_REVIEW?.selectWords?.({
      grade: context.grade,
      unitIndex: context.unitIndex,
      words: context.unit.words,
      limit: TOTAL_WORDS,
    });
    quick.words = reviewPlan?.words || context.unit.words.slice(0, TOTAL_WORDS);
    quick.reviewCount = Number(reviewPlan?.reviewCount) || 0;
    quick.wordIndex = 0;
    quick.quizIndex = 0;
    quick.score = 0;
    quick.spoken = new Set();
    if ($("#quickUnit")) {
      $("#quickUnit").textContent =
        `Lớp ${context.grade} · Unit ${context.unitIndex + 1}`;
    }
    renderReviewPlan();
    renderLearn();
  }

  function setQuickMode(active) {
    document.body.classList.toggle("quick-mode", active);
    if (active) startQuick();
  }

  function bind() {
    $("#quickHear")?.addEventListener("click", hearWord);
    $("#quickSpeak")?.addEventListener("click", startSpeaking);
    $("#quickNext")?.addEventListener("click", nextWord);
    $("#quickReplay")?.addEventListener("click", () => {
      const question = quick.questions[quick.quizIndex];
      speak(question?.answer?.[0]);
    });
    $("#quickRestart")?.addEventListener("click", startQuick);
    $("#quickDetail")?.addEventListener("click", () => {
      window.MILO_PRONUNCIATION_COACH?.open?.(currentWord()[0]);
    });
    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.addEventListener("click", () => {
        setQuickMode(button.dataset.view === "quick");
      });
    });
    $("#gradeSelect")?.addEventListener("change", () => {
      if (!$("#view-quick")?.classList.contains("hidden")) {
        setTimeout(startQuick, 0);
      }
    });
    setQuickMode(!$("#view-quick")?.classList.contains("hidden"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
