import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  resolve,
  sep,
} from "node:path";

const scrypt = promisify(scryptCallback);
const OPEN_PURCHASE_STATUSES = new Set(["pending"]);
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW = 10 * 60 * 1000;
const LOGIN_LOCK_DURATION = 15 * 60 * 1000;

const PROGRESS_SCHEMA_VERSION = 20;
const DATABASE_SCHEMA_VERSION = 7;
const PROGRESS_UNIT_COUNT = 12;
const PROGRESS_MAX_LEVEL = 50;
const PROGRESS_MAX_XP = 4900;
const PROGRESS_LEVEL_TARGETS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 45, 50];
const PROGRESS_XP_TARGETS = PROGRESS_LEVEL_TARGETS.map((level) => (level - 1) * 100);
const clampProgress = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
const progressLevelForXp = (xp) => Math.min(PROGRESS_MAX_LEVEL, 1 + Math.floor(clampProgress(xp, 0, PROGRESS_MAX_XP) / 100));
const defaultUnitProgress = (unit) => ({ unit, xp: 0, activities: {}, sections: {}, attempts: 0, wrongItems: [], weakAreas: [], lastScore: 0, bestScore: 0, completedAt: null, updatedAt: null });
const defaultGradeProgress = (grade) => ({
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  grade: clampProgress(grade, 2, 5), xp: 0, level: 1, currentUnit: 1, unlockedThrough: 1,
  completedUnits: [], units: Object.fromEntries(Array.from({ length: PROGRESS_UNIT_COUNT }, (_, index) => [String(index + 1), defaultUnitProgress(index + 1)])),
  highestLevel: 1, classCompletedAt: null, migratedAt: null, updatedAt: new Date().toISOString(),
});
const cleanProgressList = (value) => Array.isArray(value) ? [...new Set(value.filter(Boolean).map(String))].slice(-100) : [];
function normalizeUnitProgress(raw, unit) {
  const base = defaultUnitProgress(unit), safe = raw && typeof raw === "object" ? raw : {};
  const previousTarget = PROGRESS_XP_TARGETS[unit - 2] || 0;
  const budget = PROGRESS_XP_TARGETS[unit - 1] - previousTarget;
  return {
    ...base, ...safe, unit,
    xp: clampProgress(Math.round(Number(safe.xp) || 0), 0, budget),
    activities: safe.activities && typeof safe.activities === "object" ? { ...safe.activities } : {},
    sections: safe.sections && typeof safe.sections === "object" ? { ...safe.sections } : {},
    attempts: Math.max(0, Math.round(Number(safe.attempts) || 0)),
    wrongItems: cleanProgressList(safe.wrongItems), weakAreas: cleanProgressList(safe.weakAreas),
    lastScore: clampProgress(Math.round(Number(safe.lastScore) || 0), 0, 100),
    bestScore: clampProgress(Math.round(Number(safe.bestScore) || 0), 0, 100),
    completedAt: safe.completedAt || null, updatedAt: safe.updatedAt || null,
  };
}
function normalizeGradeProgress(raw, grade) {
  const base = defaultGradeProgress(grade), safe = raw && typeof raw === "object" ? raw : {};
  const completedUnits = [...new Set((Array.isArray(safe.completedUnits) ? safe.completedUnits : []).map(Number).filter((unit) => unit >= 1 && unit <= PROGRESS_UNIT_COUNT))].sort((a, b) => a - b);
  const units = {};
  for (let unit = 1; unit <= PROGRESS_UNIT_COUNT; unit += 1) units[String(unit)] = normalizeUnitProgress(safe.units?.[String(unit)] || safe.units?.[unit], unit);
  const highestCompleted = completedUnits.at(-1) || 0;
  const minimumXp = highestCompleted ? PROGRESS_XP_TARGETS[highestCompleted - 1] : 0;
  let xp = Math.max(minimumXp, clampProgress(Math.round(Number(safe.xp) || 0), 0, PROGRESS_MAX_XP));
  if (completedUnits.includes(PROGRESS_UNIT_COUNT)) xp = PROGRESS_MAX_XP;
  const level = progressLevelForXp(xp);
  const firstIncomplete = Array.from({ length: PROGRESS_UNIT_COUNT }, (_, index) => index + 1).find((unit) => !completedUnits.includes(unit)) || PROGRESS_UNIT_COUNT;
  const currentUnit = clampProgress(Math.round(Number(safe.currentUnit) || firstIncomplete), 1, PROGRESS_UNIT_COUNT);
  return {
    ...base, ...safe, schemaVersion: PROGRESS_SCHEMA_VERSION, grade: clampProgress(grade, 2, 5), xp, level, currentUnit,
    unlockedThrough: clampProgress(Math.max(Number(safe.unlockedThrough) || 1, currentUnit, highestCompleted ? Math.min(PROGRESS_UNIT_COUNT, highestCompleted + 1) : 1), 1, PROGRESS_UNIT_COUNT),
    completedUnits, units, highestLevel: Math.max(level, clampProgress(Number(safe.highestLevel) || 1, 1, PROGRESS_MAX_LEVEL)),
    classCompletedAt: completedUnits.includes(PROGRESS_UNIT_COUNT) ? (safe.classCompletedAt || units["12"].completedAt || new Date().toISOString()) : null,
    updatedAt: safe.updatedAt || new Date().toISOString(),
  };
}
function normalizeAllGradeProgress(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  return Object.fromEntries([2, 3, 4, 5].map((grade) => [String(grade), normalizeGradeProgress(safe[String(grade)], grade)]));
}
function mergeGradeProgress(leftRaw, rightRaw, grade) {
  const left = normalizeGradeProgress(leftRaw, grade), right = normalizeGradeProgress(rightRaw, grade);
  const merged = normalizeGradeProgress({
    ...left, xp: Math.max(left.xp, right.xp), currentUnit: Math.max(left.currentUnit, right.currentUnit),
    unlockedThrough: Math.max(left.unlockedThrough, right.unlockedThrough), completedUnits: [...new Set([...left.completedUnits, ...right.completedUnits])],
    classCompletedAt: left.classCompletedAt || right.classCompletedAt, highestLevel: Math.max(left.highestLevel, right.highestLevel),
  }, grade);
  for (let unit = 1; unit <= PROGRESS_UNIT_COUNT; unit += 1) {
    const a = left.units[String(unit)], b = right.units[String(unit)];
    merged.units[String(unit)] = normalizeUnitProgress({ ...a, xp: Math.max(a.xp, b.xp), activities: { ...a.activities, ...b.activities }, sections: { ...a.sections, ...b.sections }, attempts: Math.max(a.attempts, b.attempts), wrongItems: [...new Set([...a.wrongItems, ...b.wrongItems])], weakAreas: [...new Set([...a.weakAreas, ...b.weakAreas])], lastScore: Math.max(a.lastScore, b.lastScore), bestScore: Math.max(a.bestScore, b.bestScore), completedAt: a.completedAt || b.completedAt, updatedAt: [a.updatedAt, b.updatedAt].filter(Boolean).sort().at(-1) || null }, unit);
  }
  return normalizeGradeProgress(merged, grade);
}


const MILO_PETS = {
  2: { milo: "Milo", luna: "Luna", bingo: "Bingo", hapi: "Hapi" },
  3: { milo: "Milo", piko: "Piko", nami: "Nami", koby: "Koby" },
  4: { milo: "Milo", rocky: "Rocky", deerly: "Deerly", leo: "Leo" },
  5: { milo: "Milo", sunny: "Sunny", wolfy: "Wolfy", ollie: "Ollie" },
};

export const MILO_FEATURES = [
  "Chẩn đoán đúng kỹ năng và nguyên nhân bé đang vướng",
  "Trò chuyện giọng nói hai chiều trực tiếp với Milo",
  "Chấm phát âm trực tiếp, chỉ đúng từ hoặc âm cần sửa",
  "Cho nghe mẫu, nghe lại giọng của bé và luyện lại đến khi đạt",
  "Ghi nhớ dài hạn lỗi lặp lại và tiến bộ trên tài khoản",
  "Buổi học hôm nay 10–15 phút tự dẫn dắt theo từng bước",
  "Trung tâm phụ huynh với báo cáo tuần và đề xuất học tiếp",
  "Mở 8 trợ lý AI chuyên môn cho từng kỹ năng",
  "Phân tích độ chính xác, độ rõ, độ đủ câu và nhịp nói",
  "Cá nhân hóa theo lớp 2–5, trình độ, pet và lịch sử dài hạn",
  "Sửa từ vựng, ngữ pháp, phát âm, nghe, đọc và viết",
  "Hỏi lại một câu kiểm tra ngắn để chắc chắn bé đã hiểu",
  "Phản hồi song ngữ, tích cực, an toàn và phù hợp trẻ em",
  "Hoạt động trong bài học hoặc tại phòng Trợ lý AI riêng",
  "Mở toàn bộ trợ lý AI VIP PRO MAX với cá nhân hóa chuyên sâu",
];

