// Keeps short, child-friendly review reminders on this device.
(function () {
  "use strict";

  const STORAGE_PREFIX = "milo-spaced-review-v1";
  const PROFILE_KEY = "milo-child-profile-v1";
  const LAST_NICKNAME_KEY = "milo-last-nickname-v1";
  const INTERVAL_DAYS = [1, 3, 7, 14];

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  }

  function learnerKey() {
    const profile = readJson(PROFILE_KEY, {});
    const nickname = String(
      profile?.nickname || localStorage.getItem(LAST_NICKNAME_KEY) || "guest",
    )
      .trim()
      .toLowerCase();
    return `${STORAGE_PREFIX}:${nickname || "guest"}`;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function wordId(grade, unitIndex, word) {
    return `${Number(grade) || 0}:${Number(unitIndex) || 0}:${normalize(word?.[0])}`;
  }

  function load() {
    const data = readJson(learnerKey(), { version: 1, words: {}, tasks: {} });
    return {
      version: 1,
      words: data?.words && typeof data.words === "object" ? data.words : {},
      tasks: data?.tasks && typeof data.tasks === "object" ? data.tasks : {},
    };
  }

  function save(data) {
    try {
      localStorage.setItem(learnerKey(), JSON.stringify(data));
    } catch {
      // Review is a helpful local reminder; learning must continue if storage is full.
    }
  }

  function nextDueDate(days) {
    const next = new Date();
    next.setHours(12, 0, 0, 0);
    next.setDate(next.getDate() + days);
    return next.toISOString();
  }

  function selectWords({ grade, unitIndex, words, limit = 5 } = {}) {
    const source = Array.isArray(words) ? words.filter((word) => word?.[0]) : [];
    const data = load();
    const now = Date.now();
    const due = source
      .map((word) => ({ word, item: data.words[wordId(grade, unitIndex, word)] }))
      .filter(({ item }) => item?.dueAt && Date.parse(item.dueAt) <= now)
      .sort((left, right) => {
        const lapseGap = Number(right.item?.lapses || 0) - Number(left.item?.lapses || 0);
        return lapseGap || Date.parse(left.item.dueAt) - Date.parse(right.item.dueAt);
      });
    const dueWords = due.map(({ word }) => word);
    const dueIds = new Set(dueWords.map((word) => wordId(grade, unitIndex, word)));
    const freshWords = source.filter((word) => !dueIds.has(wordId(grade, unitIndex, word)));
    const picked = [...dueWords.slice(0, limit), ...freshWords].slice(0, limit);
    return {
      words: picked.length ? picked : source.slice(0, limit),
      reviewCount: Math.min(dueWords.length, limit),
      dueCount: dueWords.length,
    };
  }

  function recordWord({ grade, unitIndex, word, correct } = {}) {
    if (!word?.[0]) return;
    const data = load();
    const id = wordId(grade, unitIndex, word);
    const previous = data.words[id] || {};
    const repetitions = correct ? Math.min((Number(previous.repetitions) || 0) + 1, INTERVAL_DAYS.length) : 0;
    const intervalDays = correct ? INTERVAL_DAYS[Math.max(0, repetitions - 1)] : 1;
    data.words[id] = {
      term: String(word[0]),
      grade: Number(grade) || 0,
      unitIndex: Number(unitIndex) || 0,
      repetitions,
      lapses: (Number(previous.lapses) || 0) + (correct ? 0 : 1),
      dueAt: nextDueDate(intervalDays),
      updatedAt: new Date().toISOString(),
    };
    save(data);
  }

  function recordTask({ grade, unitIndex, part, prompt, correct } = {}) {
    const cleanPrompt = String(prompt || "").trim().slice(0, 160);
    if (!cleanPrompt) return;
    const data = load();
    const id = `${Number(grade) || 0}:${Number(unitIndex) || 0}:${String(part || "lesson")}:${normalize(cleanPrompt)}`;
    const previous = data.tasks[id] || {};
    data.tasks[id] = {
      grade: Number(grade) || 0,
      unitIndex: Number(unitIndex) || 0,
      part: String(part || "lesson"),
      lapses: (Number(previous.lapses) || 0) + (correct ? 0 : 1),
      lastResult: correct ? "correct" : "retry",
      dueAt: nextDueDate(correct ? 7 : 1),
      updatedAt: new Date().toISOString(),
    };
    save(data);
  }

  window.MILO_LEARNING_REVIEW = Object.freeze({
    selectWords,
    recordWord,
    recordTask,
  });
})();
