import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = new Map(process.argv.slice(2).map((arg) => { const [key, ...rest] = arg.split('='); return [key, rest.join('=') || true]; }));
const output = resolve(root, String(args.get('--output') || 'reports-v60-23/ANSWER_LEAKAGE_REPORT.json'));
const fail = args.has('--fail');
const resolvePath = (name) => {
  const candidates = [
    join(root, name),
    join(root, 'src', name),
    join(root, 'src', 'js', name),
    join(root, 'src', 'css', name),
    join(root, 'src', 'data', name),
  ];
  return candidates.find((cand) => existsSync(cand)) || join(root, name);
};
const text = (name) => readFileSync(resolvePath(name), 'utf8');
const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

class MemoryStorage { constructor(){ this.map = new Map(); } getItem(key){ return this.map.get(key) || null; } setItem(key,value){ this.map.set(key,String(value)); } removeItem(key){ this.map.delete(key); } }
const document = { querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, readyState: 'complete' };
const context = { console, localStorage: new MemoryStorage(), document, location: { search: '', hash: '' }, URLSearchParams,
  MutationObserver: class { observe() {} }, setTimeout: () => 0, clearTimeout() {}, SpeechSynthesisUtterance: class {}, CSS: { escape: (value) => value },
  CustomEvent: class {}, addEventListener() {}, dispatchEvent() {}, navigator: {}, performance: { now: () => 0 } };
context.window = context; vm.createContext(context);
for (const file of [
  'grade2-source-content.js','grade2-sourcebook-data.js','grade3-sourcebook-data.js','curriculum.js','vocab-expansion.js','power-words.js',
  'now-i-know-readings.js','now-i-know-alignment.js','grade2-full-knowledge.js','grade2-strict-source.js','grade3-strict-source.js',
  'grade2-sourcebook.js','grade3-sourcebook.js','source-sections-v60-17.js','pronunciation-lexicon-v60-16.js','book-exercises-v60-23.js','micro-lesson-v60-19.js',
]) vm.runInContext(text(file), context, { filename: file });

const failures = [];
const micro = text('micro-lesson-v60-19.js');
if (/data-answer-value/.test(micro)) failures.push({ type: 'dom_answer_attribute', file: 'micro-lesson-v60-19.js' });
if (/\$\{task\.example\}/.test(micro)) failures.push({ type: 'legacy_example_render', file: 'micro-lesson-v60-19.js' });
if (!/shuffledArrangeTokens\(task\.answer, task\.id\)/.test(micro)) failures.push({ type: 'arrange_order_not_guarded', file: 'micro-lesson-v60-19.js' });
if (!/if \(!reveal\)/.test(micro)) failures.push({ type: 'solution_reveal_not_gated', file: 'micro-lesson-v60-19.js' });

const catalog = JSON.parse(text('book-exercises-v60-23.json'));
for (const task of catalog.tasks) {
  const answer = normalize(task.answer); const prompt = normalize(task.prompt);
  const example = task.teachingExample || {}; const examplePrompt = normalize(example.prompt); const exampleAnswer = normalize(example.answer);
  if (!examplePrompt || !exampleAnswer) failures.push({ type: 'missing_teaching_example', id: task.id });
  if (examplePrompt === prompt || exampleAnswer === answer || (answer && (examplePrompt.includes(answer) || exampleAnswer.includes(answer)))) {
    failures.push({ type: 'book_example_leaks_answer', id: task.id, answer: task.answer });
  }
  if (task.source?.verificationStatus === 'ocr_extracted_needs_review') failures.push({ type: 'unreviewed_ocr_activated', id: task.id });
}

let totalTasks = 0; let bookTasksInRuntime = 0; let firstHintLeaks = 0; let storedLegacyExamples = 0;
for (const grade of [2,3]) for (let unitIndex = 0; unitIndex < 12; unitIndex += 1) {
  const sections = context.MILO_SOURCE_SECTIONS_V60_17.grades[String(grade)].units[unitIndex].sections;
  for (const section of sections) {
    const built = context.MILO_MICRO_LESSON_V60_19.buildForTest(grade, unitIndex, section.id, 0);
    if (!built) continue;
    for (const task of [...built.guidedTasks, ...built.independentTasks, ...built.quickCheckTasks]) {
      totalTasks += 1; if (task.origin === 'bookExercise') bookTasksInRuntime += 1;
      if (normalize(task.example)) { storedLegacyExamples += 1; failures.push({ type: 'legacy_example_stored', grade, unit: unitIndex + 1, section: section.id, id: task.id }); }
      const answer = normalize(task.answer); const firstHint = normalize(task.hintLevels?.[0] || task.hint);
      const answerWords = answer.split(' ').filter(Boolean);
      const clearLeak = firstHint === answer || (answerWords.length > 1 && answer.length >= 6 && firstHint.includes(answer));
      if (clearLeak) { firstHintLeaks += 1; failures.push({ type: 'first_hint_leaks_answer', grade, unit: unitIndex + 1, section: section.id, id: task.id }); }
    }
  }
}

const report = {
  validatorVersion: '60.23.0', generatedAt: new Date().toISOString(), passed: failures.length === 0,
  totals: { runtimeTasks: totalTasks, runtimeBookExercises: bookTasksInRuntime, catalogBookExercises: catalog.tasks.length,
    directVisualTasks: catalog.mappingSummary.directVisualTaskCount, verifiedMapTasks: catalog.mappingSummary.verifiedMapTaskCount,
    blockedOcrRows: catalog.mappingSummary.blockedRows, storedLegacyExamples, firstHintLeaks },
  checks: ['no answer data attribute','no legacy task example render','arrange tokens cannot keep correct order','answer reveal is gated',
    'book teaching examples differ from active prompt and answer','unreviewed OCR is not activated','first hint does not reveal multi-word answer'],
  failures,
};
mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (fail) assert.equal(report.passed, true, `${failures.length} answer leakage checks failed`);