export const MILO_FREE_FEATURES = [
  "Trợ lý AI Plus miễn phí đồng hành cùng bé mỗi ngày",
  "Trò chuyện bằng chữ hoặc micro",
  "Nghe bé phát âm, chấm theo từ và chỉ cách sửa chi tiết",
  "Nghe mẫu, nghe lại giọng của bé và luyện lại",
  "Hỗ trợ Tiếng Anh lớp 2–5 theo đúng Unit đang học",
];

export const MILO_TRIAL_FEATURES = [
  ...MILO_FEATURES,
  "Dùng thử toàn bộ trợ lý AI VIP PRO MAX trong đúng 24 giờ",
];

export const MILO_PLANS = [
  {
    id: "starter",
    code: "STARTER",
    name: "VIP PRO MAX 1 tháng",
    durationMonths: 1,
    price: 299000,
    badge: "TRẢI NGHIỆM AI",
    purpose:
      "Dùng VIP PRO MAX trong 1 tháng để xử lý phần bé đang yếu hoặc ôn trước bài kiểm tra. Toàn bộ khóa học vẫn miễn phí.",
    benefits: [
      ...MILO_FEATURES,
      "Quyền dùng VIP PRO MAX trong 1 tháng",
    ],
  },
  {
    id: "plus",
    code: "PLUS",
    name: "VIP PRO MAX 3 tháng",
    durationMonths: 3,
    price: 649000,
    badge: "PHỔ BIẾN NHẤT",
    purpose:
      "Duy trì gia sư AI đồng hành và theo dõi lỗi lặp lại trong 3 tháng. Toàn bộ khóa học vẫn miễn phí.",
    benefits: [
      ...MILO_FEATURES,
      "Quyền dùng VIP PRO MAX 3 tháng, tiết kiệm 248.000đ so với mua từng tháng",
    ],
  },
  {
    id: "premium",
    code: "PREMIUM",
    name: "VIP PRO MAX 6 tháng",
    durationMonths: 6,
    price: 1199000,
    badge: "ĐỒNG HÀNH DÀI HẠN",
    purpose:
      "Cho bé có chuyên gia AI VIP PRO MAX đồng hành liên tục trong 6 tháng. Toàn bộ khóa học vẫn miễn phí.",
    benefits: [
      ...MILO_FEATURES,
      "Quyền dùng VIP PRO MAX 6 tháng, tiết kiệm 595.000đ so với mua từng tháng",
    ],
  },
];

