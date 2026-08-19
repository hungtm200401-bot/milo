import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? path.resolve(process.cwd(), outputArg.slice('--output='.length)) : '';
const failOnDuplicate = process.argv.includes('--fail');
const resolvePath = (name) => {
  const candidates = [
    path.join(root, name),
    path.join(root, 'src', name),
    path.join(root, 'src', 'js', name),
    path.join(root, 'src', 'css', name),
    path.join(root, 'src', 'data', name),
  ];
  return candidates.find((cand) => fs.existsSync(cand)) || path.join(root, name);
};
const text = (name) => fs.readFileSync(resolvePath(name), 'utf8');

class Storage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(String(key)) ?? null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const dummyDocument = { querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, readyState: 'complete' };
const context = {
  console,
  localStorage: new Storage(),
  document: dummyDocument,
  location: { search: '', hash: '' },
  URLSearchParams,
  MutationObserver: class { observe() {} },
  setTimeout: () => 0,
  clearTimeout() {},
  SpeechSynthesisUtterance: class {},
  CSS: { escape: (value) => value },
  CustomEvent: class {},
  addEventListener() {},
  dispatchEvent() {},
  navigator: {},
  performance: { now: () => 0 },
};
context.window = context;
vm.createContext(context);
for (const file of [
  'grade2-source-content.js', 'grade2-sourcebook-data.js', 'grade3-sourcebook-data.js',
  'curriculum.js', 'vocab-expansion.js', 'power-words.js', 'now-i-know-readings.js',
  'now-i-know-alignment.js', 'grade2-full-knowledge.js', 'grade2-strict-source.js',
  'grade3-strict-source.js', 'grade2-sourcebook.js', 'grade3-sourcebook.js',
  'source-sections-v60-17.js', 'pronunciation-lexicon-v60-16.js', 'book-exercises-v60-23.js', 'micro-lesson-v60-19.js',
]) vm.runInContext(text(file), context, { filename: file });

const api = context.MILO_MICRO_LESSON_V60_19;
const normalize = (value) => String(value ?? '')
  .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(cau|bai|lan)\s*\d+\b/g, '$1')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const signature = (task) => [task?.kind, task?.prompt, task?.answer, task?.example, task?.target, task?.transcript]
  .map(normalize).join('|');

let totalActivities = 0;
let duplicates = 0;
let referenceReuseSections = 0;
const duplicateRows = [];
const perSection = [];
const entireSetSignatures = new Map();
const identicalCrossTypeSets = [];

for (const grade of [2, 3]) {
  const units = context.MILO_SOURCE_SECTIONS_V60_17.grades[String(grade)].units;
  for (let unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
    for (const section of units[unitIndex].sections) {
      const built = api.buildForTest(grade, unitIndex, section.id, 0);
      if (!built) continue;
      const stages = {
        guided: built.guidedTasks || [built.guided],
        independent: built.independentTasks || built.independent,
        quick: built.quickCheckTasks || built.quick,
      };
      const objects = new Map();
      const seen = new Map();
      let sectionTotal = 0;
      let sectionDuplicates = 0;
      for (const [stage, tasks] of Object.entries(stages)) {
        for (let index = 0; index < (tasks || []).length; index += 1) {
          const task = tasks[index];
          totalActivities += 1;
          sectionTotal += 1;
          const sig = signature(task);
          if (seen.has(sig)) {
            duplicates += 1;
            sectionDuplicates += 1;
            duplicateRows.push({
              grade, unit: unitIndex + 1, section: section.id, sectionType: built.sectionType,
              stage, index, duplicateOf: seen.get(sig), prompt: task.prompt,
              source: `micro-lesson-v60-19.js::${grade}-${unitIndex + 1}-${section.id}`,
            });
          } else seen.set(sig, `${stage}[${index}]`);
          if (objects.has(task)) referenceReuseSections += 1;
          else objects.set(task, `${stage}[${index}]`);
        }
      }
      const rate = Number((sectionDuplicates / Math.max(1, sectionTotal) * 100).toFixed(2));
      perSection.push({ grade, unit: unitIndex + 1, section: section.id, sectionType: built.sectionType, total: sectionTotal, duplicates: sectionDuplicates, rate });
      const setSignature = Object.entries(stages).map(([stage, tasks]) => `${stage}:${(tasks || []).map(signature).sort().join('~')}`).join('||');
      const prior = entireSetSignatures.get(setSignature);
      if (prior && prior.sectionType !== built.sectionType) identicalCrossTypeSets.push({ first: prior, second: { grade, unit: unitIndex + 1, section: section.id, sectionType: built.sectionType } });
      else entireSetSignatures.set(setSignature, { grade, unit: unitIndex + 1, section: section.id, sectionType: built.sectionType });
    }
  }
}

const sectionsOverFivePercent = perSection.filter((row) => row.rate > 5);
const report = {
  validatorVersion: '60.23.0',
  generatedAt: new Date().toISOString(),
  totalActivities,
  independentActivities: totalActivities - duplicates,
  duplicateActivities: duplicates,
  duplicateRate: Number((duplicates / Math.max(1, totalActivities) * 100).toFixed(2)),
  referenceReuseSections,
  sectionsOverFivePercent: sectionsOverFivePercent.length,
  identicalCrossTypeSets: identicalCrossTypeSets.length,
  target: { maximumPerSectionPercent: 5, desiredPerSectionPercent: 0 },
  passed: duplicates === 0 && referenceReuseSections === 0 && sectionsOverFivePercent.length === 0 && identicalCrossTypeSets.length === 0,
  duplicateRows,
  perSection,
  identicalCrossTypeSetRows: identicalCrossTypeSets,
};

const json = JSON.stringify(report, null, 2);
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, json);
}
console.log(json);
if (failOnDuplicate && !report.passed) process.exit(1);
