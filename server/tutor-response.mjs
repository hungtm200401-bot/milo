const clean = (value, max = 2000) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const clamp = (value, min, max, fallback = min) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};

const statuses = new Set([
  "correct",
  "partly_correct",
  "incorrect",
  "unclear",
  "not_an_answer",
  "not_applicable",
]);

const languages = new Set(["vi-VN", "en-US"]);

function unwrapJson(text) {
  const source = String(text || "").trim();
  if (!source) return null;
  const withoutFence = source
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(withoutFence);
  } catch {}
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(withoutFence.slice(start, end + 1));
    } catch {}
  }
  return null;
}

function detectLanguage(text) {
  const value = String(text || "");
  const vietnamese = /[À-ỹĐđ]/.test(value) || /\b(con|bé|milo|hãy|đúng|sai|câu|từ|nghĩa|phát âm|thử lại|giải thích)\b/i.test(value);
  const english = /\b(the|a|an|is|are|am|do|does|can|should|because|what|where|when|how|I|you|we|they)\b/i.test(value);
  if (vietnamese && english) return "mixed";
  return vietnamese ? "vi" : "en";
}

function fallbackSpeech(answer) {
  const lines = String(answer || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_#>`~]/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => clean(item, 420))
    .filter(Boolean)
    .slice(0, 16);
  return lines.map((text) => ({
    lang: detectLanguage(text) === "en" ? "en-US" : "vi-VN",
    text,
  }));
}

function normalizeEvaluation(value = {}) {
  const status = statuses.has(value?.status) ? value.status : "not_applicable";
  const applicable = status !== "not_applicable";
  return {
    status,
    score: applicable ? Math.round(clamp(value?.score, 0, 100, 0)) : null,
    childAnswer: clean(value?.childAnswer, 500),
    betterAnswer: clean(value?.betterAnswer, 700),
    strength: clean(value?.strength, 320),
    reason: clean(value?.reason, 700),
    retryPrompt: clean(value?.retryPrompt, 500),
    shouldRetry: Boolean(value?.shouldRetry) && !["correct", "not_applicable"].includes(status),
  };
}

function normalizeNext(value = {}) {
  const allowed = new Set(["repeat", "answer", "continue", "none"]);
  return {
    type: allowed.has(value?.type) ? value.type : "none",
    question: clean(value?.question, 600),
  };
}

function normalizeSpeech(value, answer) {
  if (!Array.isArray(value)) return fallbackSpeech(answer);
  const output = value
    .slice(0, 16)
    .map((item) => ({
      lang: languages.has(item?.lang) ? item.lang : detectLanguage(item?.text) === "en" ? "en-US" : "vi-VN",
      text: clean(item?.text, 500),
    }))
    .filter((item) => item.text);
  return output.length ? output : fallbackSpeech(answer);
}

export function normalizeTutorResponse(raw, input = {}) {
  const parsed = typeof raw === "object" && raw !== null ? raw : unwrapJson(raw);
  if (!parsed) {
    const answer = clean(raw, 6000) || "Milo chưa nhận được câu trả lời rõ ràng. Con thử hỏi lại bằng một câu ngắn nhé.";
    return {
      answer,
      evaluation: normalizeEvaluation(),
      next: normalizeNext(),
      speechSegments: fallbackSpeech(answer),
      language: detectLanguage(answer),
      skill: clean(input?.difficulty || "open", 40),
    };
  }
  const answer = clean(parsed.answer, 6000) || clean(parsed.message, 6000) || "Milo cần con nói lại câu hỏi ngắn hơn một chút.";
  return {
    answer,
    evaluation: normalizeEvaluation(parsed.evaluation),
    next: normalizeNext(parsed.next),
    speechSegments: normalizeSpeech(parsed.speechSegments || parsed.speech, answer),
    language: ["vi", "en", "mixed"].includes(parsed.language) ? parsed.language : detectLanguage(answer),
    skill: clean(parsed.skill || input?.difficulty || "open", 40),
  };
}

export function emptyEvaluation() {
  return normalizeEvaluation();
}
