(function () {
  "use strict";
  const KEY = "milo-ai-input-language-v60";
  const LAST_KEY = "milo-ai-last-spoken-language-v60";
  const VOICE_KEY = "milo-ai-voice-reply-v60";

  function detect(text) {
    const value = String(text || "");
    const vi = /[À-ỹĐđ]/.test(value) || /\b(con|bé|milo|hãy|đúng|sai|câu|từ|nghĩa|không|vì|là|em|mình)\b/i.test(value);
    const en = /\b(the|a|an|is|are|am|do|does|can|should|what|where|when|how|because|I|you|we|they|my|your)\b/i.test(value);
    if (en && !vi) return "en-US";
    return "vi-VN";
  }

  function mode() {
    return localStorage.getItem(KEY) || "auto";
  }

  function setMode(value) {
    const safe = ["auto", "vi-VN", "en-US"].includes(value) ? value : "auto";
    localStorage.setItem(KEY, safe);
    document.querySelectorAll("[data-ai-language]").forEach((button) => button.classList.toggle("active", button.dataset.aiLanguage === safe));
    document.querySelectorAll("#aiLiveLanguage,#journeyAiLanguage,#lessonAiLiveLanguage").forEach((select) => {
      if ([...select.options].some((option) => option.value === safe)) select.value = safe;
    });
    window.dispatchEvent(new CustomEvent("milo:ai-language-changed", { detail: { mode: safe } }));
    return safe;
  }

  function remember(text) {
    const lang = detect(text);
    localStorage.setItem(LAST_KEY, lang);
    return lang;
  }

  function recognitionLocale(requested = mode(), part = "conversation") {
    if (requested === "vi-VN" || requested === "en-US") return requested;
    const last = localStorage.getItem(LAST_KEY);
    if (last) return last;
    return ["phonics", "pronunciation", "speaking"].includes(String(part || "").toLowerCase()) ? "en-US" : "vi-VN";
  }

  function mountToolbar() {
    const chat = document.querySelector("#view-chat .chat-large");
    if (!chat || document.querySelector("#aiBilingualToolbar")) return;
    const bar = document.createElement("div");
    bar.id = "aiBilingualToolbar";
    bar.className = "ai-bilingual-toolbar";
    bar.innerHTML = `<div><b>🎙️ Hội thoại Việt–Anh</b><small>Chọn ngôn ngữ trước khi bật micro; AI sẽ sửa câu chưa đúng và đọc lại bằng đúng giọng.</small></div><div><button type="button" data-ai-language="auto">Tự động</button><button type="button" data-ai-language="vi-VN">🇻🇳 Tiếng Việt</button><button type="button" data-ai-language="en-US">🇬🇧 English</button><button type="button" data-ai-voice-toggle>🔊 Đọc trả lời</button></div>`;
    chat.querySelector(".chat-input")?.insertAdjacentElement("beforebegin", bar);
    bar.querySelectorAll("[data-ai-language]").forEach((button) => button.onclick = () => setMode(button.dataset.aiLanguage));
    const voiceButton = bar.querySelector("[data-ai-voice-toggle]");
    const refreshVoice = () => {
      const enabled = localStorage.getItem(VOICE_KEY) !== "0";
      voiceButton.classList.toggle("active", enabled);
      voiceButton.textContent = enabled ? "🔊 AI đọc: Bật" : "🔇 AI đọc: Tắt";
    };
    voiceButton.onclick = () => {
      localStorage.setItem(VOICE_KEY, localStorage.getItem(VOICE_KEY) !== "0" ? "0" : "1");
      if (localStorage.getItem(VOICE_KEY) === "0") window.speechSynthesis?.cancel?.();
      refreshVoice();
    };
    refreshVoice();
    setMode(mode());
  }

  const observer = new MutationObserver(mountToolbar);
  function start() {
    mountToolbar();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.MILO_AI_LANGUAGE = {
    detect,
    mode,
    setMode,
    remember,
    recognitionLocale,
    voiceEnabled: () => localStorage.getItem(VOICE_KEY) !== "0",
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
