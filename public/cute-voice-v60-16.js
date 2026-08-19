(function () {
  "use strict";

  const SETTINGS_KEY = "milo-cute-voice-settings-v60-16";
  const DEFAULTS = { profile: "natural", accent: "en-US", autoRepeat: 1, pause: 150 };
  const PROFILE = {
    "cute-clear": { label: "Dễ thương · chậm rõ", enRate: .74, viRate: .84, enPitch: 1.12, viPitch: 1.04, pause: 175 },
    "gentle-teacher": { label: "Cô giáo dịu dàng", enRate: .80, viRate: .86, enPitch: 1.06, viPitch: 1.02, pause: 145 },
    "natural": { label: "VIP PRO MAX Tự nhiên (Neural)", enRate: .86, viRate: .90, enPitch: 1.02, viPitch: 1.00, pause: 110 },
    "extra-slow": { label: "Siêu chậm cho bé mới học", enRate: .58, viRate: .72, enPitch: 1.08, viPitch: 1.02, pause: 245 }
  };
  const VI_WORDS = new Set("con bé em hãy đúng sai câu từ nghĩa thử lại giải thích phát âm nghe nói đọc viết rất tốt chưa rõ chậm hơn môi lưỡi răng hơi giọng âm đầu cuối nhấn nhịp cùng milo nào nhé rồi một lần nữa".split(" "));
  const EN_WORDS = new Set("a an the i you we they he she it is am are do does did can could should would what where when why how this that these those my your our their hello hi good great excellent try say repeat listen speak word sentence again slowly together because and but or on in at to from with for of".split(" "));
  let queueToken = 0;
  let currentAudio = null;
  const audioCache = new Map();

  const read = () => { try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")) }; } catch { return { ...DEFAULTS }; } };
  const save = (partial) => { const next = { ...read(), ...partial }; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {} return next; };
  
  const clean = (value) => String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`~|]/g, " ")
    .replace(/[🎯✅❌⚠️✨👑✦💡🔊🎤🧭🏆📚👉]/g, " ")
    .replace(/(\d+)\s*\/\s*100\b/g, "$1 trên 100")
    .replace(/\bAI\b/g, "A I")
    .replace(/\bVIP\b/g, "V I P")
    .replace(/\bPRO MAX\b/gi, "Pro Max")
    .replace(/\bUnit\s+(\d+)/gi, "Bài $1")
    .replace(/\s+/g, " ").trim();

  function detectLanguage(text, fallback = "vi-VN") {
    const value = String(text || "");
    if (/[À-ỹĐđ]/.test(value)) return "vi-VN";
    const tokens = (value.toLowerCase().match(/[a-z]+/g) || []);
    if (!tokens.length) return fallback;
    let vi = 0, en = 0;
    tokens.forEach((word) => { if (VI_WORDS.has(word)) vi += 2; if (EN_WORDS.has(word)) en += 2; });
    if (en > vi) return "en-US";
    if (vi > en) return "vi-VN";
    return fallback;
  }

  function segmentInput(input, fallback = "vi-VN") {
    if (Array.isArray(input)) return input.slice(0, 30).map((item) => ({ lang: item?.lang || detectLanguage(item?.text, fallback), text: clean(item?.text) })).filter((item) => item.text);
    const source = clean(input);
    if (!source) return [];
    const pieces = source.split(/(?<=[.!?;:])\s+|\n+/).map((item) => item.trim()).filter(Boolean);
    const output = [];
    pieces.forEach((piece) => {
      const quoted = [...piece.matchAll(/[“\"]([^”\"]+)[”\"]/g)];
      if (!quoted.length) { output.push({ lang: detectLanguage(piece, fallback), text: piece }); return; }
      let cursor = 0;
      quoted.forEach((match) => {
        const before = piece.slice(cursor, match.index).trim();
        if (before) output.push({ lang: detectLanguage(before, fallback), text: before });
        const quote = match[1].trim();
        if (quote) output.push({ lang: detectLanguage(quote, "en-US"), text: quote });
        cursor = match.index + match[0].length;
      });
      const after = piece.slice(cursor).trim();
      if (after) output.push({ lang: detectLanguage(after, fallback), text: after });
    });
    return output.slice(0, 30);
  }

  function voiceScore(voice, lang, profile) {
    const name = String(voice.name || "").toLowerCase();
    const locale = String(voice.lang || "").toLowerCase();
    const desired = lang.toLowerCase();
    let score = 0;
    if (locale === desired) score += 120;
    else if (locale.startsWith(desired.slice(0, 2))) score += 80;
    if (/natural|online|neural/.test(name)) score += 40;
    if (/female|ana|jenny|ava|aria|emma|sonia|libby|samantha|zira|hoaimy|hoài my|linh|an|vietnamese/.test(name)) score += profile === "natural" ? 18 : 32;
    if (/male|david|mark|guy|ryan|namminh/.test(name)) score -= 6;
    if (lang === "en-US" && /jenny|aria|ana|ava|emma|samantha|zira|google us english/.test(name)) score += 50;
    if (lang === "en-GB" && /sonia|libby|microsoft hazel|google uk english female/.test(name)) score += 50;
    if (lang === "vi-VN" && /hoaimy|hoài my|linh|an|vietnam|tiếng việt|google tiếng việt/.test(name)) score += 60;
    if (voice.localService) score += 4;
    return score;
  }

  function chooseVoice(voices, lang, profile) {
    const desired = String(lang || "").toLowerCase();
    const exact = [...voices].filter((voice) => String(voice.lang || "").toLowerCase() === desired);
    const family = [...voices].filter((voice) => String(voice.lang || "").toLowerCase().startsWith(desired.slice(0, 2)));
    const candidates = exact.length ? exact : family;
    if (!candidates.length) return null;
    return candidates.sort((a, b) => voiceScore(b, lang, profile) - voiceScore(a, lang, profile))[0] || null;
  }

  function waitVoices() {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) { resolve([]); return; }
      const current = speechSynthesis.getVoices();
      if (current.length) { resolve(current); return; }
      let done = false;
      const finish = () => { if (done) return; done = true; speechSynthesis.removeEventListener("voiceschanged", finish); resolve(speechSynthesis.getVoices()); };
      speechSynthesis.addEventListener("voiceschanged", finish);
      setTimeout(finish, 500);
    });
  }

  function settingsFor(lang, requestedRate, profileName) {
    const profile = PROFILE[profileName] || PROFILE["natural"];
    const isEnglish = String(lang).startsWith("en");
    const baseRate = isEnglish ? profile.enRate : profile.viRate;
    const rate = Number.isFinite(Number(requestedRate)) ? Math.max(.48, Math.min(1.02, Number(requestedRate))) : baseRate;
    return { rate: Math.min(rate, baseRate + .12), pitch: isEnglish ? profile.enPitch : profile.viPitch, pause: profile.pause };
  }

  // ==========================================================================
  // MULTI-SOURCE ONLINE VIETNAMESE TTS ENGINE (AUTHENTIC VIETNAMESE AUDIO STREAM)
  // ==========================================================================
  function playOnlineVietnameseAudio(text) {
    return new Promise((resolve) => {
      try {
        const cleanText = String(text || "").trim().slice(0, 200);
        if (!cleanText) { resolve(true); return; }
        
        // Check if ResponsiveVoice is loaded
        if (window.responsiveVoice && typeof window.responsiveVoice.speak === "function") {
          window.responsiveVoice.speak(cleanText, "Vietnamese Female", {
            onend: () => resolve(true),
            onerror: () => resolve(false)
          });
          return;
        }

        // High quality Google Translate TTS Audio Endpoint
        const encoded = encodeURIComponent(cleanText);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encoded}`;
        
        if (currentAudio) {
          try { currentAudio.pause(); } catch (e) {}
        }

        currentAudio = new Audio(url);
        currentAudio.onended = () => resolve(true);
        currentAudio.onerror = () => resolve(false);
        currentAudio.play().catch(() => resolve(false));
      } catch (e) {
        resolve(false);
      }
    });
  }

  function utter(segment, voices, options, token) {
    return new Promise(async (resolve) => {
      if (token !== queueToken) { resolve(false); return; }
      const configured = settingsFor(segment.lang, options.rate, options.profile);
      const isVietnamese = String(segment.lang).startsWith("vi");

      // For Vietnamese: Always prioritize authentic Online Voice / Neural stream for 100% natural pronunciation
      if (isVietnamese) {
        const playedOnline = await playOnlineVietnameseAudio(segment.text);
        if (playedOnline) { resolve(true); return; }
      }

      const matchedVoice = chooseVoice(voices, segment.lang, options.profile);
      const line = new SpeechSynthesisUtterance(segment.text);
      line.lang = segment.lang;
      line.rate = configured.rate;
      line.pitch = configured.pitch;
      line.volume = 1;
      if (matchedVoice) line.voice = matchedVoice;
      line.onend = () => resolve(true);
      line.onerror = () => resolve(false);
      speechSynthesis.speak(line);
    });
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function stop() {
    queueToken += 1;
    if (currentAudio) {
      try { currentAudio.pause(); } catch (e) {}
      currentAudio = null;
    }
    if (window.responsiveVoice && typeof window.responsiveVoice.cancel === "function") {
      try { window.responsiveVoice.cancel(); } catch (e) {}
    }
    try { speechSynthesis.cancel(); } catch {}
  }

  async function speak(input, rate, accent, extra = {}) {
    stop();
    const token = queueToken;
    const stored = read();
    const profile = extra.profile || stored.profile || "natural";
    const fallback = accent || extra.lang || stored.accent || "vi-VN";
    const segments = segmentInput(input, fallback);
    if (!segments.length) return false;

    const voices = await waitVoices();
    const repeat = Math.max(1, Math.min(3, Number(extra.repeat || 1)));
    for (let round = 0; round < repeat; round += 1) {
      for (let index = 0; index < segments.length; index += 1) {
        if (token !== queueToken) return false;
        await utter(segments[index], voices, { rate, profile }, token);
        if (index < segments.length - 1) await delay(Number(extra.pause || PROFILE[profile]?.pause || stored.pause || 150));
      }
      if (round < repeat - 1) await delay(300);
    }
    return true;
  }

  async function speakWords(text, options = {}) {
    const words = clean(text).match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
    if (!words.length) return false;
    stop(); const token = queueToken; const voices = await waitVoices();
    const profile = options.profile || read().profile || "natural";
    for (const word of words.slice(0, 30)) {
      if (token !== queueToken) return false;
      await utter({ lang: options.accent || "en-US", text: word }, voices, { rate: options.rate || .56, profile }, token);
      await delay(options.pause || 290);
    }
    return true;
  }

  async function spell(text, options = {}) {
    const letters = clean(text).toUpperCase().match(/[A-Z]/g) || [];
    if (!letters.length) return false;
    return speak([{ lang: options.accent || "en-US", text: letters.join(", ") }], options.rate || .58, options.accent || "en-US", { profile: options.profile || read().profile, pause: 210 });
  }

  async function teach(text, options = {}) {
    const accent = options.accent || read().accent || "en-US";
    const profile = options.profile || read().profile || "natural";
    await speak(text, options.rate || .72, accent, { profile });
    await delay(260);
    await speakWords(text, { accent, profile, rate: .54, pause: 250 });
    await delay(260);
    return speak(text, options.rate || .72, accent, { profile });
  }

  function describe(lang = "en-US") {
    const voices = ("speechSynthesis" in window) ? speechSynthesis.getVoices() : [];
    const profile = read().profile || "natural";
    const voice = chooseVoice(voices, lang, profile);
    return { profile, profileLabel: PROFILE[profile]?.label || PROFILE["natural"].label, voiceName: voice?.name || "Giọng Online Việt Nam Chuẩn 100% (Neural Stream)", lang, available: true };
  }

  const previous = window.MILO_PET_VOICE || {};
  window.MILO_CUTE_VOICE = { speak, speakWords, spell, teach, stop, saveSettings: save, readSettings: read, describe, segmentVoiceInput: segmentInput, profiles: PROFILE, version: "60.75.0" };
  window.MILO_PET_VOICE = { ...previous, speak, segmentVoiceInput: segmentInput, stop, speakWords, spell, teach, describe, version: "60.75.0" };
})();
