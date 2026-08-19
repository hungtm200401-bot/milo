import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename, join } from 'node:path';

const UNIT_COUNT = 12;
const MAX_XP = 4900;
const TARGETS = [300,700,1100,1500,1900,2300,2700,3100,3500,3900,4400,4900];
const now = () => new Date().toISOString();
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
const levelForXp = (xp) => Math.min(50, 1 + Math.floor(clamp(xp, 0, MAX_XP) / 100));
const defaultUnit = (unit) => ({ unit, xp: 0, activities: {}, sections: {}, attempts: 0, wrongItems: [], weakAreas: [], lastScore: 0, bestScore: 0, completedAt: null, updatedAt: null });

function normalizeCompleted(value) {
  const source = Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
  const zeroBased = source.includes(0);
  return [...new Set(source.map((unit) => zeroBased ? unit + 1 : unit).filter((unit) => unit >= 1 && unit <= UNIT_COUNT))].sort((a,b) => a-b);
}

function normalizeGrade(raw, grade) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  const completedUnits = normalizeCompleted(safe.completedUnits || safe.completed || safe.doneUnits);
  const units = Object.fromEntries(Array.from({length:UNIT_COUNT},(_,index)=>{
    const unit=index+1, source=safe.units?.[String(unit)] || safe.units?.[unit] || {};
    return [String(unit), { ...defaultUnit(unit), ...source, unit }];
  }));
  const highest = completedUnits.at(-1) || 0;
  const minimumXp = highest ? TARGETS[highest-1] : 0;
  let xp = Math.max(minimumXp, clamp(safe.xp || safe.totalXp || 0, 0, MAX_XP));
  if (completedUnits.includes(12)) xp = MAX_XP;
  const currentUnit = clamp(safe.currentUnit || safe.unit || Math.min(12, highest + 1 || 1), 1, 12);
  return {
    schemaVersion: 20, grade, xp, level: levelForXp(xp), currentUnit,
    unlockedThrough: clamp(Math.max(currentUnit, highest ? Math.min(12, highest+1) : 1),1,12),
    completedUnits, units, highestLevel: Math.max(levelForXp(xp), clamp(safe.highestLevel || safe.level || 1,1,50)),
    classCompletedAt: completedUnits.includes(12) ? (safe.classCompletedAt || units['12'].completedAt || now()) : null,
    migratedAt: now(), updatedAt: now(),
  };
}

const input = resolve(process.argv[2] || join(process.cwd(), 'data', 'commerce.json'));
const raw = JSON.parse(await readFile(input, 'utf8'));
const stamp = now().replace(/[:.]/g,'-');
const backup = join(dirname(input), `${basename(input,'.json')}.before-v60-20-${stamp}.json`);
await copyFile(input, backup);

const report = [];
raw.accounts = (Array.isArray(raw.accounts) ? raw.accounts : []).map((account) => {
  const sourceAll = account.gradeProgress || account.progressByGrade || {};
  const gradeProgress = {};
  for (const grade of [2,3,4,5]) {
    const fallback = Number(account.selectedGrade) === grade ? (account.progress || account.learningProgress || {}) : {};
    const before = sourceAll[String(grade)] || fallback;
    gradeProgress[String(grade)] = normalizeGrade(before, grade);
  }
  report.push({ accountId: account.id, nickname: account.nickname, selectedGrade: account.selectedGrade || null, currentUnit: gradeProgress[String(account.selectedGrade || 2)].currentUnit, level: gradeProgress[String(account.selectedGrade || 2)].level, xp: gradeProgress[String(account.selectedGrade || 2)].xp });
  return { ...account, gradeProgress, updatedAt: account.updatedAt || now() };
});
raw.version = 7;
raw.meta = { ...(raw.meta || {}), schemaVersion: 7, updatedAt: now(), progressMigration: { migratedAt: now(), unitCount: 12, maxLevel: 50, backup } };
await writeFile(input, JSON.stringify(raw,null,2), 'utf8');
const reportPath = join(dirname(input), `migration-v60-20-report-${stamp}.json`);
await writeFile(reportPath, JSON.stringify({ input, backup, accounts: report.length, report },null,2), 'utf8');
console.log(JSON.stringify({ ok:true, input, backup, reportPath, accounts:report.length },null,2));
