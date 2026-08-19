import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const store = new Map();
const context = {
  window: {},
  console,
  URLSearchParams,
  location: { search: '', hash: '', pathname: '/lesson.html', reload() {} },
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
  },
  document: {
    readyState: 'loading',
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  },
  MutationObserver: class { observe() {} },
  SpeechSynthesisUtterance: class {},
  CSS: { escape(value) { return String(value); } },
  setTimeout,
  clearTimeout,
  Promise,
};
context.window.window = context.window;
context.window.document = context.document;
context.window.localStorage = context.localStorage;
context.window.location = context.location;
vm.createContext(context);

for (const file of [
  'grade2-source-content.js',
  'curriculum.js',
  'source-sections-v60-17.js',
  'micro-lesson-v60-19.js',
]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const source = JSON.parse(fs.readFileSync(path.join(root, 'source-sections-v60-17.json'), 'utf8'));
const api = context.window.MILO_MICRO_LESSON_V60_19;
assert.equal(api.version, '60.19.0');

const technical = new Set(['sourcebook', 'test', 'milo-grammar-levels', 'vipmax', 'games']);
const rows = [];
const errors = [];
let totalStudentSections = 0;
let clearInstructionCount = 0;
let exampleCount = 0;
let quickFiveCount = 0;
let minThreeActivityCount = 0;

for (const grade of [2, 3]) {
  for (let unitIndex = 0; unitIndex < 12; unitIndex += 1) {
    const spec = source.grades[String(grade)].units[unitIndex];
    for (const section of spec.sections) {
      if (technical.has(section.id)) continue;
      totalStudentSections += 1;
      const model = api.buildForTest(grade, unitIndex, section.id);
      try {
        assert.ok(model, `No model: G${grade} U${unitIndex + 1} ${section.id}`);
        assert.ok(model.objective, 'Missing objective');
        assert.ok(model.guided, 'Missing guided task');
        assert.ok(model.independent.length >= 3, `Only ${model.independent.length} activities`);
        assert.equal(model.quick.length, 5, `Quick check has ${model.quick.length}`);
        minThreeActivityCount += 1;
        quickFiveCount += 1;
        const tasks = [model.guided, ...model.independent, ...model.quick];
        for (const task of tasks) {
          assert.ok(task.prompt, 'Missing prompt');
          assert.ok(task.instruction, 'Missing instruction');
          const instructionWords = task.instruction.trim().split(/\s+/).length;
          assert.ok(instructionWords <= 18, `Instruction too long (${instructionWords}): ${task.instruction}`);
          clearInstructionCount += 1;
          assert.ok(task.example, `Missing example for ${task.id}`);
          exampleCount += 1;
          assert.ok(task.explanation, `Missing explanation for ${task.id}`);
        }
        if (section.sectionType.startsWith('Grammar')) assert.ok(model.independent.length >= 8, 'Grammar must have 8 tasks');
        if (section.sectionType === 'Listening') assert.ok(model.hasTranscript, 'Listening missing transcript');
        if (section.sectionType.startsWith('Reading')) {
          assert.ok(model.hasPassage, 'Reading missing passage');
          assert.ok(model.quick.some((task) => task.evidence), 'Reading missing evidence task');
        }
        if (section.sectionType === 'Speaking/Communication') assert.ok(model.independent.length >= 3, 'Speaking missing three rounds');
        if (section.sectionType === 'Writing') assert.ok(model.independent.some((task) => task.kind === 'write'), 'Writing missing write task');
        rows.push({ grade, unit: unitIndex + 1, part: section.id, sectionType: section.sectionType, activities: model.independent.length, quickQuestions: model.quick.length, status: 'PASS' });
      } catch (error) {
        errors.push({ grade, unit: unitIndex + 1, part: section.id, sectionType: section.sectionType, error: error.message });
        rows.push({ grade, unit: unitIndex + 1, part: section.id, sectionType: section.sectionType, activities: model?.independent?.length || 0, quickQuestions: model?.quick?.length || 0, status: 'FAIL' });
      }
    }
  }
}

const sampleUnits = [
  [2, 1], [2, 6], [2, 12], [3, 1], [3, 6], [3, 12],
];
const sampleMatrix = sampleUnits.map(([grade, unit]) => {
  const models = rows.filter((row) => row.grade === grade && row.unit === unit);
  return {
    grade,
    unit,
    sectionsChecked: models.length,
    passed: models.filter((row) => row.status === 'PASS').length,
    types: [...new Set(models.map((row) => row.sectionType))].join(' | '),
  };
});

const report = {
  version: '60.19.0',
  generatedAt: new Date().toISOString(),
  totalStudentSections,
  passedSections: rows.filter((row) => row.status === 'PASS').length,
  failedSections: errors.length,
  minimumThreeActivitiesCoverage: minThreeActivityCount,
  fiveQuestionQuickCheckCoverage: quickFiveCount,
  tasksWithClearInstruction: clearInstructionCount,
  tasksWithExample: exampleCount,
  sampleUnits: sampleMatrix,
  errors,
};

fs.writeFileSync(path.join(root, 'micro-lesson-quality-v60-19.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(root, 'reports-v60-19-validation-rows.json'), JSON.stringify(rows, null, 2));

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
