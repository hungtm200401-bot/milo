(function (root) {
  'use strict';

  const UNIT_COUNT = 12;
  const LEVEL_TARGETS = Object.freeze([4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 45, 50]);
  const XP_PER_LEVEL = 100;
  const MAX_LEVEL = 50;
  const MAX_XP = (MAX_LEVEL - 1) * XP_PER_LEVEL;
  const XP_TARGETS = Object.freeze(LEVEL_TARGETS.map((level) => (level - 1) * XP_PER_LEVEL));
  const UNIT_XP_BUDGETS = Object.freeze(XP_TARGETS.map((target, index) => target - (XP_TARGETS[index - 1] || 0)));
  const SCHEMA_VERSION = 21;
  const STORAGE_PREFIX = 'milo-grade-progress-v60-20-';
  const BACKUP_PREFIX = 'milo-progress-backup-v60-20-';
  const TOKEN_KEY = 'milo-commerce-token-v1';
  const ACTIVITY_XP = Object.freeze({
    lesson: 10,
    pronunciation: 15,
    exercise: 8,
    quick: 12,
    section: 20,
    test: 30,
  });

  const nowIso = () => new Date().toISOString();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const clampUnit = (value) => clamp(Math.round(Number(value) || 1), 1, UNIT_COUNT);
  const clampXp = (value) => clamp(Math.round(Number(value) || 0), 0, MAX_XP);
  const levelForXp = (xp) => Math.min(MAX_LEVEL, 1 + Math.floor(clampXp(xp) / XP_PER_LEVEL));
  const xpForLevel = (level) => clamp(level, 1, MAX_LEVEL) * XP_PER_LEVEL - XP_PER_LEVEL;
  const levelTargetForUnit = (unitNumber) => LEVEL_TARGETS[clampUnit(unitNumber) - 1];
  const xpTargetForUnit = (unitNumber) => XP_TARGETS[clampUnit(unitNumber) - 1];
  const xpBudgetForUnit = (unitNumber) => UNIT_XP_BUDGETS[clampUnit(unitNumber) - 1];
  const requiredUnitForLevel = (level) => {
    const safe = clamp(level, 1, MAX_LEVEL);
    if (safe <= 1) return 0;
    const index = LEVEL_TARGETS.findIndex((target) => target >= safe);
    return index < 0 ? UNIT_COUNT : index + 1;
  };

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function cleanArray(value) {
    return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
  }

  function defaultUnit(unitNumber) {
    return {
      unit: clampUnit(unitNumber),
      xp: 0,
      activities: {},
      sections: {},
      attempts: 0,
      wrongItems: [],
      weakAreas: [],
      lastScore: 0,
      bestScore: 0,
      completedAt: null,
      updatedAt: null,
    };
  }

  function defaultGrade(grade) {
    return {
      schemaVersion: SCHEMA_VERSION,
      grade: clamp(grade, 2, 5),
      xp: 0,
      level: 1,
      currentUnit: 1,
      unlockedThrough: UNIT_COUNT,
      completedUnits: [],
      units: Object.fromEntries(Array.from({ length: UNIT_COUNT }, (_, index) => [String(index + 1), defaultUnit(index + 1)])),
      highestLevel: 1,
      classCompletedAt: null,
      migratedAt: null,
      updatedAt: nowIso(),
    };
  }

  function normalizeUnit(raw, unitNumber) {
    const base = defaultUnit(unitNumber);
    const safe = raw && typeof raw === 'object' ? raw : {};
    return {
      ...base,
      ...safe,
      unit: clampUnit(unitNumber),
      xp: clamp(Math.round(Number(safe.xp) || 0), 0, xpBudgetForUnit(unitNumber)),
      activities: safe.activities && typeof safe.activities === 'object' ? { ...safe.activities } : {},
      sections: safe.sections && typeof safe.sections === 'object' ? { ...safe.sections } : {},
      attempts: Math.max(0, Math.round(Number(safe.attempts) || 0)),
      wrongItems: cleanArray(safe.wrongItems).slice(-100),
      weakAreas: cleanArray(safe.weakAreas).slice(-100),
      lastScore: clamp(Math.round(Number(safe.lastScore) || 0), 0, 100),
      bestScore: clamp(Math.round(Number(safe.bestScore) || 0), 0, 100),
      completedAt: safe.completedAt || null,
      updatedAt: safe.updatedAt || null,
    };
  }

  function normalizeGrade(raw, grade) {
    const base = defaultGrade(grade);
    const safe = raw && typeof raw === 'object' ? raw : {};
    const completedUnits = [...new Set((Array.isArray(safe.completedUnits) ? safe.completedUnits : [])
      .map((value) => Math.round(Number(value)))
      .filter((value) => value >= 1 && value <= UNIT_COUNT))].sort((a, b) => a - b);
    const units = {};
    for (let unit = 1; unit <= UNIT_COUNT; unit += 1) {
      units[String(unit)] = normalizeUnit(safe.units?.[String(unit)] || safe.units?.[unit], unit);
      if (completedUnits.includes(unit) && !units[String(unit)].completedAt) units[String(unit)].completedAt = safe.updatedAt || nowIso();
    }
    const highestCompleted = completedUnits.at(-1) || 0;
    const minimumXp = highestCompleted ? xpTargetForUnit(highestCompleted) : 0;
    const xp = Math.max(minimumXp, clampXp(safe.xp));
    const firstIncomplete = Array.from({ length: UNIT_COUNT }, (_, index) => index + 1).find((unit) => !completedUnits.includes(unit)) || UNIT_COUNT;
    const currentUnit = clampUnit(safe.currentUnit || firstIncomplete);
    const unlockedThrough = UNIT_COUNT;
    const level = levelForXp(xp);
    return {
      ...base,
      ...safe,
      schemaVersion: SCHEMA_VERSION,
      grade: clamp(grade, 2, 5),
      xp,
      level,
      currentUnit,
      unlockedThrough,
      completedUnits,
      units,
      highestLevel: Math.max(level, clamp(Number(safe.highestLevel) || 1, 1, MAX_LEVEL)),
      classCompletedAt: completedUnits.includes(UNIT_COUNT) ? (safe.classCompletedAt || units[String(UNIT_COUNT)].completedAt || nowIso()) : null,
      updatedAt: safe.updatedAt || nowIso(),
    };
  }

  function backupLegacy(storage, grade) {
    if (!storage) return null;
    const marker = `${BACKUP_PREFIX}${grade}`;
    if (storage.getItem(marker)) return marker;
    const snapshot = {};
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      if (
        key === `milo-completed-${grade}` ||
        key === `milo-unit-${grade}` ||
        key.startsWith(`milo-lesson-parts-${grade}-`) ||
        (key.startsWith(`milo-micro-lesson-v60-19-${grade}-`) || key.startsWith(`milo-micro-v60-19-${grade}-`)) ||
        key.startsWith(`milo-writing-${grade}-`) ||
        key.startsWith(`milo-boss-defeated-${grade}-`) ||
        key.includes(`grade-progress`) || key === `milo-level-${grade}` || key === `milo-xp-${grade}`
      ) snapshot[key] = storage.getItem(key);
    }
    storage.setItem(marker, JSON.stringify({ createdAt: nowIso(), grade, snapshot }));
    return marker;
  }

  function removeLegacyUnits13To16(storage, grade) {
    if (!storage) return;
    const remove = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      const patterns = [
        new RegExp(`^milo-lesson-parts-${grade}-(1[2-5])$`),
        new RegExp(`^milo-micro-lesson-v60-19-${grade}-(1[2-5])-`),
        new RegExp(`^milo-micro-v60-19-${grade}-(1[2-5])-`),
        new RegExp(`^milo-writing-${grade}-(1[2-5])$`),
        new RegExp(`^milo-boss-defeated-${grade}-(1[2-5])$`),
      ];
      if (patterns.some((pattern) => pattern.test(key))) remove.push(key);
    }
    remove.forEach((key) => storage.removeItem(key));
  }

  function migrateLegacy(storage, grade) {
    const result = defaultGrade(grade);
    if (!storage) return result;
    backupLegacy(storage, grade);
    const completedLegacy = safeParse(storage.getItem(`milo-completed-${grade}`) || '[]', []);
    const completedUnits = [...new Set((Array.isArray(completedLegacy) ? completedLegacy : [])
      .map((value) => Number(value) + 1)
      .filter((value) => value >= 1 && value <= UNIT_COUNT))].sort((a, b) => a - b);
    result.completedUnits = completedUnits;
    let legacySteps = 0;
    for (let index = 0; index < UNIT_COUNT; index += 1) {
      const parts = safeParse(storage.getItem(`milo-lesson-parts-${grade}-${index}`) || '[]', []);
      const sectionIds = Array.isArray(parts) ? [...new Set(parts.map(String))] : [];
      result.units[String(index + 1)].sections = Object.fromEntries(sectionIds.map((id) => [id, { completed: true, score: 80, completedAt: nowIso() }]));
      legacySteps += completedUnits.includes(index + 1) ? 11 : Math.min(11, sectionIds.length);
      if (completedUnits.includes(index + 1)) {
        result.units[String(index + 1)].xp = xpBudgetForUnit(index + 1);
        result.units[String(index + 1)].completedAt = nowIso();
      }
    }
    const inferredLegacyLevel = Math.min(MAX_LEVEL, 1 + Math.floor(legacySteps * 49 / (UNIT_COUNT * 11)));
    const explicitLevel = clamp(Number(storage.getItem(`milo-level-${grade}`)) || 1, 1, MAX_LEVEL);
    const explicitXp = clampXp(storage.getItem(`milo-xp-${grade}`));
    const completionXp = completedUnits.length ? xpTargetForUnit(completedUnits.at(-1)) : 0;
    result.xp = Math.max(completionXp, explicitXp, xpForLevel(Math.max(inferredLegacyLevel, explicitLevel)));
    result.level = levelForXp(result.xp);
    const oldCurrentIndex = Number(storage.getItem(`milo-unit-${grade}`));
    const oldCurrentUnit = Number.isFinite(oldCurrentIndex) ? oldCurrentIndex + 1 : ((completedUnits.at(-1) || 0) + 1);
    result.currentUnit = clampUnit(oldCurrentUnit);
    result.unlockedThrough = UNIT_COUNT;
    result.highestLevel = result.level;
    result.classCompletedAt = completedUnits.includes(UNIT_COUNT) ? nowIso() : null;
    result.migratedAt = nowIso();
    result.updatedAt = nowIso();
    removeLegacyUnits13To16(storage, grade);
    return normalizeGrade(result, grade);
  }

  function createApi(storage) {
    const targetStorage = storage || root.localStorage;
    const keyFor = (grade) => `${STORAGE_PREFIX}${grade}`;

    function persist(grade, value, { sync = true } = {}) {
      const normalized = normalizeGrade(value, grade);
      normalized.updatedAt = nowIso();
      targetStorage?.setItem(keyFor(grade), JSON.stringify(normalized));
      targetStorage?.setItem(`milo-completed-${grade}`, JSON.stringify(normalized.completedUnits.map((unit) => unit - 1)));
      targetStorage?.setItem(`milo-unit-${grade}`, String(normalized.currentUnit - 1));
      targetStorage?.setItem(`milo-level-${grade}`, String(normalized.level));
      targetStorage?.setItem(`milo-xp-${grade}`, String(normalized.xp));
      if (root.dispatchEvent && typeof root.CustomEvent === 'function') {
        root.dispatchEvent(new root.CustomEvent('milo:progress-updated', { detail: { grade, progress: normalized } }));
      }
      if (sync) queueSync(grade, normalized);
      return normalized;
    }

    function load(grade) {
      const safeGrade = clamp(grade, 2, 5);
      const raw = safeParse(targetStorage?.getItem(keyFor(safeGrade)) || 'null', null);
      if (!raw) return persist(safeGrade, migrateLegacy(targetStorage, safeGrade), { sync: false });
      const normalized = normalizeGrade(raw, safeGrade);
      if (JSON.stringify(normalized) !== JSON.stringify(raw)) return persist(safeGrade, normalized, { sync: false });
      return normalized;
    }

    function summary(grade) {
      const progress = load(grade);
      const nextLevelXp = progress.level >= MAX_LEVEL ? MAX_XP : xpForLevel(progress.level + 1);
      const currentLevelXp = xpForLevel(progress.level);
      const nextUnit = progress.completedUnits.length >= UNIT_COUNT ? UNIT_COUNT : Math.min(UNIT_COUNT, progress.completedUnits.length + 1);
      return {
        ...progress,
        maxLevel: MAX_LEVEL,
        maxXp: MAX_XP,
        unitCount: UNIT_COUNT,
        levelTargets: LEVEL_TARGETS.slice(),
        xpTargets: XP_TARGETS.slice(),
        xpIntoLevel: progress.xp - currentLevelXp,
        xpNeededForNextLevel: Math.max(0, nextLevelXp - progress.xp),
        nextLevelXp,
        nextUnit,
        nextUnitLevel: levelTargetForUnit(nextUnit),
        nextUnitXp: xpTargetForUnit(nextUnit),
      };
    }

    function isUnitUnlocked(grade, unitNumber) {
      load(grade);
      const unit = Math.round(Number(unitNumber));
      return Number.isFinite(unit) && unit >= 1 && unit <= UNIT_COUNT;
    }

    function setCurrentUnit(grade, unitNumber) {
      const progress = load(grade);
      const unit = clampUnit(unitNumber);
      progress.currentUnit = unit;
      progress.unlockedThrough = UNIT_COUNT;
      return { ok: true, progress: persist(grade, progress) };
    }

    function awardActivity({ grade, unitNumber, sectionId = 'general', type = 'exercise', itemId = 'once', score = null, wrongItem = '', weakArea = '' } = {}) {
      const safeGrade = clamp(grade, 2, 5);
      const unit = clampUnit(unitNumber);
      const progress = load(safeGrade);
      const unitState = progress.units[String(unit)];
      const activityType = Object.prototype.hasOwnProperty.call(ACTIVITY_XP, type) ? type : 'exercise';
      const eventKey = `${String(sectionId)}:${activityType}:${String(itemId)}`;
      if (unitState.activities[eventKey]) return { ok: true, awarded: 0, duplicate: true, progress };
      const remaining = Math.max(0, xpBudgetForUnit(unit) - unitState.xp);
      const awarded = Math.min(ACTIVITY_XP[activityType], remaining);
      unitState.activities[eventKey] = { type: activityType, xp: awarded, score: score == null ? null : clamp(score, 0, 100), at: nowIso() };
      unitState.xp += awarded;
      unitState.attempts += 1;
      if (wrongItem) unitState.wrongItems = [...new Set([...unitState.wrongItems, String(wrongItem)])].slice(-100);
      if (weakArea) unitState.weakAreas = [...new Set([...unitState.weakAreas, String(weakArea)])].slice(-100);
      if (score != null) {
        unitState.lastScore = clamp(score, 0, 100);
        unitState.bestScore = Math.max(unitState.bestScore, unitState.lastScore);
      }
      unitState.updatedAt = nowIso();
      progress.xp = clampXp(progress.xp + awarded);
      progress.level = levelForXp(progress.xp);
      progress.highestLevel = Math.max(progress.highestLevel, progress.level);
      return { ok: true, awarded, progress: persist(safeGrade, progress) };
    }

    function completeSection({ grade, unitNumber, sectionId, score = 80, attempts = 1, wrongItems = [], weakAreas = [] } = {}) {
      const safeGrade = clamp(grade, 2, 5);
      const unit = clampUnit(unitNumber);
      const progress = load(safeGrade);
      const unitState = progress.units[String(unit)];
      const id = String(sectionId || 'section');
      const previous = unitState.sections[id] || {};
      unitState.sections[id] = {
        completed: Number(score) >= 80,
        score: clamp(score, 0, 100),
        bestScore: Math.max(Number(previous.bestScore) || 0, clamp(score, 0, 100)),
        attempts: Math.max(Number(previous.attempts) || 0, Number(attempts) || 1),
        wrongItems: [...new Set([...(previous.wrongItems || []), ...cleanArray(wrongItems)])].slice(-100),
        weakAreas: [...new Set([...(previous.weakAreas || []), ...cleanArray(weakAreas)])].slice(-100),
        completedAt: Number(score) >= 80 ? (previous.completedAt || nowIso()) : null,
        updatedAt: nowIso(),
      };
      unitState.lastScore = clamp(score, 0, 100);
      unitState.bestScore = Math.max(unitState.bestScore, unitState.lastScore);
      unitState.attempts += Math.max(1, Number(attempts) || 1);
      unitState.wrongItems = [...new Set([...unitState.wrongItems, ...cleanArray(wrongItems)])].slice(-100);
      unitState.weakAreas = [...new Set([...unitState.weakAreas, ...cleanArray(weakAreas)])].slice(-100);
      persist(safeGrade, progress, { sync: false });
      return awardActivity({ grade: safeGrade, unitNumber: unit, sectionId: id, type: 'section', itemId: 'completed', score, weakArea: weakAreas[0] || '' });
    }

    function canCompleteUnit({ grade, unitNumber, requiredSections = [], score = 0 } = {}) {
      const progress = load(grade);
      const unit = clampUnit(unitNumber);
      const required = [...new Set(cleanArray(requiredSections))];
      const unitState = progress.units[String(unit)];
      const missing = required.filter((id) => !unitState.sections[id]?.completed);
      if (Number(score) < 80) return { ok: false, reason: 'Bài kiểm tra Unit cần đạt tối thiểu 80%.', missing, progress };
      if (required.length && missing.length) return { ok: false, reason: `Còn ${missing.length} phần chưa hoàn thành.`, missing, progress };
      return { ok: true, missing: [], progress };
    }

    function completeUnit({ grade, unitNumber, requiredSections = [], score = 80 } = {}) {
      const safeGrade = clamp(grade, 2, 5);
      const unit = clampUnit(unitNumber);
      const check = canCompleteUnit({ grade: safeGrade, unitNumber: unit, requiredSections, score });
      if (!check.ok) return check;
      const progress = check.progress;
      const unitState = progress.units[String(unit)];
      const firstCompletion = !progress.completedUnits.includes(unit);
      unitState.lastScore = clamp(score, 0, 100);
      unitState.bestScore = Math.max(unitState.bestScore, unitState.lastScore);
      unitState.xp = xpBudgetForUnit(unit);
      unitState.completedAt = unitState.completedAt || nowIso();
      unitState.updatedAt = nowIso();
      if (firstCompletion) progress.completedUnits.push(unit);
      progress.completedUnits = [...new Set(progress.completedUnits)].sort((a, b) => a - b);
      progress.xp = Math.max(progress.xp, xpTargetForUnit(unit));
      progress.xp = clampXp(progress.xp);
      progress.level = levelForXp(progress.xp);
      progress.highestLevel = Math.max(progress.highestLevel, progress.level);
      progress.currentUnit = unit < UNIT_COUNT ? unit + 1 : UNIT_COUNT;
      progress.unlockedThrough = UNIT_COUNT;
      if (unit === UNIT_COUNT) {
        progress.xp = MAX_XP;
        progress.level = MAX_LEVEL;
        progress.highestLevel = MAX_LEVEL;
        progress.classCompletedAt = progress.classCompletedAt || nowIso();
      }
      const saved = persist(safeGrade, progress);
      return { ok: true, firstCompletion, progress: saved, levelTarget: levelTargetForUnit(unit), xpTarget: xpTargetForUnit(unit) };
    }

    function mergeGrade(local, remote, grade) {
      const left = normalizeGrade(local, grade);
      const right = normalizeGrade(remote, grade);
      const merged = normalizeGrade({
        ...left,
        xp: Math.max(left.xp, right.xp),
        currentUnit: Math.max(left.currentUnit, right.currentUnit),
        unlockedThrough: UNIT_COUNT,
        completedUnits: [...new Set([...left.completedUnits, ...right.completedUnits])],
        classCompletedAt: left.classCompletedAt || right.classCompletedAt,
        highestLevel: Math.max(left.highestLevel, right.highestLevel),
      }, grade);
      for (let unit = 1; unit <= UNIT_COUNT; unit += 1) {
        const a = left.units[String(unit)];
        const b = right.units[String(unit)];
        merged.units[String(unit)] = normalizeUnit({
          ...a,
          xp: Math.max(a.xp, b.xp),
          activities: { ...a.activities, ...b.activities },
          sections: { ...a.sections, ...b.sections },
          attempts: Math.max(a.attempts, b.attempts),
          wrongItems: [...new Set([...a.wrongItems, ...b.wrongItems])],
          weakAreas: [...new Set([...a.weakAreas, ...b.weakAreas])],
          lastScore: Math.max(a.lastScore, b.lastScore),
          bestScore: Math.max(a.bestScore, b.bestScore),
          completedAt: a.completedAt || b.completedAt,
          updatedAt: [a.updatedAt, b.updatedAt].filter(Boolean).sort().at(-1) || null,
        }, unit);
      }
      return normalizeGrade(merged, grade);
    }

    let syncTimer = 0;
    function queueSync(grade, progress) {
      if (!root.fetch || !targetStorage) return;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => syncToServer(grade, progress).catch(() => {}), 500);
    }

    async function syncToServer(grade, progress = load(grade)) {
      const token = targetStorage?.getItem(TOKEN_KEY) || '';
      if (!token || !root.fetch) return { synced: false };
      const response = await root.fetch('/api/progress/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ grade: clamp(grade, 2, 5), progress: normalizeGrade(progress, grade) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Không thể đồng bộ tiến độ.');
      if (payload.progress) persist(grade, mergeGrade(load(grade), payload.progress, grade), { sync: false });
      return { synced: true, payload };
    }

    async function pullFromServer() {
      const token = targetStorage?.getItem(TOKEN_KEY) || '';
      if (!token || !root.fetch) return { synced: false };
      const response = await root.fetch('/api/progress/snapshot', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Không thể tải tiến độ.');
      for (const grade of [2, 3, 4, 5]) {
        if (payload.gradeProgress?.[String(grade)]) persist(grade, mergeGrade(load(grade), payload.gradeProgress[String(grade)], grade), { sync: false });
      }
      return { synced: true, payload };
    }

    function migrateAll() {
      return Object.fromEntries([2, 3, 4, 5].map((grade) => [grade, load(grade)]));
    }

    return {
      version: '60.20.0',
      UNIT_COUNT,
      LEVEL_TARGETS: LEVEL_TARGETS.slice(),
      XP_TARGETS: XP_TARGETS.slice(),
      UNIT_XP_BUDGETS: UNIT_XP_BUDGETS.slice(),
      MAX_LEVEL,
      MAX_XP,
      ACTIVITY_XP: { ...ACTIVITY_XP },
      levelForXp,
      xpForLevel,
      levelTargetForUnit,
      xpTargetForUnit,
      xpBudgetForUnit,
      requiredUnitForLevel,
      normalizeGrade,
      load,
      save: persist,
      summary,
      isUnitUnlocked,
      setCurrentUnit,
      awardActivity,
      completeSection,
      canCompleteUnit,
      completeUnit,
      migrateAll,
      mergeGrade,
      syncToServer,
      pullFromServer,
      backupLegacy: (grade) => backupLegacy(targetStorage, grade),
    };
  }

  const api = createApi(root.localStorage);
  root.MILO_UNIT_PROGRESSION = api;
  if (root.addEventListener) {
    root.addEventListener('DOMContentLoaded', () => {
      try { api.migrateAll(); } catch (error) { console.warn('Milo progress migration:', error); }
      setTimeout(() => api.pullFromServer().catch(() => {}), 900);
    }, { once: true });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createApi, UNIT_COUNT, LEVEL_TARGETS, XP_TARGETS, UNIT_XP_BUDGETS, MAX_LEVEL, MAX_XP };
})(typeof window !== 'undefined' ? window : globalThis);
