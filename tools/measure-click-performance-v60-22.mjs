import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const sourcePath = fs.existsSync(path.join(rootDir, 'public', 'interaction-performance-v60-22.js'))
  ? path.join(rootDir, 'public', 'interaction-performance-v60-22.js')
  : path.join(rootDir, 'interaction-performance-v60-22.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? path.resolve(rootDir, outputArg.slice('--output='.length)) : null;

function makeClassList() {
  const values = new Set();
  return {
    add: (...items) => items.forEach((item) => values.add(item)),
    remove: (...items) => items.forEach((item) => values.delete(item)),
    contains: (item) => values.has(item),
    toJSON: () => [...values],
  };
}

function makeButton(label = 'Kiểm tra đáp án') {
  const attrs = new Map();
  return {
    textContent: label,
    disabled: false,
    isConnected: true,
    dataset: {},
    classList: makeClassList(),
    setAttribute: (key, value) => attrs.set(key, String(value)),
    removeAttribute: (key) => attrs.delete(key),
    getAttribute: (key) => attrs.get(key),
  };
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))];
}

function stats(values) {
  return {
    count: values.length,
    p50Ms: Number(percentile(values, 0.50).toFixed(3)),
    p95Ms: Number(percentile(values, 0.95).toFixed(3)),
    maxMs: Number(Math.max(0, ...values).toFixed(3)),
    meanMs: Number((values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)).toFixed(3)),
  };
}

const context = {
  console,
  performance,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: (callback) => setTimeout(() => callback(performance.now()), 0),
  addEventListener() {},
  document: null,
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'interaction-performance-v60-22.js' });
const api = context.MILO_INTERACTION_PERF_V60_22;

const iterations = 120;
const responseTimes = [];
const assessmentTimes = [];
const nextQuestionTimes = [];
let executions = 0;
let duplicateExecutions = 0;
let duplicateSkipped = 0;

for (let index = 0; index < iterations; index += 1) {
  const button = makeButton();
  button.dataset.miloPointerdownAt = String(performance.now());
  const start = performance.now();
  const first = api.run(button, { action: 'check-answer', label: 'Đang kiểm tra...' }, async ({ mark, renderStart, renderDone }) => {
    executions += 1;
    // Representative local grading work: normalize and compare an answer.
    const expected = 'I like apples';
    const actual = index % 2 === 0 ? 'I like apples' : 'I like  apples.';
    const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    normalize(actual) === normalize(expected);
    mark('assessmentDone');
    renderStart();
    const fragment = { feedback: index % 2 === 0 ? 'correct' : 'retry', nextIndex: index + 1 };
    JSON.stringify(fragment);
    renderDone();
  });
  const duplicate = api.run(button, { action: 'check-answer', label: 'Đang kiểm tra...' }, async () => {
    duplicateExecutions += 1;
  });
  const immediate = api.records().at(-1);
  responseTimes.push(immediate.uiFeedback - Number(button.dataset.miloPointerdownAt));
  const [firstResult, duplicateResult] = await Promise.all([first, duplicate]);
  if (duplicateResult.skipped) duplicateSkipped += 1;
  assessmentTimes.push(firstResult.record.assessmentDone - firstResult.record.click);
  nextQuestionTimes.push(firstResult.record.finished - start);
}

const storageWrites = [];
const storage = { setItem(key, value) { storageWrites.push([key, value]); } };
const queue = api.createSaveQueue(storage, { delay: 1000 });
for (let index = 0; index < 100; index += 1) {
  queue.enqueue('milo-progress', JSON.stringify({ question: index, score: index }));
}
const queueResult = queue.flush();

const report = {
  version: '60.24.0',
  generatedAt: new Date().toISOString(),
  method: 'Node performance harness executing the production interaction runtime; local assessment and incremental render are representative deterministic operations.',
  thresholdsMs: { visualResponse: 100, localResult: 300, prefetchedNextQuestion: 300, longTask: 100 },
  sampleSize: iterations,
  visualResponse: stats(responseTimes),
  localAssessmentVisible: stats(assessmentTimes),
  nextQuestionReady: stats(nextQuestionTimes),
  singleExecution: {
    intendedExecutions: iterations,
    actualExecutions: executions,
    duplicateHandlerExecutions: duplicateExecutions,
    duplicateAttemptsSkipped: duplicateSkipped,
    passed: executions === iterations && duplicateExecutions === 0 && duplicateSkipped === iterations,
  },
  progressQueue: {
    enqueues: 100,
    physicalWrites: storageWrites.length,
    retainedQuestion: JSON.parse(storageWrites.at(-1)?.[1] || '{}').question,
    flushDurationMs: Number(queueResult.duration.toFixed(3)),
    passed: storageWrites.length === 1 && JSON.parse(storageWrites[0][1]).question === 99,
  },
  pass: percentile(responseTimes, .95) <= 100
    && percentile(assessmentTimes, .95) <= 300
    && percentile(nextQuestionTimes, .95) <= 300
    && executions === iterations
    && duplicateExecutions === 0
    && duplicateSkipped === iterations
    && storageWrites.length === 1,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
}
process.stdout.write(serialized);
if (!report.pass) process.exitCode = 1;
