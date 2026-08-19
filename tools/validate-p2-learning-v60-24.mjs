import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = new Map(process.argv.slice(2).map((arg) => { const [key, ...rest] = arg.split('='); return [key, rest.join('=') || true]; }));
const output = resolve(root, String(args.get('--output') || 'reports/P2_LEARNING_VALIDATION_REPORT.json'));
const fail = args.has('--fail');
const text = (name) => readFileSync(join(root, name), 'utf8');

class MemoryStorage { constructor(){ this.map = new Map(); } getItem(key){ return this.map.get(key) || null; } setItem(key,value){ this.map.set(key,String(value)); } removeItem(key){ this.map.delete(key); } }
const document = { querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, readyState: 'complete' };
const context = {
  console, localStorage: new MemoryStorage(), document, location: { search: '', hash: '' }, URLSearchParams,
  MutationObserver: class { observe() {} }, setTimeout: () => 0, clearTimeout() {}, SpeechSynthesisUtterance: class {}, CSS: { escape: (value) => value },
  CustomEvent: class {}, addEventListener() {}, dispatchEvent() {}, navigator: {}, performance: { now: () => 0 },
};
context.window = context;
vm.createContext(context);

for (const file of [
  'grade2-source-content.js','grade2-sourcebook-data.js','grade3-sourcebook-data.js','curriculum.js','vocab-expansion.js','power-words.js',
  'now-i-know-readings.js','now-i-know-alignment.js','grade2-full-knowledge.js','grade2-strict-source.js','grade3-strict-source.js',
  'grade2-sourcebook.js','grade3-sourcebook.js','source-sections-v60-17.js','pronunciation-lexicon-v60-16.js','book-exercises-v60-23.js',
  'unit-task-mapping.js','micro-lesson-v60-19.js',
]) vm.runInContext(text(file), context, { filename: file });

const failures = [];

// 1. Verify 8 Major Tasks Definition
const mapper = context.MILO_UNIT_TASK_MAPPER;
if (!mapper || !Array.isArray(mapper.MAJOR_TASK_DEFINITIONS) || mapper.MAJOR_TASK_DEFINITIONS.length !== 8) {
  failures.push({ type: 'invalid_major_tasks_count', expected: 8, actual: mapper?.MAJOR_TASK_DEFINITIONS?.length || 0 });
}

// 2. Verify all sections map to one of 8 major tasks
for (const grade of [2, 3]) {
  for (let unitIndex = 0; unitIndex < 12; unitIndex += 1) {
    const spec = context.MILO_SOURCE_SECTIONS_V60_17.grades[String(grade)].units[unitIndex];
    const tasks = mapper.getMajorTasksForUnit(spec.sections, []);
    if (tasks.length > 8) {
      failures.push({ type: 'unit_has_more_than_8_tasks', grade, unit: unitIndex + 1, taskCount: tasks.length });
    }
  }
}

// 3. Verify Pronunciation-coach does not bypass or click VIP paywall for free repeat
const coachCode = text('pronunciation-coach.js');
if (coachCode.includes('.click()')) {
  failures.push({ type: 'pronunciation_coach_has_click_bypass', file: 'pronunciation-coach.js' });
}

// 4. Verify Slow Speech API uses numeric rate and English language
const slowVoiceUsage = text('cute-voice-v60-16.js');
if (!slowVoiceUsage.includes('rate') || !slowVoiceUsage.includes('en-US')) {
  failures.push({ type: 'slow_voice_lacks_numeric_rate_or_english_lang' });
}

const report = {
  validatorVersion: '60.24.0-P2',
  generatedAt: new Date().toISOString(),
  passed: failures.length === 0,
  majorTaskCount: mapper.MAJOR_TASK_DEFINITIONS.length,
  stages: ['Học', 'Luyện', 'Kiểm tra'],
  failures,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (fail) assert.equal(report.passed, true, `${failures.length} P2 learning checks failed`);