const emptyDb = () => {
  const createdAt = new Date().toISOString();
  return {
    version: DATABASE_SCHEMA_VERSION,
    meta: {
      schemaVersion: DATABASE_SCHEMA_VERSION,
      createdAt,
      updatedAt: createdAt,
      sharedSince: createdAt,
      migratedFrom: [],
    },
    accounts: [],
    purchases: [],
  };
};
const clean = (value, max = 120) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const normalizeNickname = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 20);
const validNickname = (value) => /^[a-z][a-z0-9_.]{3,19}$/.test(value);
const validPin = (value) => /^\d{6}$/.test(String(value || ""));
const nowIso = () => new Date().toISOString();
const LEARNING_EVENT_TYPES = new Set([
  "tutor",
  "pronunciation",
  "daily-step",
  "daily-session",
  "lesson",
  "test",
]);
const LEARNING_SKILLS = new Set([
  "translation",
  "vocabulary",
  "word",
  "spelling",
  "listening",
  "speaking",
  "conversation",
  "pronunciation",
  "grammar",
  "reading",
  "writing",
  "test",
  "unit",
  "general",
]);
const emptyLearningProfile = () => ({ events: [], updatedAt: null });
const learningEventFrom = (input = {}) => {
  const type = clean(input.type, 30).toLowerCase();
  if (!LEARNING_EVENT_TYPES.has(type)) return null;
  const skill = clean(input.skill, 30).toLowerCase();
  const scoreValue = Number(input.score);
  const durationValue = Number(input.durationMinutes);
  const requestedDate = new Date(input.createdAt || "");
  const requestedTime = requestedDate.getTime();
  const earliestAllowed = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
  const latestAllowed = Date.now() + 5 * 60 * 1000;
  return {
    id: clean(input.clientEventId, 80) || randomUUID(),
    type,
    skill: LEARNING_SKILLS.has(skill) ? skill : "general",
    score: Number.isFinite(scoreValue)
      ? Math.max(0, Math.min(100, Math.round(scoreValue)))
      : null,
    durationMinutes: Number.isFinite(durationValue)
      ? Math.max(0, Math.min(30, Math.round(durationValue * 10) / 10))
      : 0,
    target: clean(input.target, 240),
    assistantMode: clean(input.assistantMode, 40),
    issues: Array.isArray(input.issues)
      ? input.issues
          .slice(0, 12)
          .map((item) => clean(item, 120))
          .filter(Boolean)
      : [],
    metadata:
      input.metadata && typeof input.metadata === "object"
        ? {
            accuracy: Math.max(
              0,
              Math.min(100, Number(input.metadata.accuracy || 0)),
            ),
            clarity: Math.max(
              0,
              Math.min(100, Number(input.metadata.clarity || 0)),
            ),
            completeness: Math.max(
              0,
              Math.min(100, Number(input.metadata.completeness || 0)),
            ),
            pace: Math.max(
              0,
              Math.min(300, Number(input.metadata.pace || 0)),
            ),
            step: clean(input.metadata.step, 40),
          }
        : {},
    createdAt:
      Number.isFinite(requestedTime) &&
      requestedTime >= earliestAllowed &&
      requestedTime <= latestAllowed
        ? requestedDate.toISOString()
        : nowIso(),
  };
};
const learningSummaryFor = (events = []) => {
  const safeEvents = Array.isArray(events) ? events : [];
  const dayKeys = [
    ...new Set(
      safeEvents
        .map((event) => String(event.createdAt || "").slice(0, 10))
        .filter(Boolean),
    ),
  ].sort();
  const pronunciation = safeEvents.filter(
    (event) => event.type === "pronunciation" && Number.isFinite(event.score),
  );
  const issueCounts = {};
  const skillCounts = {};
  safeEvents.forEach((event) => {
    const skill = LEARNING_SKILLS.has(event.skill) ? event.skill : "general";
    skillCounts[skill] = Number(skillCounts[skill] || 0) + 1;
    (event.issues || []).forEach((issue) => {
      issueCounts[issue] = Number(issueCounts[issue] || 0) + 1;
    });
  });
  const recentDayKeys = new Set(dayKeys);
  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  for (let index = 0; index < 366; index += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!recentDayKeys.has(key)) {
      if (index === 0) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const averagePronunciation = pronunciation.length
    ? Math.round(
        pronunciation.reduce(
          (total, event) => total + Number(event.score || 0),
          0,
        ) / pronunciation.length,
      )
    : 0;
  return {
    totalEvents: safeEvents.length,
    learningDays: dayKeys.length,
    streak,
    totalMinutes: Math.round(
      safeEvents.reduce(
        (total, event) => total + Number(event.durationMinutes || 0),
        0,
      ),
    ),
    pronunciationAttempts: pronunciation.length,
    averagePronunciation,
    bestPronunciation: pronunciation.length
      ? Math.max(...pronunciation.map((event) => Number(event.score || 0)))
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
};
const learningProfileFor = (account) => {
  const profile =
    account?.learningProfile && typeof account.learningProfile === "object"
      ? account.learningProfile
      : emptyLearningProfile();
  const events = Array.isArray(profile.events) ? profile.events.slice(-500) : [];
  return {
    updatedAt: profile.updatedAt || null,
    events,
    summary: learningSummaryFor(events),
  };
};
const planById = (id) => MILO_PLANS.find((plan) => plan.id === id);
const canonicalPlanName = (planId, currentName = "") =>
  planById(planId)?.name ||
  ({
    "Milo AI Starter": "VIP PRO MAX 1 tháng",
    "Milo AI Plus": "VIP PRO MAX 3 tháng",
    "Milo AI Premium": "VIP PRO MAX 6 tháng",
    "Milo AI Plus miễn phí": "AI Plus miễn phí",
  })[currentName] ||
  currentName;
const makePublicId = () => `MIL-${randomBytes(4).toString("hex").toUpperCase()}`;
const makeOrderId = () => {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ORD-${day}-${randomBytes(3).toString("hex").toUpperCase()}`;
};
const addMonths = (dateValue, months) => {
  const date = new Date(dateValue);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + Number(months));
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
};
const addHours = (dateValue, hours) =>
  new Date(new Date(dateValue).getTime() + Number(hours) * 60 * 60 * 1000)
    .toISOString();
const bearer = (req) => {
  const value = String(req.headers.authorization || "");
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
};
const tokenHash = async (token) => {
  const salt = "milo-session-v50";
  return (await scrypt(String(token || ""), salt, 32)).toString("hex");
};
const hashPin = async (pin, salt = randomBytes(16).toString("hex")) => ({
  salt,
  hash: (await scrypt(String(pin), salt, 32)).toString("hex"),
});
const verifyPin = async (pin, account) => {
  if (!account?.pinSalt || !account?.pinHash) return false;
  const actual = Buffer.from(
    (await scrypt(String(pin), account.pinSalt, 32)).toString("hex"),
  );
  const expected = Buffer.from(account.pinHash);
  return (
    actual.length === expected.length &&
    actual.length > 0 &&
    timingSafeEqual(actual, expected)
  );
};
const safeEqual = (actual, expected) => {
  const left = Buffer.from(String(actual || ""));
  const right = Buffer.from(String(expected || ""));
  return (
    left.length === right.length &&
    left.length > 0 &&
    timingSafeEqual(left, right)
  );
};
const accountStatus = (account) => {
  if (
    account.status === "active" &&
    account.activeUntil &&
    new Date(account.activeUntil).getTime() <= Date.now()
  ) {
    return "expired";
  }
  return account.status || "new";
};
const aiAccessFor = (account) => {
  if (!account) {
    return {
      active: false,
      accessLevel: "guest",
      planId: "",
      planName: "",
      allAssistants: false,
      activeUntil: null,
      trialAvailable: false,
      trialUsed: false,
      features: [],
    };
  }
  const paidActive = accountStatus(account) === "active";
  const trialActive =
    account.trialUntil &&
    new Date(account.trialUntil).getTime() > Date.now();
  if (paidActive) {
    const plan = planById(account.planId);
    return {
      active: true,
      accessLevel: "vip-pro-max",
      planId: account.planId,
      planName: plan?.name || "VIP PRO MAX",
      allAssistants: true,
      activeUntil: account.activeUntil || null,
      trialAvailable: false,
      trialUsed: Boolean(account.trialStartedAt),
      features: MILO_FEATURES,
    };
  }
  if (trialActive) {
    return {
      active: true,
      accessLevel: "vip-pro-max-trial",
      planId: "trial",
      planName: "Dùng thử VIP PRO MAX 24 giờ",
      allAssistants: true,
      activeUntil: account.trialUntil,
      trialAvailable: false,
      trialUsed: true,
      features: MILO_TRIAL_FEATURES,
    };
  }
  return {
    active: true,
    accessLevel: "plus",
    planId: "free-plus",
    planName: "AI Plus miễn phí",
    allAssistants: false,
    activeUntil: null,
    trialAvailable: !account.trialStartedAt,
    trialUsed: Boolean(account.trialStartedAt),
    features: MILO_FREE_FEATURES,
  };
};
const publicAccount = (account) => {
  const plan = planById(account.planId);
  return {
    id: account.id,
    publicId: account.publicId,
    nickname: account.nickname || "",
    displayName: account.displayName,
    gender: account.gender,
    selectedGrade: account.selectedGrade || null,
    selectedPetId: account.selectedPetId || "",
    selectedPetName: account.selectedPetName || "",
    status: accountStatus(account),
    planId: account.planId || "",
    planName: plan?.name || "",
    activeUntil: account.activeUntil || null,
    trialStartedAt: account.trialStartedAt || null,
    trialUntil: account.trialUntil || null,
    lastLoginAt:
      account.lastLoginAt ||
      (account.tokenHash
        ? account.lastSeenAt || account.updatedAt || account.createdAt || null
        : null),
    lastSeenAt:
      account.lastSeenAt ||
      (account.tokenHash ? account.updatedAt || account.createdAt || null : null),
    loginCount: account.tokenHash
      ? Math.max(1, Number(account.loginCount || 0))
      : Number(account.loginCount || 0),
    loginDisabled: Boolean(account.loginDisabled),
    gradeProgress: normalizeAllGradeProgress(account.gradeProgress),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
};
const publicPurchase = (purchase) => {
  const { providerQrCode, providerLastError, ...safe } = purchase;
  return {
    ...safe,
    planName: canonicalPlanName(purchase.planId, purchase.planName),
    qrImage:
      purchase.id && purchase.status === "pending"
        ? `/api/purchases/${purchase.id}/qr`
        : "",
  };
};

const BANK_QR_MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function createCommerceApi({
  root,
  json,
  readBody,
  databaseDirectory = "",
}) {
  const requestedDatabaseDirectory = String(databaseDirectory || "").trim();
  const userDataHome =
    process.env.LOCALAPPDATA ||
    process.env.APPDATA ||
    process.env.XDG_DATA_HOME ||
    (process.platform === "darwin"
      ? join(homedir(), "Library", "Application Support")
      : join(homedir(), ".local", "share"));
  const dataDirectory = requestedDatabaseDirectory
    ? isAbsolute(requestedDatabaseDirectory)
      ? requestedDatabaseDirectory
      : resolve(root, requestedDatabaseDirectory)
    : join(userDataHome, "MiloEnglishAdventure", "data");
  const databasePath = join(dataDirectory, "commerce.json");
  const backupsDirectory = join(dataDirectory, "backups");
  const legacyDatabasePath = join(root, "data", "commerce.json");
  let mutationQueue = Promise.resolve();
  let initializationPromise = null;
  const loginAttempts = new Map();

  function bankQrCandidates(config) {
    const source = clean(config.bankQrImage, 180);
    if (!source) return [];
    const extension = extname(source).toLowerCase();
    const names = BANK_QR_MIME[extension]
      ? [
          source,
          ...Object.keys(BANK_QR_MIME).map((suffix) => `${source}${suffix}`),
        ]
      : Object.keys(BANK_QR_MIME).map((suffix) => `${source}${suffix}`);
    return [...new Set(names)]
      .map((name) => resolve(root, name))
      .filter((path) => path !== root && path.startsWith(root + sep));
  }

  async function findBankQrPath(config) {
    for (const path of bankQrCandidates(config)) {
      try {
        const info = await stat(path);
        if (info.isFile()) return path;
      } catch {
        // Windows thường ẩn đuôi file; thử ứng viên tiếp theo.
      }
    }
    return "";
  }

  async function paymentConfiguration(config) {
    const rawBankName = clean(config.bankName, 60);
    const rawAccountNumber = clean(config.bankAccountNumber, 40);
    const rawAccountLabel = clean(config.bankAccountLabel, 80);
    const qrPath = await findBankQrPath(config);
    const missing = [];
    if (!rawBankName) missing.push("MILO_BANK_NAME");
    if (!rawAccountNumber) missing.push("MILO_BANK_ACCOUNT_NUMBER");
    if (!rawAccountLabel) missing.push("MILO_BANK_ACCOUNT_NAME");
    const configured = missing.length === 0;
    return {
      configured,
      mode: configured ? (qrPath ? "qr" : "manual") : "unconfigured",
      bankName: rawBankName,
      accountNumber: rawAccountNumber,
      accountLabel: rawAccountLabel,
      qrConfigured: configured && Boolean(qrPath),
      qrPath: configured ? qrPath : "",
      missing,
    };
  }

  const paymentReady = async (config) =>
    (await paymentConfiguration(config)).configured;

  function loginAttemptKey(req, nickname) {
    return `${req.socket?.remoteAddress || "local"}:${nickname}`;
  }

  function loginBlocked(key) {
    const attempt = loginAttempts.get(key);
    if (!attempt) return 0;
    if (attempt.lockedUntil > Date.now()) return attempt.lockedUntil;
    if (Date.now() - attempt.windowStarted > LOGIN_ATTEMPT_WINDOW) {
      loginAttempts.delete(key);
      return 0;
    }
    return 0;
  }

  function recordFailedLogin(key) {
    const previous = loginAttempts.get(key);
    const withinWindow =
      previous && Date.now() - previous.windowStarted <= LOGIN_ATTEMPT_WINDOW;
    const next = {
      count: withinWindow ? previous.count + 1 : 1,
      windowStarted: withinWindow ? previous.windowStarted : Date.now(),
      lockedUntil: 0,
    };
    if (next.count >= LOGIN_ATTEMPT_LIMIT) {
      next.lockedUntil = Date.now() + LOGIN_LOCK_DURATION;
    }
    loginAttempts.set(key, next);
  }

  const databaseTimestamp = (item) =>
    new Date(item?.updatedAt || item?.createdAt || 0).getTime() || 0;

  function normalizeDatabase(parsed = {}) {
    const base = emptyDb();
    return {
      version: DATABASE_SCHEMA_VERSION,
      meta: {
        ...base.meta,
        ...(parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {}),
        schemaVersion: DATABASE_SCHEMA_VERSION,
        migratedFrom: Array.isArray(parsed.meta?.migratedFrom)
          ? parsed.meta.migratedFrom.map((item) => clean(item, 100))
          : [],
      },
      accounts: (Array.isArray(parsed.accounts) ? parsed.accounts : []).map((account) => ({ ...account, gradeProgress: normalizeAllGradeProgress(account.gradeProgress) })),
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
    };
  }

  async function legacyDatabasePaths() {
    const candidates = [legacyDatabasePath];
    const parentDirectory = dirname(root);
    try {
      const entries = await readdir(parentDirectory, { withFileTypes: true });
      entries
        .filter(
          (entry) =>
            entry.isDirectory() &&
            /^MiloEnglishAdventure/i.test(entry.name),
        )
        .forEach((entry) => {
          candidates.push(
            join(parentDirectory, entry.name, "data", "commerce.json"),
          );
        });
    } catch {
      // Không thể quét thư mục cạnh bên thì vẫn nhập DB của thư mục hiện tại.
    }
    const found = [];
    for (const candidate of [...new Set(candidates)]) {
      if (resolve(candidate) === resolve(databasePath)) continue;
      try {
        const info = await stat(candidate);
        if (info.isFile()) found.push(candidate);
      } catch {
        // Bản này chưa có DB cũ.
      }
    }
    return found;
  }

  function mergeLegacyDatabases(databases) {
    const accountGroups = new Map();
    databases.forEach((database) => {
      database.accounts.forEach((account) => {
        const nickname = normalizeNickname(account.nickname);
        const key = nickname ? `nick:${nickname}` : `id:${account.id}`;
        const group = accountGroups.get(key) || {
          winner: null,
          sourceIds: new Set(),
        };
        group.sourceIds.add(account.id);
        if (
          !group.winner ||
          databaseTimestamp(account) >= databaseTimestamp(group.winner)
        ) {
          group.winner = { ...account, nickname };
        }
        accountGroups.set(key, group);
      });
    });
    const accountIdMap = new Map();
    const accounts = [];
    accountGroups.forEach((group) => {
      if (!group.winner) return;
      accounts.push(group.winner);
      group.sourceIds.forEach((sourceId) =>
        accountIdMap.set(sourceId, group.winner.id),
      );
    });
    const accountById = new Map(accounts.map((account) => [account.id, account]));
    const purchaseMap = new Map();
    databases.forEach((database) => {
      database.purchases.forEach((sourcePurchase) => {
        const accountId =
          accountIdMap.get(sourcePurchase.accountId) || sourcePurchase.accountId;
        const account = accountById.get(accountId);
        if (!account) return;
        const purchase = {
          ...sourcePurchase,
          accountId,
          accountPublicId: account.publicId,
          accountNickname: account.nickname,
          displayName: account.displayName,
        };
        const key = purchase.id || purchase.orderId;
        const existing = purchaseMap.get(key);
        if (
          !existing ||
          databaseTimestamp(purchase) >= databaseTimestamp(existing)
        ) {
          purchaseMap.set(key, purchase);
        }
      });
    });
    const merged = emptyDb();
    merged.accounts = accounts;
    merged.purchases = [...purchaseMap.values()];
    return merged;
  }

  async function writeDatabase(db) {
    await mkdir(dataDirectory, { recursive: true });
    db.version = DATABASE_SCHEMA_VERSION;
    db.meta = {
      ...(db.meta && typeof db.meta === "object" ? db.meta : {}),
      schemaVersion: DATABASE_SCHEMA_VERSION,
      createdAt: db.meta?.createdAt || nowIso(),
      sharedSince: db.meta?.sharedSince || nowIso(),
      updatedAt: nowIso(),
      migratedFrom: Array.isArray(db.meta?.migratedFrom)
        ? db.meta.migratedFrom
        : [],
    };
    const temporaryPath = `${databasePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(db, null, 2), "utf8");
    await rename(temporaryPath, databasePath);
  }

  async function initializeDatabase() {
    try {
      await stat(databasePath);
      const parsed = JSON.parse(await readFile(databasePath, "utf8"));
      const oldVersion = Number(parsed.version || parsed.meta?.schemaVersion || 0);
      if (oldVersion < DATABASE_SCHEMA_VERSION || (parsed.accounts || []).some((account) => !account.gradeProgress)) {
        await mkdir(backupsDirectory, { recursive: true });
        await createDatabaseBackup("before-v60-20-progress-migration");
        const migrated = normalizeDatabase(parsed);
        migrated.meta.progressMigration = { fromVersion: oldVersion, toVersion: DATABASE_SCHEMA_VERSION, migratedAt: nowIso(), unitCount: PROGRESS_UNIT_COUNT, maxLevel: PROGRESS_MAX_LEVEL };
        await writeDatabase(migrated);
      }
      return;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const legacyPaths = await legacyDatabasePaths();
    const legacyDatabases = [];
    const importedNames = [];
    for (const path of legacyPaths) {
      try {
        const parsed = JSON.parse(await readFile(path, "utf8"));
        const database = normalizeDatabase(parsed);
        if (database.accounts.length || database.purchases.length) {
          legacyDatabases.push(database);
          importedNames.push(basename(dirname(dirname(path))));
        }
      } catch {
        // Bỏ qua DB cũ bị lỗi; DB mới vẫn được tạo an toàn.
      }
    }
    const initial = legacyDatabases.length
      ? mergeLegacyDatabases(legacyDatabases)
      : emptyDb();
    initial.meta.migratedFrom = [...new Set(importedNames)];
    initial.meta.sharedSince = nowIso();
    await writeDatabase(initial);
    if (legacyDatabases.length) {
      await createDatabaseBackup("migration");
    }
  }

  async function ensureDatabase() {
    if (!initializationPromise) {
      initializationPromise = initializeDatabase().catch((error) => {
        initializationPromise = null;
        throw error;
      });
    }
    await initializationPromise;
  }

  async function backupFiles() {
    try {
      const entries = await readdir(backupsDirectory, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
        const path = join(backupsDirectory, entry.name);
        const info = await stat(path);
        files.push({
          name: entry.name,
          createdAt: info.mtime.toISOString(),
          time: info.mtime.getTime(),
        });
      }
      return files.sort((a, b) => b.time - a.time);
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  async function createDatabaseBackup(label = "manual") {
    await mkdir(backupsDirectory, { recursive: true });
    const createdAt = nowIso();
    const safeStamp = createdAt.replace(/[:.]/g, "-");
    const safeLabel = clean(label, 30).replace(/[^a-z0-9_-]/gi, "") || "backup";
    const fileName = `commerce-${safeStamp}-${safeLabel}.json`;
    await copyFile(databasePath, join(backupsDirectory, fileName));
    return { fileName, createdAt };
  }

  async function ensureDailyBackup() {
    const files = await backupFiles();
    const today = nowIso().slice(0, 10);
    if (files.some((file) => file.createdAt.slice(0, 10) === today)) return;
    await createDatabaseBackup("auto");
  }

  async function databaseStatus(db = null) {
    const files = await backupFiles();
    const database = db || (await loadDb());
    return {
      version: Number(database.version || DATABASE_SCHEMA_VERSION),
      sharedAcrossVersions: true,
      storage: "shared-device",
      storageLabel: "DB dùng chung mọi phiên bản trên máy",
      backupCount: files.length,
      lastBackupAt: files[0]?.createdAt || null,
      migratedFrom: Array.isArray(database.meta?.migratedFrom)
        ? database.meta.migratedFrom
        : [],
    };
  }

  async function loadDb() {
    await ensureDatabase();
    try {
      return normalizeDatabase(
        JSON.parse(await readFile(databasePath, "utf8")),
      );
    } catch (databaseError) {
      const files = await backupFiles();
      for (const backup of files) {
        try {
          const backupPath = join(backupsDirectory, backup.name);
          const recovered = normalizeDatabase(
            JSON.parse(await readFile(backupPath, "utf8")),
          );
          recovered.meta.recoveredAt = nowIso();
          recovered.meta.recoveredFrom = backup.name;
          await writeDatabase(recovered);
          return recovered;
        } catch {
          // Thử bản sao cũ hơn.
        }
      }
      throw databaseError;
    }
  }

  async function mutate(mutator) {
    let result;
    mutationQueue = mutationQueue
      .catch(() => {})
      .then(async () => {
        const db = await loadDb();
        await ensureDailyBackup();
        result = await mutator(db);
        await writeDatabase(db);
      });
    await mutationQueue;
    return result;
  }

  async function accountFromToken(db, token) {
    if (!token) return null;
    const hash = await tokenHash(token);
    return db.accounts.find((account) => account.tokenHash === hash) || null;
  }

  function activatePurchase(db, purchase, confirmation = {}) {
    const account = db.accounts.find((item) => item.id === purchase.accountId);
    if (!account) return null;
    if (purchase.status !== "paid") {
      const startBase =
        account.activeUntil &&
        new Date(account.activeUntil).getTime() > Date.now()
          ? account.activeUntil
          : nowIso();
      purchase.status = "paid";
      purchase.paidAt = nowIso();
      purchase.activeFrom = startBase;
      purchase.activeUntil = addMonths(startBase, purchase.durationMonths);
    }
    purchase.providerStatus = "CONFIRMED_BY_ADMIN";
    purchase.amountPaid = Number(purchase.price);
    purchase.providerReference =
      clean(confirmation.reference, 80) ||
      purchase.providerReference ||
      "";
    purchase.confirmedAt = nowIso();
    purchase.confirmedBy = "admin";
    purchase.confirmationNote = clean(confirmation.note, 180);
    purchase.updatedAt = nowIso();
    account.status = "active";
    account.planId = purchase.planId;
    account.activeUntil = purchase.activeUntil;
    account.updatedAt = nowIso();
    return account;
  }

  async function accountPayload(db, account) {
    const purchases = db.purchases
      .filter((purchase) => purchase.accountId === account.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(publicPurchase);
    const latestPurchase = purchases[0] || null;
    const active = accountStatus(account) === "active";
    const aiAccess = aiAccessFor(account);
    return {
      account: publicAccount(account),
      courseAccess: {
        active: true,
        free: true,
        scope: "english-grade-2-5",
      },
      entitlement: {
        active,
        planId: active ? account.planId : "",
        planName: active ? planById(account.planId)?.name || "" : "",
        activeUntil: active ? account.activeUntil : null,
        features: active ? MILO_FEATURES : [],
      },
      aiAccess,
      latestPurchase,
      purchases,
    };
  }

  function requireAdmin(req, res, config) {
    const adminPass = String((config && config.adminPassword) || "").trim();
    if (!adminPass) {
      json(res, 503, {
        ok: false,
        code: "ADMIN_PASSWORD_REQUIRED",
        error:
          "Quản trị chưa được cấu hình. Hãy đặt MILO_ADMIN_PASSWORD trong .env rồi mở lại ứng dụng.",
        message:
          "Quản trị chưa được cấu hình. Hãy đặt MILO_ADMIN_PASSWORD trong .env rồi mở lại ứng dụng.",
      });
      return false;
    }
    const provided =
      req.headers["x-milo-admin"] ||
      req.headers["x-milo-admin-secret"] ||
      sanitizeHeader(req.headers.authorization) ||
      "";
    if (!safeEqual(provided, adminPass)) {
      json(res, 401, {
        ok: false,
        code: "INVALID_CREDENTIALS",
        error: "Mật khẩu quản trị không đúng.",
        message: "Tên đăng nhập hoặc mật khẩu không đúng.",
      });
      return false;
    }
    return true;
  }

  async function issueSession(account) {
    const token = randomBytes(32).toString("base64url");
    account.tokenHash = await tokenHash(token);
    account.updatedAt = nowIso();
    return token;
  }

  async function handle(req, res, url, config) {
    if (url.pathname === "/api/plans" && req.method === "GET") {
      json(res, 200, { plans: MILO_PLANS, commonFeatures: MILO_FEATURES });
      return true;
    }

    if (url.pathname === "/api/payment-provider" && req.method === "GET") {
      const payment = await paymentConfiguration(config);
      json(res, 200, {
        provider: "direct-bank-transfer",
        bankName: payment.bankName,
        accountLabel: payment.accountLabel,
        accountNumber: payment.accountNumber,
        configured: payment.configured,
        mode: payment.mode,
        qrConfigured: payment.qrConfigured,
        missing: payment.missing,
        automaticConfirmation: false,
        polling: false,
        manualConfirmation: true,
      });
      return true;
    }

    if (url.pathname === "/api/account/register" && req.method === "POST") {
      const input = await readBody(req);
      const displayName = clean(input.displayName, 24);
      const nickname = normalizeNickname(input.nickname);
      const pin = String(input.pin || "");
      const gender = ["boy", "girl", "other"].includes(input.gender)
        ? input.gender
        : "other";
      if (displayName.length < 2) {
        json(res, 400, { error: "Tên người học cần có ít nhất 2 ký tự." });
        return true;
      }
      if (!validNickname(nickname)) {
        json(res, 400, {
          error:
            "Nick cần 4–20 ký tự, bắt đầu bằng chữ và chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch dưới.",
        });
        return true;
      }
      const existingToken = bearer(req);
      const result = await mutate(async (db) => {
        const existing = await accountFromToken(db, existingToken);
        const nicknameOwner = db.accounts.find(
          (account) =>
            account.nickname === nickname && account.id !== existing?.id,
        );
        if (nicknameOwner) {
          return { code: 409, error: "Nick này đã có người sử dụng." };
        }
        if (existing) {
          if (existing.nickname && existing.nickname !== nickname) {
            return {
              code: 409,
              error: `Nick @${existing.nickname} đã được cố định cho tài khoản này.`,
            };
          }
          existing.nickname = nickname;
          existing.displayName = displayName;
          existing.gender = gender;
          if (!existing.pinHash) {
            if (!validPin(pin)) {
              return { code: 400, error: "Mã PIN phụ huynh phải gồm đúng 6 số." };
            }
            const secured = await hashPin(pin);
            existing.pinSalt = secured.salt;
            existing.pinHash = secured.hash;
          } else if (pin || input.currentPin) {
            const currentPin = String(input.currentPin || "");
            if (!validPin(currentPin) || !validPin(pin)) {
              return {
                code: 400,
                error: "Muốn đổi PIN, hãy nhập đúng PIN hiện tại và PIN mới gồm 6 số.",
              };
            }
            if (!(await verifyPin(currentPin, existing))) {
              return { code: 401, error: "Mã PIN hiện tại không đúng." };
            }
            const secured = await hashPin(pin);
            existing.pinSalt = secured.salt;
            existing.pinHash = secured.hash;
          }
          const profileUpdatedAt = nowIso();
          if (existingToken && !existing.lastLoginAt) {
            existing.lastLoginAt = profileUpdatedAt;
            existing.lastSeenAt = profileUpdatedAt;
            existing.loginCount = Math.max(1, Number(existing.loginCount || 0));
          }
          existing.updatedAt = profileUpdatedAt;
          return {
            code: 200,
            account: publicAccount(existing),
            token: existingToken,
          };
        }
        if (!validPin(pin)) {
          return { code: 400, error: "Mã PIN phụ huynh phải gồm đúng 6 số." };
        }
        const secured = await hashPin(pin);
        const createdAt = nowIso();
        const account = {
          id: randomUUID(),
          publicId: makePublicId(),
          nickname,
          pinSalt: secured.salt,
          pinHash: secured.hash,
          tokenHash: "",
          displayName,
          gender,
          selectedGrade: null,
          selectedPetId: "",
          selectedPetName: "",
          status: "new",
          planId: "",
          activeUntil: null,
          trialStartedAt: null,
          trialUntil: null,
          learningProfile: emptyLearningProfile(),
          gradeProgress: normalizeAllGradeProgress({}),
          lastLoginAt: createdAt,
          lastSeenAt: createdAt,
          loginCount: 1,
          loginDisabled: false,
          createdAt,
          updatedAt: createdAt,
        };
        const token = await issueSession(account);
        db.accounts.push(account);
        return { code: 201, account: publicAccount(account), token };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result);
      return true;
    }

    if (url.pathname === "/api/account/login" && req.method === "POST") {
      const input = await readBody(req);
      const nickname = normalizeNickname(input.nickname);
      const pin = String(input.pin || "");
      const attemptKey = loginAttemptKey(req, nickname);
      const blockedUntil = loginBlocked(attemptKey);
      if (blockedUntil) {
        json(res, 429, {
          error: `Đăng nhập tạm khóa đến ${new Date(blockedUntil).toLocaleTimeString("vi-VN")} do nhập sai PIN quá nhiều lần.`,
        });
        return true;
      }
      const result = await mutate(async (db) => {
        const account = db.accounts.find((item) => item.nickname === nickname);
        if (!account || !(await verifyPin(pin, account))) {
          return { code: 401, error: "Nick hoặc mã PIN không đúng." };
        }
        if (account.loginDisabled) {
          return {
            code: 403,
            error: "Tài khoản đang bị quản trị viên khóa đăng nhập.",
          };
        }
        const loginAt = nowIso();
        const token = await issueSession(account);
        account.lastLoginAt = loginAt;
        account.lastSeenAt = loginAt;
        account.loginCount = Number(account.loginCount || 0) + 1;
        account.updatedAt = loginAt;
        return { code: 200, account: publicAccount(account), token };
      });
      if (result.error) {
        recordFailedLogin(attemptKey);
        json(res, result.code, { error: result.error });
      } else {
        loginAttempts.delete(attemptKey);
        json(res, result.code, result);
      }
      return true;
    }

    if (url.pathname === "/api/account" && req.method === "GET") {
      const db = await loadDb();
      const account = await accountFromToken(db, bearer(req));
      if (!account) {
        json(res, 401, { error: "Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại." });
        return true;
      }
      if (account.loginDisabled) {
        json(res, 403, { error: "Tài khoản đang bị quản trị viên khóa đăng nhập." });
        return true;
      }
      json(res, 200, await accountPayload(db, account));
      return true;
    }

    if (url.pathname === "/api/pronunciation/entitlement" && req.method === "GET") {
      const db = await loadDb();
      const account = await accountFromToken(db, bearer(req));
      if (!account) {
        json(res, 401, { allowed: false, error: "Phiên đăng nhập không hợp lệ." });
        return true;
      }
      if (account.loginDisabled) {
        json(res, 403, { allowed: false, error: "Tài khoản đang bị khóa." });
        return true;
      }
      const access = aiAccessFor(account);
      const activeUntil = access.activeUntil || null;
      const stillValid = !activeUntil || new Date(activeUntil).getTime() > Date.now();
      const allowed = Boolean(access.active && stillValid && ["vip-pro-max", "vip-pro-max-trial"].includes(access.accessLevel));
      json(res, 200, {
        allowed,
        accessLevel: allowed ? access.accessLevel : "ai-plus",
        activeUntil: allowed ? activeUntil : null,
        trialAvailable: Boolean(access.trialAvailable),
        verifiedAt: nowIso(),
      });
      return true;
    }

    if (url.pathname === "/api/learning/profile" && req.method === "GET") {
      const db = await loadDb();
      const account = await accountFromToken(db, bearer(req));
      if (!account) {
        json(res, 401, {
          error: "Hãy đăng nhập tài khoản học viên để xem hồ sơ học tập.",
        });
        return true;
      }
      const aiAccess = aiAccessFor(account);
      const syncEnabled = Boolean(aiAccess.allAssistants);
      json(res, 200, {
        accessLevel: aiAccess.accessLevel,
        syncEnabled,
        profile: syncEnabled
          ? learningProfileFor(account)
          : {
              updatedAt: null,
              events: [],
              summary: learningSummaryFor([]),
            },
      });
      return true;
    }

    if (url.pathname === "/api/learning/events" && req.method === "POST") {
      const input = await readBody(req);
      const events = (Array.isArray(input.events) ? input.events : [input])
        .slice(0, 200)
        .map((item) => learningEventFrom(item))
        .filter(Boolean);
      if (!events.length) {
        json(res, 400, { error: "Dữ liệu học tập chưa hợp lệ." });
        return true;
      }
      const result = await mutate(async (db) => {
        const account = await accountFromToken(db, bearer(req));
        if (!account) {
          return {
            code: 401,
            error: "Hãy đăng nhập để đồng bộ tiến bộ học tập.",
          };
        }
        const aiAccess = aiAccessFor(account);
        if (!aiAccess.allAssistants) {
          return {
            code: 403,
            error:
              "Bộ nhớ học tập dài hạn được mở trong VIP PRO MAX và gói thử 24 giờ.",
          };
        }
        const profile =
          account.learningProfile &&
          typeof account.learningProfile === "object"
            ? account.learningProfile
            : emptyLearningProfile();
        profile.events = Array.isArray(profile.events) ? profile.events : [];
        const knownIds = new Set(profile.events.map((item) => item.id));
        events.forEach((event) => {
          if (!knownIds.has(event.id)) {
            profile.events.push(event);
            knownIds.add(event.id);
          }
        });
        profile.events = profile.events
          .sort((left, right) =>
            String(left.createdAt).localeCompare(String(right.createdAt)),
          )
          .slice(-500);
        profile.updatedAt = nowIso();
        account.learningProfile = profile;
        account.updatedAt = nowIso();
        return {
          code: 201,
          accessLevel: aiAccess.accessLevel,
          syncEnabled: true,
          profile: learningProfileFor(account),
        };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result);
      return true;
    }

    if (url.pathname === "/api/trial" && req.method === "POST") {
      const input = await readBody(req);
      const grade = Number(input.grade);
      const petId = clean(input.petId, 24).toLowerCase();
      const petName = MILO_PETS[grade]?.[petId] || "";
      if (![2, 3, 4, 5].includes(grade) || !petName) {
        json(res, 400, {
          error: "Hãy chọn đúng lớp và xác nhận một nhân vật trước khi dùng thử.",
        });
        return true;
      }
      const result = await mutate(async (db) => {
        const account = await accountFromToken(db, bearer(req));
        if (!account) {
          return { code: 401, error: "Hãy đăng nhập nick trước khi dùng thử." };
        }
        if (account.trialStartedAt) {
          return {
            code: 409,
            error: "Tài khoản này đã sử dụng gói thử VIP PRO MAX 24 giờ.",
          };
        }
        if (accountStatus(account) === "active") {
          return {
            code: 409,
            error: "Tài khoản đang có gói VIP PRO MAX trả phí.",
          };
        }
        if (account.selectedGrade && account.selectedGrade !== grade) {
          return {
            code: 409,
            error: `Nick @${account.nickname} đã khóa vào lớp ${account.selectedGrade}.`,
          };
        }
        if (account.selectedPetId && account.selectedPetId !== petId) {
          return {
            code: 409,
            error: `Nick @${account.nickname} đã khóa pet ${account.selectedPetName}.`,
          };
        }
        const startedAt = nowIso();
        account.selectedGrade = grade;
        account.selectedPetId = petId;
        account.selectedPetName = petName;
        account.trialStartedAt = startedAt;
        account.trialUntil = addHours(startedAt, 24);
        account.updatedAt = startedAt;
        return {
          code: 200,
          payload: await accountPayload(db, account),
        };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result.payload);
      return true;
    }

    const qrMatch = url.pathname.match(
      /^\/api\/purchases\/([a-f0-9-]+)\/qr$/,
    );
    if (qrMatch && req.method === "GET") {
      const db = await loadDb();
      const account = await accountFromToken(db, bearer(req));
      const purchase = db.purchases.find(
        (item) =>
          item.id === qrMatch[1] && item.accountId === account?.id,
      );
      const path = await findBankQrPath(config);
      if (!purchase || !path) {
        json(res, 404, { error: "Không tìm thấy QR của đơn hàng." });
        return true;
      }
      const image = await readFile(path);
      res.writeHead(200, {
        "Content-Type":
          BANK_QR_MIME[extname(path).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "private, no-store",
      });
      res.end(image);
      return true;
    }

    const cancelPurchaseMatch = url.pathname.match(/^\/api\/purchases\/([a-f0-9-]+)\/cancel$/);
    if (cancelPurchaseMatch && req.method === "POST") {
      const token = bearer(req);
      const result = await mutate(async (db) => {
        const account = await accountFromToken(db, token);
        if (!account) return { code: 401, error: "Hãy đăng nhập trước khi hủy đơn." };
        const purchase = db.purchases.find((item) => item.id === cancelPurchaseMatch[1] && item.accountId === account.id);
        if (!purchase) return { code: 404, error: "Không tìm thấy đơn cần hủy." };
        if (!OPEN_PURCHASE_STATUSES.has(purchase.status)) {
          return { code: 409, error: "Chỉ có thể hủy đơn đang chờ thanh toán." };
        }
        purchase.status = "cancelled";
        purchase.providerStatus = "CANCELLED_BY_USER";
        purchase.updatedAt = nowIso();
        if (accountStatus(account) !== "active") account.status = "new";
        account.updatedAt = nowIso();
        return { code: 200, payload: await accountPayload(db, account) };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result.payload);
      return true;
    }

    if (url.pathname === "/api/purchases" && req.method === "POST") {
      const payment = await paymentConfiguration(config);
      if (!payment.configured) {
        json(res, 503, {
          error: `Thiếu cấu hình thanh toán trong .env: ${payment.missing.join(", ") || "thông tin ngân hàng"}.`,
          missing: payment.missing,
        });
        return true;
      }
      const input = await readBody(req);
      const plan = planById(input.planId);
      const grade = Number(input.grade);
      const petId = clean(input.petId, 24).toLowerCase();
      const petName = MILO_PETS[grade]?.[petId] || "";
      if (!plan || ![2, 3, 4, 5].includes(grade) || !petName) {
        json(res, 400, { error: "Gói, lớp hoặc nhân vật chưa hợp lệ." });
        return true;
      }
      const token = bearer(req);
      const result = await mutate(async (db) => {
        const account = await accountFromToken(db, token);
        if (!account) {
          return { code: 401, error: "Hãy đăng nhập nick trước khi tạo đơn." };
        }
        if (account.selectedGrade && account.selectedGrade !== grade) {
          return {
            code: 409,
            error: `Nick @${account.nickname} đã khóa vào lớp ${account.selectedGrade}.`,
          };
        }
        if (account.selectedPetId && account.selectedPetId !== petId) {
          return {
            code: 409,
            error: `Nick @${account.nickname} đã khóa pet ${account.selectedPetName}.`,
          };
        }
        const currentPending = db.purchases.find(
          (purchase) =>
            purchase.accountId === account.id &&
            OPEN_PURCHASE_STATUSES.has(purchase.status),
        );
        if (currentPending) {
          if (input.replacePending === true) {
            currentPending.orderId = makeOrderId();
            currentPending.transferContent = `MILO ${randomBytes(4).toString("hex").toUpperCase()}`;
            currentPending.planId = plan.id;
            currentPending.planName = plan.name;
            currentPending.durationMonths = plan.durationMonths;
            currentPending.price = plan.price;
            currentPending.bankName = clean(config.bankName, 60);
            currentPending.bankAccountLabel = clean(config.bankAccountLabel, 80);
            currentPending.bankAccountNumber = clean(config.bankAccountNumber, 40);
            currentPending.providerStatus = "WAITING_ADMIN_CONFIRMATION";
            currentPending.amountPaid = 0;
            currentPending.updatedAt = nowIso();
          }
          return {
            code: 200,
            account: publicAccount(account),
            purchase: publicPurchase(currentPending),
          };
        }
        const orderId = makeOrderId();
        const transferContent = `MILO ${randomBytes(4).toString("hex").toUpperCase()}`;
        account.selectedGrade = grade;
        account.selectedPetId = petId;
        account.selectedPetName = petName;
        account.status = accountStatus(account) === "active" ? "active" : "pending";
        account.updatedAt = nowIso();
        const createdAt = nowIso();
        const purchase = {
          id: randomUUID(),
          orderId,
          accountId: account.id,
          accountPublicId: account.publicId,
          accountNickname: account.nickname,
          displayName: account.displayName,
          grade,
          petId,
          petName,
          planId: plan.id,
          planName: plan.name,
          durationMonths: plan.durationMonths,
          price: plan.price,
          transferContent,
          status: "pending",
          provider: "direct-bank-transfer",
          providerStatus: "WAITING_ADMIN_CONFIRMATION",
          bankName: clean(config.bankName, 60),
          bankAccountLabel: clean(config.bankAccountLabel, 80),
          bankAccountNumber: clean(config.bankAccountNumber, 40),
          providerReference: "",
          amountPaid: 0,
          createdAt,
          updatedAt: createdAt,
          paidAt: null,
          confirmedAt: null,
          confirmedBy: "",
          confirmationNote: "",
          activeFrom: null,
          activeUntil: null,
        };
        db.purchases.push(purchase);
        return {
          code: 201,
          account: publicAccount(account),
          purchase: publicPurchase(purchase),
        };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result);
      return true;
    }

    if (url.pathname === "/api/progress/snapshot" && req.method === "GET") {
      const db = await loadDb();
      const account = await accountFromToken(db, bearer(req));
      if (!account) { json(res, 401, { error: "Hãy đăng nhập để đồng bộ tiến độ." }); return true; }
      account.gradeProgress = normalizeAllGradeProgress(account.gradeProgress);
      json(res, 200, { gradeProgress: account.gradeProgress, unitCount: PROGRESS_UNIT_COUNT, maxLevel: PROGRESS_MAX_LEVEL, levelTargets: PROGRESS_LEVEL_TARGETS });
      return true;
    }

    if (url.pathname === "/api/progress/snapshot" && req.method === "POST") {
      const input = await readBody(req);
      const grade = Number(input.grade);
      if (![2, 3, 4, 5].includes(grade)) { json(res, 400, { error: "Lớp không hợp lệ." }); return true; }
      const result = await mutate(async (db) => {
        const account = await accountFromToken(db, bearer(req));
        if (!account) return { code: 401, error: "Hãy đăng nhập để đồng bộ tiến độ." };
        account.gradeProgress = normalizeAllGradeProgress(account.gradeProgress);
        account.gradeProgress[String(grade)] = mergeGradeProgress(account.gradeProgress[String(grade)], input.progress, grade);
        account.updatedAt = nowIso();
        return { code: 200, progress: account.gradeProgress[String(grade)], gradeProgress: account.gradeProgress };
      });
      if (result.error) json(res, result.code, { error: result.error }); else json(res, result.code, result);
      return true;
    }

    if (
      url.pathname === "/api/admin/database/backup" &&
      req.method === "POST"
    ) {
      if (!requireAdmin(req, res, config)) return true;
      await ensureDatabase();
      const backup = await createDatabaseBackup("manual");
      const db = await loadDb();
      json(res, 201, {
        backup,
        database: await databaseStatus(db),
      });
      return true;
    }

    if (url.pathname === "/api/admin/purchases" && req.method === "GET") {
      if (!requireAdmin(req, res, config)) return true;
      const db = await loadDb();
      const purchases = db.purchases
        .map((purchase) => {
          const account = db.accounts.find(
            (item) => item.id === purchase.accountId,
          );
          return {
            ...publicPurchase(purchase),
            account: account ? publicAccount(account) : null,
          };
        })
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const accounts = db.accounts
        .map((account) => {
          const relatedPurchases = purchases.filter(
            (purchase) => purchase.accountId === account.id,
          );
          const pendingPurchase =
            relatedPurchases.find((purchase) =>
              OPEN_PURCHASE_STATUSES.has(purchase.status),
            ) || null;
          const latestPurchase = relatedPurchases[0] || null;
          const access = aiAccessFor(account);
          return {
            ...publicAccount(account),
            aiAccess: {
              active: access.active,
              accessLevel: access.accessLevel,
              planId: access.planId,
              planName: access.planName,
              allAssistants: access.allAssistants,
              activeUntil: access.activeUntil,
              trialAvailable: access.trialAvailable,
              trialUsed: access.trialUsed,
            },
            purchaseCount: relatedPurchases.length,
            pendingPurchase: pendingPurchase
              ? {
                  id: pendingPurchase.id,
                  orderId: pendingPurchase.orderId,
                  status: pendingPurchase.status,
                  planName: pendingPurchase.planName,
                  price: pendingPurchase.price,
                  transferContent: pendingPurchase.transferContent,
                  createdAt: pendingPurchase.createdAt,
                }
              : null,
            latestPurchase: latestPurchase
              ? {
                  id: latestPurchase.id,
                  orderId: latestPurchase.orderId,
                  status: latestPurchase.status,
                  planName: latestPurchase.planName,
                  price: latestPurchase.price,
                  createdAt: latestPurchase.createdAt,
                }
              : null,
            learningProfile: learningProfileFor(account),
            purchases: relatedPurchases.map((purchase) => ({
              id: purchase.id,
              orderId: purchase.orderId,
              status: purchase.status,
              planId: purchase.planId,
              planName: purchase.planName,
              price: purchase.price,
              transferContent: purchase.transferContent,
              createdAt: purchase.createdAt,
              updatedAt: purchase.updatedAt,
              paidAt: purchase.paidAt,
              confirmedAt: purchase.confirmedAt,
              activeFrom: purchase.activeFrom,
              activeUntil: purchase.activeUntil,
            })),
          };
        })
        .sort((a, b) =>
          String(b.updatedAt || b.createdAt).localeCompare(
            String(a.updatedAt || a.createdAt),
          ),
        );
      const databaseUpdatedAt =
        [
          ...accounts.map((account) => account.updatedAt || account.createdAt),
          ...purchases.map(
            (purchase) => purchase.updatedAt || purchase.createdAt,
          ),
        ]
          .filter(Boolean)
          .sort()
          .at(-1) || null;
      const accessByAccount = accounts.map((account) => account.aiAccess);
      const storageStatus = await databaseStatus(db);
      json(res, 200, {
        purchases,
        accounts,
        database: {
          ...storageStatus,
          totalRecords: accounts.length + purchases.length,
          accountRecords: accounts.length,
          purchaseRecords: purchases.length,
          updatedAt: databaseUpdatedAt,
        },
        provider: {
          name: clean(config.bankName, 60) || "Chuyển khoản ngân hàng",
          configured: await paymentReady(config),
          automatic: false,
          manualConfirmation: true,
        },
        summary: {
          totalUsers: db.accounts.length,
          loggedInUsers: db.accounts.filter(
            (account) => Boolean(account.lastLoginAt || account.tokenHash),
          ).length,
          lockedUsers: db.accounts.filter((account) => Boolean(account.loginDisabled)).length,
          pending: purchases.filter((item) =>
            OPEN_PURCHASE_STATUSES.has(item.status),
          ).length,
          vipActive: accessByAccount.filter(
            (access) => access.accessLevel === "vip-pro-max",
          ).length,
          trialActive: accessByAccount.filter(
            (access) => access.accessLevel === "vip-pro-max-trial",
          ).length,
          freePlus: accessByAccount.filter(
            (access) => access.accessLevel === "plus",
          ).length,
          paid: purchases.filter((item) => item.status === "paid").length,
          revenue: purchases
            .filter((item) => item.status === "paid")
            .reduce((total, item) => total + Number(item.price || 0), 0),
        },
      });
      return true;
    }

    const adminAccountMatch = url.pathname.match(
      /^\/api\/admin\/accounts\/([a-f0-9-]+)\/(lock|unlock)$/,
    );
    if (adminAccountMatch && req.method === "POST") {
      if (!requireAdmin(req, res, config)) return true;
      const result = await mutate((db) => {
        const account = db.accounts.find((item) => item.id === adminAccountMatch[1]);
        if (!account) {
          return { code: 404, error: "Không tìm thấy tài khoản học viên." };
        }
        const shouldLock = adminAccountMatch[2] === "lock";
        account.loginDisabled = shouldLock;
        if (shouldLock) account.tokenHash = "";
        account.updatedAt = nowIso();
        return { code: 200, account: publicAccount(account) };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result);
      return true;
    }

    const adminResetPinMatch = url.pathname.match(
      /^\/api\/admin\/accounts\/([a-f0-9-]+)\/reset-pin$/,
    );
    if (adminResetPinMatch && req.method === "POST") {
      if (!requireAdmin(req, res, config)) return true;
      const input = await readBody(req);
      const newPin = String(input.pin || "");
      if (!validPin(newPin)) {
        json(res, 400, { error: "PIN mới phải gồm đúng 6 chữ số." });
        return true;
      }
      const result = await mutate(async (db) => {
        const account = db.accounts.find(
          (item) => item.id === adminResetPinMatch[1],
        );
        if (!account) {
          return { code: 404, error: "Không tìm thấy tài khoản học viên." };
        }
        const secured = await hashPin(newPin);
        account.pinSalt = secured.salt;
        account.pinHash = secured.hash;
        account.tokenHash = "";
        account.pinResetAt = nowIso();
        account.pinResetBy = "admin";
        account.updatedAt = account.pinResetAt;
        return { code: 200, account: publicAccount(account), newPin };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result);
      return true;
    }

    const adminDeleteAccountMatch = url.pathname.match(
      /^\/api\/admin\/accounts\/([a-f0-9-]+)$/,
    );
    if (adminDeleteAccountMatch && req.method === "DELETE") {
      if (!requireAdmin(req, res, config)) return true;
      const input = await readBody(req);
      const confirmation = normalizeNickname(input.confirmNickname);
      await createDatabaseBackup("before-account-delete");
      const result = await mutate((db) => {
        const index = db.accounts.findIndex(
          (item) => item.id === adminDeleteAccountMatch[1],
        );
        if (index < 0) {
          return { code: 404, error: "Không tìm thấy tài khoản học viên." };
        }
        const account = db.accounts[index];
        if (!confirmation || confirmation !== normalizeNickname(account.nickname)) {
          return {
            code: 400,
            error: `Hãy nhập đúng nick @${account.nickname} để xác nhận xóa.`,
          };
        }
        db.accounts.splice(index, 1);
        db.purchases = db.purchases.filter(
          (purchase) => purchase.accountId !== account.id,
        );
        return {
          code: 200,
          deleted: {
            id: account.id,
            nickname: account.nickname,
            displayName: account.displayName,
          },
        };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result);
      return true;
    }

    const adminMatch = url.pathname.match(
      /^\/api\/admin\/purchases\/([a-f0-9-]+)\/(confirm|reject)$/,
    );
    if (adminMatch && req.method === "POST") {
      if (!requireAdmin(req, res, config)) return true;
      const input = await readBody(req);
      const result = await mutate((db) => {
        const purchase = db.purchases.find((item) => item.id === adminMatch[1]);
        if (!purchase) {
          return { code: 404, error: "Không tìm thấy đơn hàng." };
        }
        if (adminMatch[2] === "confirm") {
          if (purchase.status === "paid") {
            return { code: 200, purchase: publicPurchase(purchase) };
          }
          if (purchase.status !== "pending") {
            return {
              code: 409,
              error: `Không thể xác nhận đơn đang ở trạng thái ${purchase.status}.`,
            };
          }
          if (
            clean(input.verificationContent, 80).toUpperCase() !==
            String(purchase.transferContent || "").toUpperCase()
          ) {
            return {
              code: 400,
              error:
                "Nội dung đối chiếu không khớp. Chưa kích hoạt gói Trợ lý AI.",
            };
          }
          activatePurchase(db, purchase, input);
          return { code: 200, purchase: publicPurchase(purchase) };
        }
        if (purchase.status === "paid") {
          return {
            code: 409,
            error: "Đơn đã kích hoạt Trợ lý AI nên không thể từ chối.",
          };
        }
        purchase.status = "rejected";
        purchase.providerStatus = "REJECTED_BY_ADMIN";
        purchase.confirmedAt = nowIso();
        purchase.confirmedBy = "admin";
        purchase.confirmationNote = clean(input.note, 180);
        purchase.updatedAt = nowIso();
        const account = db.accounts.find(
          (item) => item.id === purchase.accountId,
        );
        if (account && accountStatus(account) !== "active") {
          account.status = "rejected";
          account.updatedAt = nowIso();
        }
        return { code: 200, purchase: publicPurchase(purchase) };
      });
      if (result.error) json(res, result.code, { error: result.error });
      else json(res, result.code, result);
      return true;
    }

    return false;
  }

  async function authorize(req) {
    const db = await loadDb();
    const account = await accountFromToken(db, bearer(req));
    const aiAccess = aiAccessFor(account);
    return {
      active: aiAccess.active,
      account: account ? publicAccount(account) : null,
      plan:
        aiAccess.accessLevel === "vip-pro-max"
          ? planById(account.planId)
          : null,
      features: aiAccess.features,
      aiAccess,
      learningSummary:
        account && aiAccess.allAssistants
          ? learningProfileFor(account).summary
          : null,
    };
  }

  return { handle, authorize };
}
