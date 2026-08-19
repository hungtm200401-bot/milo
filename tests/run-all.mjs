import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { buildTutorPrompt } from "../server/tutor-prompt.mjs";
import { normalizeTutorResponse } from "../server/tutor-response.mjs";
import { buildSpatialConsensus } from "../tools/source-ocr-core.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const ocrLine = (id, engine, value, y = 10) => ({
  id,
  engine,
  text: value,
  confidence: 90,
  bbox: { x0: 10, y0: y, x1: 300, y1: y + 20 },
});

test("SOURCE OCR: machine consensus never publishes unverified book text", () => {
  const consensus = buildSpatialConsensus({
    windows: [ocrLine("w1", "windows", "How many days do you go to school?")],
    color: [ocrLine("c1", "tesseract-color", "How many days do you go to school?")],
    threshold: [ocrLine("t1", "tesseract-threshold", "How many days do you go to school?")],
  });
  assert.equal(consensus.length, 1);
  assert.equal(consensus[0].strongMachineConsensus, true);
  assert.equal(consensus[0].requiresVisualReview, true);
  assert.equal(consensus[0].visualVerificationStatus, "pending");
  assert.equal(consensus[0].publishedAsExactText, false);
});

test("SOURCE OCR: two Tesseract passes are not treated as independent proof", () => {
  const consensus = buildSpatialConsensus({
    windows: [],
    color: [ocrLine("c1", "tesseract-color", "Vocabulary 1")],
    threshold: [ocrLine("t1", "tesseract-threshold", "Vocabulary 1")],
  });
  assert.ok(consensus.length >= 1);
  assert.ok(consensus.every((row) => row.strongMachineConsensus === false));
  assert.ok(consensus.every((row) => row.publishedAsExactText === false));
});

test("direct visual transcriptions are traceable, generated, and never claim missing media", () => {
  const registry = JSON.parse(text("source-exact-transcriptions.json"));
  assert.equal(registry.entries.length, 16);
  assert.equal(registry.entries.filter((entry) => entry.coverage === "complete_visible_section").length, 15);
  assert.equal(registry.entries.filter((entry) => entry.coverage === "visible_text_only").length, 1);
  assert.equal(new Set(registry.entries.map((entry) => `${entry.grade}:${entry.unit}:${entry.sectionId}`)).size, registry.entries.length);

  const source = JSON.parse(text("source-sections-v60-17.json"));
  for (const entry of registry.entries) {
    assert.equal(entry.verificationMethod, "direct_model_visual_character_review");
    const unit = source.grades[String(entry.grade)].units.find((item) => item.unit === entry.unit);
    const section = unit.sections.find((item) => item.id === entry.sectionId);
    assert.ok(section, entry.id);
    assert.ok(entry.sourceImages.every((image) => section.sourceImage.includes(image)), entry.id);
    assert.ok(entry.sourceAssets.every((asset) => section.sourceAsset.includes(asset)), entry.id);
    assert.ok(entry.sourceAssets.every((asset) => existsSync(join(root, "content", asset))), entry.id);
    const transcription = entry.content.exactTranscription;
    assert.ok(transcription.title && transcription.blocks.length, entry.id);
    const exactText = JSON.stringify(transcription);
    assert.doesNotMatch(exactText, /EnglishFile|frenglish|Recommand|Imprimer|Titre amélior|Ask AL/i, entry.id);
  }

  const reading = registry.entries.find((entry) => entry.sectionId === "book-reading-1");
  assert.match(JSON.stringify(reading), /We’ve got art, ICT, maths, PE, science and music/);
  assert.match(JSON.stringify(reading), /“Well done, Billy!” says the teacher/);
  assert.equal(registry.entries.find((entry) => entry.sectionId === "book-listening").coverage, "visible_text_only");
  assert.ok(!registry.entries.some((entry) => ["book-pronunciation", "book-value"].includes(entry.sectionId)));

  const context = { window: {} };
  vm.runInNewContext(text("source-exact-transcriptions.js"), context);
  assert.equal(JSON.stringify(context.window.MILO_SOURCE_EXACT_TRANSCRIPTIONS), JSON.stringify(registry));
});

function resolvePath(name) {
  const candidates = [
    join(root, name),
    join(root, "public", name),
    join(root, "server", name),
    join(root, "bin", name),
    join(root, "content", name),
    join(root, "assets", name),
    join(root, "src", name),
    join(root, "src", "js", name),
    join(root, "src", "css", name),
    join(root, "src", "data", name),
    join(root, "src", "assets", name),
  ];
  for (const cand of candidates) {
    if (existsSync(cand)) return cand;
  }
  return join(root, name);
}

function text(name) {
  return readFileSync(resolvePath(name), "utf8");
}

test("structured prompt evaluates wrong or incomplete answers", () => {
  const prompt = buildTutorPrompt({
    grade: 3,
    question: "I go to school yesterday.",
    unit: "The past",
    part: "Speaking",
    accessLevel: "plus",
    learningTurn: { question: "What did you do yesterday?" },
  });
  assert.match(prompt, /YÊU CẦU ĐẦU RA BẮT BUỘC/);
  assert.match(prompt, /partly_correct/);
  assert.match(prompt, /speechSegments/);
  assert.match(prompt, /Câu luyện gần nhất đang chờ bé trả lời/);
});

test("normalizer preserves assessment and bilingual speech", () => {
  const result = normalizeTutorResponse(JSON.stringify({
    answer: "Con gần đúng. Say: I went to school yesterday.",
    evaluation: {
      status: "partly_correct",
      score: 72,
      childAnswer: "I go to school yesterday.",
      betterAnswer: "I went to school yesterday.",
      strength: "Con đã dùng đúng trạng từ yesterday.",
      reason: "Yesterday cần động từ quá khứ went.",
      retryPrompt: "Con nói lại câu đúng nhé.",
      shouldRetry: true,
    },
    next: { type: "repeat", question: "What did you do yesterday?" },
    speechSegments: [
      { lang: "vi-VN", text: "Con gần đúng." },
      { lang: "en-US", text: "I went to school yesterday." },
    ],
    language: "mixed",
    skill: "grammar",
  }));
  assert.equal(result.evaluation.status, "partly_correct");
  assert.equal(result.evaluation.score, 72);
  assert.equal(result.speechSegments[1].lang, "en-US");
  assert.equal(result.next.type, "repeat");
});

test("normalizer safely falls back from non-json model output", () => {
  const result = normalizeTutorResponse("Câu đúng là: She is reading.");
  assert.equal(result.evaluation.status, "not_applicable");
  assert.ok(result.answer.includes("She is reading"));
  assert.ok(result.speechSegments.length >= 1);
});

test("plus and vip permissions remain separated", () => {
  const journey = text("ai-journey-v60-13-14.js");
  assert.match(journey, /return isVip\(\) \? "pro" : "plus"/);
  assert.match(journey, /vip-pro-max-trial/);
  assert.match(journey, /VIP PRO MAX đang tự động hoạt động/);
});

test("bilingual UI and assessment files are loaded on both pages", () => {
  for (const page of ["index.html", "lesson.html"]) {
    const html = text(page);
    for (const file of [
      "ai-language-v60-14.js",
      "ai-feedback-v60-14.js",
      "ai-feedback-v60-14.css",
      "ai-conversation-polish-v60-14.css",
    "interaction-performance-v60-22.js",
    "interaction-performance-v60-22.css",
    ]) assert.ok(html.includes(file), `${page} missing ${file}`);
  }
});

test("service worker caches the new AI interface", () => {
  const sw = text("sw.js");
  assert.match(sw, /milo-v60-23/);
  assert.match(sw, /ai-feedback-v60-14\.js/);
  assert.match(sw, /ai-language-v60-14\.js/);
  assert.match(sw, /cute-voice-v60-16\.js/);
  assert.match(sw, /pronunciation-lexicon-v60-16\.js/);
});

test("all JavaScript and module files pass syntax check", () => {
  const files = [
    "server.mjs",
    "tutor-prompt.mjs",
    "tutor-response.mjs",
    "pet-tutor.js",
    "app-v37.js",
    "lesson-v37.js",
    "app-v39.js",
    "ai-language-v60-14.js",
    "ai-feedback-v60-14.js",
    "ai-journey-v60-13-14.js",
    "lesson.js",
    "source-sections-v60-17.js",
    "source-exact-transcriptions.js",
    "micro-lesson-v60-19.js",
    "interaction-performance-v60-22.js",
    "book-exercises-v60-23.js",
    "vocab-repeat-v60-23.js",
  ];
  for (const file of files) {
    const resolved = resolvePath(file);
    const run = spawnSync(process.execPath, ["--check", resolved], { encoding: "utf8" });
    assert.equal(run.status, 0, `${file}: ${run.stderr}`);
  }
});

test("required local files exist", () => {
  for (const file of [
    "Milo.exe",
    "server.mjs",
    "tutor-response.mjs",
    "ai-feedback-v60-14.css",
    "ai-conversation-polish-v60-14.css",
    "interaction-performance-v60-22.js",
    "interaction-performance-v60-22.css",
    "book-exercises-v60-23.js",
    "book-exercises-v60-23.json",
    "vocab-repeat-v60-23.js",
    "vocab-repeat-v60-23.css",
    "BOOK_EXERCISE_SOURCE_MAP_V60_23.csv",
    "source-exact-transcriptions.json",
    "source-exact-transcriptions.js",
  ]) assert.ok(existsSync(resolvePath(file)), file);
});

test("configuration template does not embed API keys, passwords, or payment secrets", () => {
  const sensitiveKeys = [
    "MILO_AI_API_KEY",
    "MILO_ADMIN_PASSWORD",
    "MILO_BANK_ACCOUNT_NUMBER",
    "MILO_BANK_ACCOUNT_NAME",
    "MILO_BANK_QR_IMAGE",
  ];
  for (const file of [".env.example"]) {
    const env = text(file);
    for (const key of sensitiveKeys) {
      const line = env.split(/\r?\n/).find((item) => item.startsWith(`${key}=`)) || `${key}=`;
      assert.equal(line.slice(key.length + 1).trim(), "", `${file} must not embed ${key}`);
    }
  }
});


test("371 source images have traceable mapping records", () => {
  const mapping = JSON.parse(text("source-image-map-v60-17.json"));
  assert.equal(mapping.total, 371);
  assert.equal(mapping.records.length, 371);
  assert.equal(mapping.records.filter((item) => item.grade === 2).length, 181);
  assert.equal(mapping.records.filter((item) => item.grade === 3).length, 190);
  const required = [
    "grade", "sourceZip", "sourceImage", "sourceRegion", "sourceStatus",
    "verificationStatus", "contentOrigin", "clarity", "sha256",
  ];
  for (const record of mapping.records) {
    for (const field of required) assert.ok(record[field], `${record.id} missing ${field}`);
    assert.ok(["book_source", "milo_practice"].includes(record.contentOrigin));
    assert.ok(Array.isArray(record.sectionTypes) && record.sectionTypes.length > 0);
  }
});

test("Grade 2-3 source integrity audit covers every image and Unit journey", () => {
  const report = JSON.parse(text("reports/SOURCE_EXACTNESS_V60_25.json"));
  const integrity = report.summary.imageIntegrity;
  assert.equal(report.passed, true);
  assert.equal(integrity.total, 371);
  assert.equal(integrity.present, 371);
  assert.equal(integrity.optimizedSizeMatched, 371);
  assert.equal(integrity.manifestSourceMatch, 371);
  assert.equal(integrity.mappingMatched, 371);
  assert.equal(integrity.runtimeCatalogMatched, 371);
  assert.equal(integrity.unitPagesMappedToJourney, integrity.unitPages);
  assert.equal(report.imageLedger.length, 371);
  assert.ok(report.imageLedger.every((item) => /^[a-f0-9]{64}$/.test(item.webpSha256)));
  assert.equal(report.summary.activeBookExercises.activeFromUnreviewedOcr, 0);
});

test("pending Grade 2-3 OCR cannot render as book text", () => {
  const lesson = text("lesson.js");
  assert.match(lesson, /const content=verified\?\(section\.content\|\|\{\}\):\{\}/);
  assert.match(lesson, /sourceText:_unreviewedOcr/);
  assert.match(lesson, /Đọc trực tiếp ảnh nguồn — không qua OCR/);
  assert.match(lesson, /data-source-asset/);
  assert.match(lesson, /sourcebook\?\.openAsset\?\.\(requestedAsset\)/);
  assert.match(text("grade2-sourcebook.js"), /function openAsset\(asset\)/);
  assert.match(text("grade3-sourcebook.js"), /function openAsset\(asset\)/);
});

test("Grade 2 and Grade 3 use dynamic per-unit journeys", () => {
  const source = JSON.parse(text("source-sections-v60-17.json"));
  for (const grade of ["2", "3"]) {
    assert.equal(source.grades[grade].units.length, 12);
    for (const unit of source.grades[grade].units) {
      assert.ok(unit.sections.length >= 10, `Grade ${grade} Unit ${unit.unit}`);
      assert.equal(unit.sections.at(-1).id, "test");
      assert.ok(unit.sections.some((section) => section.id === "sourcebook"));
      assert.ok(unit.sections.some((section) => section.contentOrigin === "book_source"));
    }
  }
  const signatures = source.grades["3"].units.map((unit) =>
    unit.sections.map((section) => section.sectionType).join("|")
  );
  assert.ok(new Set(signatures).size > 1, "Grade 3 units must not share one fixed route");
});

test("book source and Milo practice are never mislabeled", () => {
  const source = JSON.parse(text("source-sections-v60-17.json"));
  for (const grade of Object.values(source.grades)) {
    for (const unit of grade.units) {
      for (const section of unit.sections) {
        assert.ok(["book_source", "milo_practice"].includes(section.contentOrigin));
        if (section.contentOrigin === "book_source") {
          assert.ok(section.sourceImage.length > 0, `${section.grade}-${section.unit}-${section.id}`);
          assert.notEqual(section.sourceStatus, "milo_practice");
        } else {
          assert.notEqual(section.verificationStatus, "verified_from_image");
        }
      }
    }
  }
});

test("unit tests are restricted to their verified unit scope", () => {
  const source = JSON.parse(text("source-sections-v60-17.json"));
  for (const grade of Object.values(source.grades)) {
    for (const unit of grade.units) {
      const testSection = unit.sections.find((section) => section.id === "test");
      const review = unit.sections.find((section) => section.sectionType === "Review/Unit Check" && section.contentOrigin === "book_source");
      assert.ok(testSection);
      assert.ok(testSection.content.allowedVocabulary.length > 0);
      if (review) {
        assert.deepEqual(testSection.content.allowedVocabulary, review.content.allowedVocabulary);
        assert.deepEqual(testSection.content.allowedGrammar, review.content.allowedGrammar);
      }
    }
  }
});

test("lesson page loads dynamic source data and trace UI", () => {
  const html = text("lesson.html");
  const lesson = text("lesson.js");
  assert.match(html, /source-sections-v60-17\.js/);
  assert.match(html, /source-exact-transcriptions\.js/);
  assert.match(html, /source-sections-v60-17\.css/);
  assert.match(lesson, /MILO_SOURCE_SECTIONS_V60_17/);
  assert.match(lesson, /MILO_SOURCE_EXACT_TRANSCRIPTIONS/);
  assert.match(lesson, /Nguyên văn đã đối chiếu/);
  assert.match(lesson, /Nguồn đối chiếu/);
  assert.match(lesson, /Audio luyện tập do Milo tạo/);
  assert.match(lesson, /milo-grammar-levels/);
});

test("Grades 4 and 5 remain outside the dynamic source override", () => {
  const lesson = text("lesson.js");
  assert.match(lesson, /dynamic&&\[2,3\]\.includes\(state\.grade\)/);
  const source = JSON.parse(text("source-sections-v60-17.json"));
  assert.deepEqual(Object.keys(source.grades).sort(), ["2", "3"]);
});


test("student lesson never exposes raw OCR and has a guided flow", () => {
  const lesson = text("lesson.js");
  assert.doesNotMatch(lesson, /Milo đọc phần chữ nhận được/);
  assert.doesNotMatch(lesson, /<pre>\$\{esc\(clipped\)\}<\/pre>/);
  assert.match(lesson, /đang chờ chép và đối chiếu từng chữ/);
  assert.match(lesson, /Đọc trực tiếp ảnh nguồn — không qua OCR/);
  assert.match(lesson, /guided-lesson-flow/);
  assert.match(lesson, /Giảng nhanh/);
  assert.match(lesson, /Giảng kỹ/);
});

test("source trace is collapsed and OCR is admin-only", () => {
  const lesson = text("lesson.js");
  assert.match(lesson, /<details class="source-trace-panel">/);
  assert.doesNotMatch(lesson, /<details class="source-trace-panel" open>/);
  const review = text("source-review-v60-18.js");
  assert.match(review, /OCR thô · chỉ khu quản trị/);
  assert.match(review, /X-Milo-Admin/);
});

test("vocabulary cards include pronunciation and speaking actions", () => {
  const lesson = text("lesson.js");
  assert.match(lesson, /MILO_PRONUNCIATION_LEXICON/);
  assert.match(lesson, /Con luyện nói/);
  assert.match(lesson, /data-open-pronunciation/);
  assert.match(lesson, /Trọng âm:/);
});

test("V60.18 quality model covers every dynamic section", () => {
  const quality = JSON.parse(text("content-quality-v60-18.json"));
  const source = JSON.parse(text("source-sections-v60-17.json"));
  const expected = Object.values(source.grades).flatMap((grade) => grade.units).flatMap((unit) => unit.sections).length;
  assert.equal(quality.totalSections, expected);
  assert.equal(quality.studentVisibleRawOcr, 0);
  assert.ok(quality.rows.every((row) => row.rawOcrStudentVisible === false));
});


test("V60.19 micro lessons load on the student lesson page", () => {
  const html = text("lesson.html");
  assert.match(html, /micro-lesson-v60-19\.css/);
  assert.match(html, /micro-lesson-v60-19\.js/);
  assert.match(html, /learning-session\.css/);
  assert.match(html, /learning-session-flow\.js/);
  const sw = text("sw.js");
  assert.match(sw, /micro-lesson-v60-19\.css/);
  assert.match(sw, /micro-lesson-v60-19\.js/);
  assert.match(sw, /learning-session\.css/);
  assert.match(sw, /learning-session-flow\.js/);
});

test("child route has six sessions and only three visible learning phases", () => {
  const context = {};
  context.window = context;
  vm.createContext(context);
  vm.runInContext(text("learning-session-flow.js"), context, { filename: "learning-session-flow.js" });
  const flow = context.MILO_LEARNING_SESSION_FLOW;
  assert.equal(flow.sessions.length, 6);
  assert.deepEqual(Array.from(flow.phases, (phase) => phase.shortLabel), ["Học", "Luyện", "Kiểm tra"]);
  assert.equal(flow.describePart("book-big-question").number, 1);
  assert.equal(flow.describePart("book-reading-1").number, 2);
  assert.equal(flow.describePart("book-listening").number, 3);
  assert.equal(flow.describePart("book-grammar-2").number, 4);
  assert.equal(flow.describePart("book-writing").number, 5);
  assert.equal(flow.describePart("book-review-unit-check").number, 6);
});

test("micro lesson is the single canonical renderer during a Grade 2 or 3 learning task", () => {
  const html = text("lesson.html");
  assert.ok(html.indexOf("micro-lesson-v60-19.js") < html.indexOf("lesson.js?v="));
  const lesson = text("lesson.js");
  const micro = text("micro-lesson-v60-19.js");
  assert.match(lesson, /microLesson\?\.canHandle/);
  assert.match(lesson, /microLesson\.mountCurrent\(\)/);
  assert.doesNotMatch(micro, /new MutationObserver/);
  assert.match(micro, /micro-focus-mode/);
});

test("deep teaching is default and covers source, meaning, common errors, worked example and checks", () => {
  const micro = text("micro-lesson-v60-19.js");
  for (const label of [
    "MILO GIẢNG CHUYÊN SÂU", "CHỮ TRONG SÁCH ĐÃ ĐỐI CHIẾU TRỰC TIẾP",
    "Ý nghĩa", "Cấu trúc", "Cách dùng", "Lỗi hay gặp", "HỌC CÁCH LÀM · VÍ DỤ KHÁC",
    "Học chuyên sâu", "Luyện có hướng dẫn", "Vận dụng và kiểm tra",
  ]) assert.ok(micro.includes(label), label);
  assert.match(micro, /deepTeachingHtml\(ctx, tasks\)/);
  assert.match(micro, /exactVerification/);
  assert.match(micro, /teachingExampleHtml\(tasks\.guided, ctx\)/);
});

test("focused lesson layout removes competing navigation and keeps child text readable", () => {
  const css = text("learning-session.css");
  assert.match(css, /body\.micro-focus-mode \.lesson-main-nav,/);
  assert.match(css, /body\.micro-focus-mode \.lesson-nav,/);
  assert.match(css, /body\.micro-focus-mode \.milo-coach/);
  assert.match(css, /font-size: 18px/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /min-height: 56px/);
});

test("seven real steps are gated and completion requires 80 percent", () => {
  const micro = text("micro-lesson-v60-19.js");
  for (const label of [
    "Milo giảng", "Học cách làm", "Làm cùng Milo", "Con tự làm",
    "Milo chữa bài", "Kiểm tra nhanh", "Hoàn thành",
  ]) assert.ok(micro.includes(label), label);
  assert.match(micro, /progress\.quickScore >= 80/);
  assert.match(micro, /if \(!progress\.quickPassed\)/);
  assert.doesNotMatch(micro, /Đánh dấu đã học/);
});

test("wrong answers use staged help before revealing the solution", () => {
  const micro = text("micro-lesson-v60-19.js");
  for (const label of ["Chưa đúng, nhưng Milo chưa mở đáp án", "Phần cần xem lại", "Con thử lại", "Milo giảng lại bằng một ví dụ khác", "Xem cách làm từng bước"]) {
    assert.ok(micro.includes(label), label);
  }
  assert.match(micro, /progress\.attempts\[task\.id\]/);
  assert.match(micro, /data-reveal-solution/);
});

test("primary skills have real task generators", () => {
  const micro = text("micro-lesson-v60-19.js");
  for (const marker of [
    "type.startsWith('Vocabulary')", "type === 'Pronunciation'",
    "type.startsWith('Grammar')", "type === 'Listening'",
    "type === 'Reading 1'", "type === 'Speaking/Communication'",
    "type === 'Writing'",
  ]) assert.ok(micro.includes(marker), marker);
  assert.match(micro, /kind === 'arrange'/);
  assert.match(micro, /kind === 'write'/);
  assert.match(micro, /kind === 'speak'/);
});

test("student micro lesson hides technical source labels", () => {
  const micro = text("micro-lesson-v60-19.js");
  assert.doesNotMatch(micro, />BOOK SOURCE</);
  assert.doesNotMatch(micro, />MILO PRACTICE</);
  assert.doesNotMatch(micro, /verificationStatus/);
  assert.match(micro, /Đối chiếu nguồn được lưu trong khu Quản trị của Milo/);
});

test("hand-holding mode and one-current-task prompt are implemented", () => {
  const micro = text("micro-lesson-v60-19.js");
  assert.match(micro, /Milo hướng dẫn từng bước/);
  assert.match(micro, /VIỆC CON CẦN LÀM BÂY GIỜ/);
  assert.match(micro, /data-main-action/);
  assert.match(micro, /data-guide-toggle/);
});


class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}
function progressionApi(seed = {}) {
  const localStorage = new MemoryStorage(seed);
  const context = { console, localStorage, setTimeout: () => 0, clearTimeout() {}, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } }, dispatchEvent() {}, addEventListener() {} };
  context.window = context;
  vm.runInNewContext(text("unit-progression-v60-20.js"), context, { filename: "unit-progression-v60-20.js" });
  return { api: context.MILO_UNIT_PROGRESSION, storage: localStorage };
}
function curriculumData() {
  const context = { window: {} };
  vm.runInNewContext(text("grade2-source-content.js"), context, { filename: "grade2-source-content.js" });
  vm.runInNewContext(text("curriculum.js"), context, { filename: "curriculum.js" });
  return context.window.MILO_CURRICULUM;
}

test("all four grades contain exactly 12 real units", () => {
  const curriculum = curriculumData();
  for (const grade of [2, 3, 4, 5]) assert.equal(curriculum[grade].units.length, 12, `Grade ${grade}`);
});

test("the exact 12 Unit to Level targets are enforced", () => {
  const { api } = progressionApi();
  assert.deepEqual(Array.from(api.LEVEL_TARGETS), [4,8,12,16,20,24,28,32,36,40,45,50]);
  assert.equal(api.UNIT_COUNT, 12);
  assert.equal(api.MAX_LEVEL, 50);
  assert.equal(api.MAX_XP, 4900);
});

test("completion of Unit 12 reaches exactly Lv.50 and never exceeds it", () => {
  const { api } = progressionApi();
  for (let unit = 1; unit <= 12; unit += 1) {
    const result = api.completeUnit({ grade: 3, unitNumber: unit, requiredSections: [], score: 100 });
    assert.equal(result.ok, true, `Unit ${unit}`);
    assert.equal(result.progress.level, api.levelTargetForUnit(unit));
  }
  const final = api.summary(3);
  assert.equal(final.level, 50);
  assert.equal(final.xp, 4900);
  api.awardActivity({ grade: 3, unitNumber: 12, sectionId: "x", type: "test", itemId: "extra" });
  assert.equal(api.summary(3).level, 50);
  assert.equal(api.summary(3).xp, 4900);
});

test("XP is granted once per real activity and not by opening a page", () => {
  const { api } = progressionApi();
  assert.equal(api.summary(2).xp, 0);
  const first = api.awardActivity({ grade: 2, unitNumber: 1, sectionId: "vocab", type: "exercise", itemId: "q1" });
  const duplicate = api.awardActivity({ grade: 2, unitNumber: 1, sectionId: "vocab", type: "exercise", itemId: "q1" });
  assert.equal(first.awarded, 8);
  assert.equal(duplicate.awarded, 0);
  assert.equal(api.summary(2).xp, 8);
});

test("each grade keeps independent progress and restart persistence", () => {
  const storage = new MemoryStorage();
  const first = progressionApi();
  first.api.completeUnit({ grade: 2, unitNumber: 1, score: 100 });
  assert.equal(first.api.summary(2).level, 4);
  assert.equal(first.api.summary(3).level, 1);
  const seed = Object.fromEntries(first.storage.map.entries());
  const restarted = progressionApi(seed);
  assert.equal(restarted.api.summary(2).level, 4);
  assert.deepEqual(Array.from(restarted.api.summary(2).completedUnits), [1]);
});

test("legacy Unit 13-16 progress is backed up and migrated into 1-12", () => {
  const seed = {
    "milo-completed-3": JSON.stringify([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
    "milo-unit-3": "14",
    "milo-lesson-parts-3-14": JSON.stringify(["vocabulary"]),
    "milo-level-3": "50",
    "milo-xp-3": "4900",
  };
  const { api, storage } = progressionApi(seed);
  const migrated = api.summary(3);
  assert.equal(migrated.currentUnit, 12);
  assert.equal(migrated.completedUnits.length, 12);
  assert.equal(migrated.level, 50);
  assert.ok(storage.getItem("milo-progress-backup-v60-20-3"));
  assert.equal(storage.getItem("milo-lesson-parts-3-14"), null);
});

test("student and admin pages expose the same 12-Unit progress model", () => {
  const index = text("index.html"), lesson = text("lesson.html"), admin = text("admin.html"), adminJs = text("admin-vip-pro-max-v60-7.js"), server = text("commerce-server.mjs");
  assert.match(index, /unit-progression-v60-20\.js/);
  assert.match(lesson, /unit-progression-v60-20\.js/);
  assert.match(admin, /Tiến độ 12 Unit/);
  assert.match(adminJs, /4\.900 XP/);
  assert.match(server, /\/api\/progress\/snapshot/);
  assert.match(server, /gradeProgress/);
});

test("Unit 13-16 are absent from student DOM, admin DOM and progression data", () => {
  const combined = [text("index.html"), text("lesson.html"), text("admin.html"), text("unit-progression-v60-20.js")].join("\n");
  assert.doesNotMatch(combined, /\bUnit\s+(13|14|15|16)\b/i);
  assert.doesNotMatch(combined, /\bUNIT\s+(13|14|15|16)\b/);
});

test("12-unit grid is responsive at the required screen widths", () => {
  const css = text("unit-progression-v60-20.css");
  assert.match(css, /repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(css, /max-width:1279px/);
  assert.match(css, /max-width:999px/);
  assert.match(css, /max-width:719px/);
  assert.match(css, /overflow-x:hidden/);
});

test("database migration is backed up and caps units and levels", () => {
  const server = text("commerce-server.mjs");
  const migration = text("tools/migrate-progress-v60-20.mjs");
  assert.match(server, /before-v60-20-progress-migration/);
  assert.match(server, /DATABASE_SCHEMA_VERSION = 7/);
  assert.match(migration, /UNIT_COUNT = 12/);
  assert.match(migration, /MAX_XP = 4900/);
  assert.match(migration, /copyFile\(input, backup\)/);
});


let cachedMicroLessonContext = null;
function microLessonContext() {
  if (cachedMicroLessonContext) return cachedMicroLessonContext;
  const storage = new MemoryStorage();
  const dummyDocument = { querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, readyState: "complete" };
  const context = {
    console, localStorage: storage, document: dummyDocument, location: { search: "", hash: "" }, URLSearchParams,
    MutationObserver: class { observe() {} }, setTimeout: () => 0, clearTimeout() {},
    SpeechSynthesisUtterance: class {}, CSS: { escape: (value) => value }, CustomEvent: class {},
    addEventListener() {}, dispatchEvent() {}, navigator: {}, performance: { now: () => 0 },
  };
  context.window = context;
  vm.createContext(context);
  for (const file of [
    "grade2-source-content.js", "grade2-sourcebook-data.js", "grade3-sourcebook-data.js",
    "curriculum.js", "vocab-expansion.js", "power-words.js", "now-i-know-readings.js",
    "now-i-know-alignment.js", "grade2-full-knowledge.js", "grade2-strict-source.js",
    "grade3-strict-source.js", "grade2-sourcebook.js", "grade3-sourcebook.js",
    "source-sections-v60-17.js", "source-exact-transcriptions.js", "learning-session-flow.js",
    "pronunciation-lexicon-v60-16.js", "book-exercises-v60-23.js", "micro-lesson-v60-19.js",
  ]) vm.runInContext(text(file), context, { filename: file });
  cachedMicroLessonContext = context;
  return context;
}

const normalizedTask = (task) => [task.kind, task.prompt, task.answer, task.example, task.target]
  .map((value) => String(value || "").toLowerCase().replace(/[^a-z0-9à-ỹđ]+/gi, " ").trim()).join("|");

test("every new and legacy account can select all 12 Units without XP side effects", () => {
  const { api } = progressionApi();
  const before = api.summary(2);
  for (let unit = 1; unit <= 12; unit += 1) {
    assert.equal(api.isUnitUnlocked(2, unit), true, `Unit ${unit}`);
    const result = api.setCurrentUnit(2, unit);
    assert.equal(result.ok, true, `set Unit ${unit}`);
  }
  const after = api.summary(2);
  assert.equal(after.xp, before.xp);
  assert.deepEqual(Array.from(after.completedUnits), Array.from(before.completedUnits));
  assert.equal(after.currentUnit, 12);

  const legacy = progressionApi({
    "milo-unit-progression-v60-20": JSON.stringify({ schemaVersion: 20, grades: { "2": { currentUnit: 1, unlockedThrough: 1, xp: 0, completedUnits: [] } } }),
  }).api.summary(2);
  assert.equal(legacy.unlockedThrough, 12);
  assert.equal(legacy.xp, 0);
  assert.deepEqual(Array.from(legacy.completedUnits), []);
});

test("student Unit UI has only learning states and no sequential disabled lock", () => {
  const index = text("index.html");
  assert.match(index, /Chưa học/);
  assert.match(index, /Đang học/);
  assert.match(index, /Đã hoàn thành/);
  assert.doesNotMatch(index, /unit\.locked/);
  assert.doesNotMatch(index, /disabled=\$\{locked/);
  assert.match(index, /Hoàn thành lớp · /);
});

test("voice reply controller provides immediate states, stop, timeout and typed fallback", () => {
  const voice = text("voice-reply-v60-21.js");
  for (const message of ["Đang xin quyền micro", "Milo đang nghe", "Đang xử lý câu nói", "Không nghe rõ, con thử lại nhé"]) assert.ok(voice.includes(message), message);
  assert.match(voice, /getUserMedia/);
  assert.match(voice, /12000/);
  assert.match(voice, /stopImmediatePropagation/);
  assert.match(voice, /Trình chạy không hỗ trợ nhận giọng nói/);
  assert.match(voice, /Không tìm thấy micro/);
  assert.match(voice, /Mất mạng/);
  assert.match(voice, /focus\(\{ preventScroll: true \}\)/);
  for (const page of ["index.html", "lesson.html"]) assert.match(text(page), /voice-reply-v60-21\.js/);
});

test("VIP pronunciation fails closed and verifies entitlement on the server", () => {
  const coach = text("pronunciation-coach.js");
  const server = text("commerce-server.mjs");
  assert.match(server, /\/api\/pronunciation\/entitlement/);
  assert.match(server, /accountFromToken\(db, bearer\(req\)\)/);
  assert.match(server, /\["vip-pro-max", "vip-pro-max-trial"\]/);
  assert.match(coach, /verifyVipEntitlement/);
  assert.match(coach, /fetch\("\/api\/pronunciation\/entitlement"/);
  assert.match(coach, /if \(!entitlementValid\(entitlement\)\) \{ showUpgrade\(\); return false; \}/);
  assert.doesNotMatch(coach, /function hasVipAccess\(\)[\s\S]{0,180}readAccess\(\)/);
  assert.match(coach, /window\.MILO_PRONUNCIATION_COACH/);
  assert.match(coach, /verifyAccess/);
  assert.match(coach, /mountEntry\(\); bindOpenGuard\(\);/);
  assert.doesNotMatch(coach, /mountEntry\(\); mountModal\(\); bind\(\)/);
});

test("unauthorized pronunciation UI is a compact paywall, not the full coach", () => {
  const coach = text("pronunciation-coach.js");
  assert.match(coach, /Dùng thử 24 giờ/);
  assert.match(coach, /Xem gói VIP PRO MAX/);
  assert.match(coach, /data-access="checking"/);
  assert.match(coach, /entry\.dataset\.access = allowed \? "allowed" : "locked"/);
  assert.match(coach, /\$\("#pronunciationModal"\)\?\.remove\(\)/);
});

test("Guided, Independent and Quick Check use independent banks with zero duplicates", () => {
  const context = microLessonContext();
  const api = context.MILO_MICRO_LESSON_V60_19;
  for (const grade of [2, 3]) for (const unitIndex of [0, 5, 11]) {
    const sections = context.MILO_SOURCE_SECTIONS_V60_17.grades[String(grade)].units[unitIndex].sections
      .filter((section) => !["sourcebook", "milo-grammar-levels"].includes(section.id));
    for (const section of sections) {
      const built = api.buildForTest(grade, unitIndex, section.id, 0);
      if (!built) continue;
      const banks = [built.guidedTasks, built.independentTasks, built.quickCheckTasks];
      assert.ok(banks.every((bank) => Array.isArray(bank) && bank.length > 0), `${grade}-${unitIndex + 1}-${section.id}`);
      const objects = banks.flat();
      assert.equal(new Set(objects).size, objects.length, `shared object ${grade}-${unitIndex + 1}-${section.id}`);
      const signatures = objects.map(normalizedTask);
      assert.equal(new Set(signatures).size, signatures.length, `duplicate ${grade}-${unitIndex + 1}-${section.id}`);
    }
  }
  const report = JSON.parse(text("reports/TASK_UNIQUENESS_V60_24.json"));
  assert.equal(report.passed, true);
  assert.equal(report.duplicateRate, 0);
  assert.equal(report.referenceReuseSections, 0);
  assert.equal(report.sectionsOverFivePercent, 0);
  assert.equal(report.identicalCrossTypeSets, 0);
});

test("micro lessons consume only directly reviewed exact source text and keep pending sections separate", () => {
  const api = microLessonContext().MILO_MICRO_LESSON_V60_19;
  const exactReading = api.buildForTest(2, 0, "book-reading-1", 0);
  const partialListening = api.buildForTest(2, 0, "book-listening", 0);
  const pendingReading = api.buildForTest(2, 1, "book-reading-1", 0);
  assert.equal(exactReading.exactCoverage, "complete_visible_section");
  assert.equal(partialListening.exactCoverage, "visible_text_only");
  assert.equal(pendingReading.exactCoverage, "pending");
  assert.equal(exactReading.learningSession.number, 2);
  assert.equal(exactReading.learningPhase.shortLabel, "Học");
});

test("retry attempts produce stable but different valid task variants", () => {
  const context = microLessonContext();
  const api = context.MILO_MICRO_LESSON_V60_19;
  for (const [grade, unitIndex] of [[2, 0], [2, 5], [2, 11], [3, 0], [3, 5], [3, 11]]) {
    const section = context.MILO_SOURCE_SECTIONS_V60_17.grades[String(grade)].units[unitIndex].sections
      .find((item) => item.sectionType?.startsWith("Vocabulary"));
    const first = api.buildForTest(grade, unitIndex, section.id, 0);
    const again = api.buildForTest(grade, unitIndex, section.id, 0);
    const next = api.buildForTest(grade, unitIndex, section.id, 1);
    assert.deepEqual(first.signatures, again.signatures, "same seed must be stable");
    assert.notDeepEqual(first.signatures, next.signatures, "next attempt must vary");
    const combined = [...next.independent, ...next.quick];
    assert.ok(combined.every((task) => !(task.options || []).some((option) => /Đáp án khác/i.test(option))));
  }
});

test("chat layout is compact, single-scroll and keeps controls visible at 1366x768", () => {
  const css = text("chat-ui-v60-21.css");
  const journey = text("ai-journey-v60-13-14.js");
  assert.match(css, /height:calc\(100vh - 176px\)/);
  assert.match(css, /\.messages\{[^}]*overflow-y:auto/s);
  assert.match(css, /\.chat-input\{[^}]*grid-template-columns:48px minmax\(0,1fr\) 48px/s);
  assert.match(css, /min-height:46px/);
  assert.match(css, /font-size:14px/);
  assert.match(journey, /milo-chat-workspace-head/);
  assert.match(journey, /miloChatUnitChip/);
  assert.match(journey, /miloChatActiveTier/);
});

test("current runtime assets are cached and syntax checked", () => {
  const sw = text("sw.js");
  for (const file of ["voice-reply-v60-21.js", "voice-reply-v60-21.css", "chat-ui-v60-21.css", "interaction-performance-v60-22.js", "interaction-performance-v60-22.css"]) assert.ok(sw.includes(file), file);
  for (const file of ["voice-reply-v60-21.js", "pronunciation-coach.js", "commerce-server.mjs", "interaction-performance-v60-22.js"]) {
    const run = spawnSync(process.execPath, ["--check", resolvePath(file)], { encoding: "utf8" });
    assert.equal(run.status, 0, `${file}: ${run.stderr}`);
  }
});

test("canonical Windows launcher is the expected PE64 executable", () => {
  const file = "bin/Milo.exe";
  const buffer = readFileSync(join(root, file));
  assert.equal(buffer.subarray(0, 2).toString("ascii"), "MZ", file);
  const peOffset = buffer.readUInt32LE(0x3c);
  assert.equal(buffer.subarray(peOffset, peOffset + 4).toString("binary"), "PE\u0000\u0000", file);
  assert.equal(buffer.readUInt16LE(peOffset + 4), 0x8664, `${file} is not x64`);
  assert.equal(
    createHash("sha256").update(buffer).digest("hex"),
    "5a7c955363e75e67e1ffcdceec6a370c9320fbeb378ffb46958791dabe4513a0",
    `${file} hash does not match the canonical build`,
  );
});

test("desktop app is native with a clean learner window", () => {
  const nativeHost = readFileSync(join(root, "windows-launcher-src", "milo-webview-host", "Program.cs"), "utf8");
  const windowRuntime = readFileSync(join(root, "desktop-runtime", "milo-window.mjs"), "utf8");
  assert.match(nativeHost, /CoreWebView2Environment\.CreateAsync/);
  assert.doesNotMatch(nativeHost, /ToolStrip|studentButton|adminButton|statusLabel/);
  assert.match(nativeHost, /NavigateTo\(openAdmin\)/);
  assert.match(nativeHost, /--admin/);
  assert.match(nativeHost, /NewWindowRequested/);
  assert.match(nativeHost, /eventArgs\.Handled = true/);
  assert.match(nativeHost, /ClearBrowsingDataAsync/);
  for (const cacheKind of ["DiskCache", "CacheStorage", "ServiceWorkers"]) assert.ok(nativeHost.includes(cacheKind), cacheKind);
  assert.doesNotMatch(nativeHost, /AllDomStorage|LocalStorage/);
  assert.match(nativeHost, /webView\.ZoomFactor = 1\.0/);
  assert.match(nativeHost, /IsZoomControlEnabled = false/);
  assert.match(nativeHost, /AreBrowserAcceleratorKeysEnabled = false/);
  assert.match(nativeHost, /MiloEnglishAdventure\.NativeApp/);
  assert.match(nativeHost, /if \(!isFirstInstance\) return/);
  assert.match(nativeHost, /appBuild=\{ContentVersion\}/);
  assert.doesNotMatch(`${nativeHost}\n${windowRuntime}`, /--app=|msedge\.exe|chrome\.exe|FileProtocolHandler/i);
});

test("desktop runtime never serves stale HTML, JavaScript or CSS", () => {
  const server = text("server.mjs");
  const sw = text("sw.js");
  const lesson = text("lesson.html");
  assert.match(server, /no-store, no-cache, must-revalidate, max-age=0/);
  assert.match(sw, /fetch\(event\.request, \{ cache: "no-store" \}\)/);
  assert.match(sw, /milo-v60-25-ai-corner-toggle/);
  for (const asset of ["learning-session.css", "learning-session-flow.js", "micro-lesson-v60-19.js", "lesson.js"]) {
    assert.match(lesson, new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=60\\.25\\.5-ai-corner-toggle`));
  }
  assert.match(lesson, /lesson-v37\.js\?v=60\.25\.5-ai-corner-toggle/);
  assert.match(lesson, /ai-journey-v60-13-14\.js\?v=60\.25\.5-ai-corner-toggle/);
});

test("focused lesson uses the compact native-app workspace", () => {
  const css = text("learning-session.css");
  const lesson = text("lesson.html");
  const micro = text("micro-lesson-v60-19.js");
  const journey = text("ai-journey-v60-13-14.js");
  assert.match(css, /\.micro-top-summary[\s\S]*grid-template-columns/);
  assert.match(css, /\.micro-guided-workspace\.is-ready[\s\S]*grid-template-columns/);
  assert.match(css, /body\.micro-focus-mode #miloAiGlobalDock/);
  assert.match(css, /persistent lesson assistant rail/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) clamp\(285px, 18vw, 320px\)/);
  assert.match(css, /milo-coach-rail-collapsed \.lesson-shell/);
  assert.match(css, /milo-coach-rail-collapsed \.milo-coach[\s\S]*position: fixed !important/);
  assert.match(css, /right: 18px;[\s\S]*bottom: 18px/);
  assert.match(lesson, /id="lessonCoachRailToggle"/);
  assert.match(micro, /class="micro-guided-workspace/);
  assert.match(micro, /class="micro-action-context/);
  assert.match(micro, /coachMessage\.textContent = currentInstruction/);
  assert.match(journey, /document\.body\.classList\.contains\("micro-focus-mode"\)/);
  const lessonTutor = text("lesson-v37.js");
  assert.match(lessonTutor, /panel\.classList\.remove\("hidden"\)/);
  assert.match(lessonTutor, /function setRailCollapsed/);
  assert.match(lessonTutor, /milo-lesson-ai-rail-collapsed-v1/);
  assert.match(lessonTutor, /rail\?\.addEventListener\("click"/);
});


test("V60.22 click runtime acknowledges synchronously and gates double clicks", async () => {
  class FakeClassList {
    constructor() { this.values = new Set(); }
    add(...names) { names.forEach((name) => this.values.add(name)); }
    remove(...names) { names.forEach((name) => this.values.delete(name)); }
    contains(name) { return this.values.has(name); }
  }
  const context = {
    console,
    performance,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (callback) => setTimeout(() => callback(performance.now()), 0),
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(text("interaction-performance-v60-22.js"), context, { filename: "interaction-performance-v60-22.js" });
  const api = context.MILO_INTERACTION_PERF_V60_22;
  let executions = 0;
  for (let index = 0; index < 100; index += 1) {
    const attrs = new Map();
    const button = {
      dataset: { miloPointerdownAt: String(performance.now()) },
      textContent: "Kiểm tra đáp án",
      disabled: false,
      isConnected: true,
      classList: new FakeClassList(),
      setAttribute(name, value) { attrs.set(name, String(value)); },
      removeAttribute(name) { attrs.delete(name); },
    };
    const first = api.run(button, { action: "check-answer", label: "Đang kiểm tra..." }, async ({ mark }) => {
      executions += 1;
      mark("assessmentDone");
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    const duplicate = api.run(button, { action: "check-answer", label: "Đang kiểm tra..." }, async () => { executions += 1000; });
    assert.equal(button.textContent, "Đang kiểm tra...", "visual response must be synchronous");
    assert.equal(button.disabled, true, "button must gate repeated clicks immediately");
    const duplicateResult = await duplicate;
    assert.equal(duplicateResult.skipped, true);
    await first;
    assert.equal(button.disabled, false, "button must unlock after success");
  }
  assert.equal(executions, 100, "one click must execute one assessment");
  const report = api.summary();
  assert.equal(report.total, 100);
  assert.ok(report.response.p95 <= 100, `p95 response ${report.response.p95}ms`);
  assert.equal(report.errors, 0);
});

test("V60.22 save queue coalesces writes and keeps the latest progress", () => {
  const context = { console, performance, setTimeout, clearTimeout };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(text("interaction-performance-v60-22.js"), context, { filename: "interaction-performance-v60-22.js" });
  const writes = [];
  const storage = { setItem(key, value) { writes.push([key, value]); } };
  const queue = context.MILO_INTERACTION_PERF_V60_22.createSaveQueue(storage, { delay: 1000 });
  queue.enqueue("progress", "old");
  queue.enqueue("progress", "new");
  queue.enqueue("xp", "8");
  const result = queue.flush();
  assert.equal(result.count, 2);
  assert.deepEqual(writes, [["progress", "new"], ["xp", "8"]]);
  assert.equal(queue.size, 0);
});

test("micro lesson fixes the verified click latency causes", () => {
  const micro = text("micro-lesson-v60-19.js");
  assert.match(micro, /MILO_INTERACTION_PERF_V60_22/);
  assert.match(micro, /const taskCache = new Map\(\)/);
  assert.match(micro, /progressSaveQueue\.enqueue/);
  assert.match(micro, /root\.dataset\.microDelegated === '1'/);
  assert.match(micro, /transitionDelay = 140/);
  assert.match(micro, /Đang kiểm tra\.\.\./);
  assert.match(micro, /Tiếp tục học cách làm/);
  assert.equal((micro.match(/root\.addEventListener\('click'/g) || []).length, 1, "one delegated click listener");
  assert.doesNotMatch(micro, /setTimeout\(\(\) => render\(ctx, progress\), 800\)/);
  assert.doesNotMatch(micro, /\.then\(\(\) => render\(ctx, progress\)\)/);
  assert.doesNotMatch(micro, /await\s+fetch\(/);
  assert.doesNotMatch(micro, /void screen\.offsetWidth/);
});

test("student pages and offline cache load V60.22 interaction assets", () => {
  for (const page of ["index.html", "lesson.html"]) {
    const html = text(page);
    assert.match(html, /interaction-performance-v60-22\.js\?v=60\.22\.0/);
    assert.match(html, /interaction-performance-v60-22\.css\?v=60\.22\.0/);
  }
  const sw = text("sw.js");
  assert.match(sw, /milo-v60-23-book-exercises-voice/);
  assert.match(sw, /interaction-performance-v60-22\.js/);
  assert.match(sw, /interaction-performance-v60-22\.css/);
});


test("V60.23 source-backed exercise catalog is verified and OCR-needs-review remains blocked", () => {
  const catalog = JSON.parse(text("book-exercises-v60-23.json"));
  assert.equal(catalog.mappingSummary.activeBookExercises, 78);
  assert.equal(catalog.mappingSummary.directVisualTaskCount, 30);
  assert.equal(catalog.mappingSummary.verifiedMapTaskCount, 48);
  assert.equal(catalog.mappingSummary.blockedRows, 335);
  assert.ok(catalog.tasks.every((task) => task.origin === "bookExercise"));
  assert.ok(catalog.tasks.every((task) => task.source?.sourceAsset && task.source?.sourceRegion && task.source?.verificationStatus));
  assert.ok(catalog.tasks.every((task) => task.source.verificationStatus !== "ocr_extracted_needs_review"));
});

test("mandatory Grade 2 and Grade 3 checkpoints contain direct visually verified book work", () => {
  const catalog = JSON.parse(text("book-exercises-v60-23.json"));
  const direct = catalog.tasks.filter((task) => task.source.verificationStatus === "direct_visual_verified_2026_08_05");
  for (const grade of [2, 3]) for (const unit of [1, 6, 12]) {
    const rows = direct.filter((task) => task.source.grade === grade && task.source.unit === unit);
    for (const sectionType of ["Vocabulary 1", "Reading 1", "Grammar 1", "Speaking/Communication", "Writing"]) {
      assert.ok(rows.some((task) => task.source.sectionType === sectionType), `missing G${grade} U${unit} ${sectionType}`);
    }
  }
});

test("book work enters the independent bank with source trace and Milo practice remains separate", () => {
  const context = microLessonContext();
  const api = context.MILO_MICRO_LESSON_V60_19;
  for (const [grade, unitIndex, part] of [[2,0,"book-vocabulary-1"],[2,5,"book-reading-1"],[2,11,"book-grammar-1"],[3,0,"book-speaking-communication"],[3,5,"book-writing"],[3,11,"book-vocabulary-1"]]) {
    const built = api.buildForTest(grade, unitIndex, part, 0);
    assert.ok(built && built.bookExerciseCount > 0, `${grade}-${unitIndex+1}-${part}`);
    const bookTask = built.independent.find((task) => task.origin === "bookExercise");
    assert.ok(bookTask?.source?.sourceAsset && bookTask.source.sourceRegion);
    assert.ok([...built.guidedTasks, ...built.quickCheckTasks].every((task) => task.origin !== "bookExercise"));
  }
});

test("answer-safe rendering never exposes task answers before submission", () => {
  const micro = text("micro-lesson-v60-19.js");
  assert.doesNotMatch(micro, /data-answer-value/);
  assert.doesNotMatch(micro, /\$\{task\.example\}/);
  assert.match(micro, /example: '', \/\/ Legacy examples are never stored/);
  assert.match(micro, /Đáp án của câu hiện tại vẫn đang được giữ kín/);
  assert.match(micro, /if \(!reveal\)/);
  assert.match(micro, /progress\.revealed/);
  assert.match(micro, /Gợi ý này chưa mở đáp án/);
});

test("adaptive help offers targeted explanations and only the final path can reveal", () => {
  const micro = text("micro-lesson-v60-19.js");
  for (const label of ["Giải thích đề bài", "Nhắc lại kiến thức", "Cho con một gợi ý", "Làm một ví dụ khác", "Con vẫn chưa hiểu"]) assert.ok(micro.includes(label), label);
  assert.match(micro, /data-help-toggle/);
  assert.match(micro, /data-help-choice/);
  assert.match(micro, /data-reveal-solution/);
  assert.match(micro, /safeTeachingExample/);
});

test("slow English voice uses a numeric rate and the free repeat controller stays inline", () => {
  const micro = text("micro-lesson-v60-19.js");
  const repeat = text("vocab-repeat-v60-23.js");
  assert.match(micro, /button\.dataset\.vocabSlow, 0\.55, 'en-US'/);
  assert.match(micro, /MILO_CUTE_VOICE\.speak\(value, numericRate, language/);
  assert.doesNotMatch(micro, /speak\(value, \{ rate \}\)/);
  assert.match(repeat, /SpeechRecognition \|\| window\.webkitSpeechRecognition/);
  assert.match(repeat, /MediaRecorder/);
  assert.match(repeat, /Milo nghe đúng từ rồi/);
  assert.match(repeat, /Không chấm điểm giả/);
  assert.match(repeat, /data-basic-repeat-panel/);
});

test("Con đọc lại is free while advanced eight-metric pronunciation remains a separate VIP action", () => {
  const micro = text("micro-lesson-v60-19.js");
  assert.match(micro, /data-basic-repeat="\$\{esc\(item\.term\)\}"[^>]*>🎤 Con đọc lại/);
  assert.match(micro, /data-open-pronunciation[^>]*>⭐ Chấm chuyên sâu với VIP PRO MAX/);
  assert.doesNotMatch(micro, /data-open-pronunciation[^>]*>🎤 Con đọc lại/);
  const lesson = text("lesson.html");
  for (const file of ["book-exercises-v60-23.js", "vocab-repeat-v60-23.js", "vocab-repeat-v60-23.css"]) assert.ok(lesson.includes(file), file);
});


test("slow voice API is invoked with numeric rate and English language at runtime", async () => {
  const calls = [];
  const context = {
    console,
    document: { addEventListener() {}, querySelectorAll: () => [] },
    navigator: {},
    speechSynthesis: { cancel() {} },
    addEventListener() {},
    clearTimeout() {},
    setTimeout,
    URL,
    Blob,
    MILO_CUTE_VOICE: { stop() {}, async speak(textValue, rate, language, options) { calls.push({ textValue, rate, language, options }); } },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(text("vocab-repeat-v60-23.js"), context, { filename: "vocab-repeat-v60-23.js" });
  const button = { textContent: "Đọc chậm", disabled: false };
  await context.MILO_BASIC_REPEAT_V60_23.speakTarget("math", button, 0.55);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].textValue, "math");
  assert.equal(typeof calls[0].rate, "number");
  assert.equal(calls[0].rate, 0.55);
  assert.equal(calls[0].language, "en-US");
  assert.equal(context.MILO_BASIC_REPEAT_V60_23.closeEnough("math", "math"), true);
  assert.equal(context.MILO_BASIC_REPEAT_V60_23.closeEnough("music", "math"), false);
});


test("student chat does not render technical connection configuration", () => {
  const html = text("index.html");
  assert.doesNotMatch(html, /id=["']aiConfigCard["']/);
  assert.doesNotMatch(html, /id=["']miloTestApiButton["']/);
  assert.doesNotMatch(html, />\s*Kiểm tra API\s*</i);
  assert.doesNotMatch(html, />[^<]*\.env[^<]*</i);
  const visibleMarkup = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  assert.doesNotMatch(visibleMarkup, />[^<]*(?:endpoint|token|model)[^<]*</i);
  assert.ok(html.includes('id="view-chat"'));
  assert.ok(html.includes('id="chatText"'));
  assert.ok(html.includes('id="micLarge"'));
});

test("student chat is a single conversation workspace with compact upgrade", () => {
  const journey = text("ai-journey-v60-13-14.js");
  const css = text("student-chat-v60-24.css");
  const html = text("index.html");
  assert.match(journey, /className = "milo-chat-pro-layout"/);
  assert.match(journey, /Milo đang kết nối…/);
  assert.doesNotMatch(journey, /data-chat-tier=/);
  assert.match(html, /Luyện chuyên sâu cùng Milo/);
  assert.match(html, /Dùng thử 24 giờ/);
  assert.match(html, /Xem gói/);
  assert.match(css, /\.milo-chat-pro-layout\{display:block!important/);
  assert.match(css, /#view-chat \.messages\{[^}]*overflow-y:auto!important/);
  assert.match(css, /\.milo-vip-mini-card\{[^}]*min-height:58px/);
  assert.match(css, /#view-chat \.chat-input\{[^}]*min-height:6[4-9]px/);
});

test("student assistant exposes only child-friendly connection states", () => {
  const status = text("student-assistant-status-v60-24.js");
  for (const label of ["Milo đã sẵn sàng", "Milo đang kết nối…", "Milo chưa thể kết nối. Con hãy thử lại nhé"]) {
    assert.ok(status.includes(label), label);
  }
  assert.doesNotMatch(status, /\.env|Kiểm tra API|keyMasked|modelName|endpoint/i);
  assert.match(status, /isActiveVip/);
  assert.match(status, /ui\.upgrade\?\.classList\.toggle\("hidden", vip\)/);
});

test("technical connection routes are admin-only and sanitized", () => {
  const server = text("server.mjs");
  assert.match(server, /function requireAdminConnectionAccess/);
  assert.match(server, /url\.pathname === "\/api\/config\/status"[\s\S]{0,180}requireAdminConnectionAccess/);
  assert.match(server, /url\.pathname === "\/api\/config\/test-ai"[\s\S]{0,180}requireAdminConnectionAccess/);
  const start = server.indexOf("function adminConnectionStatus");
  const end = server.indexOf("async function testAiConnection", start);
  const statusBlock = server.slice(start, end);
  assert.doesNotMatch(statusBlock, /keyMasked|apiKeyLast|model|endpoint|token/i);
  for (const label of ["Đã cấu hình", "Chưa cấu hình", "Kết nối thành công", "Kết nối thất bại"]) assert.ok(statusBlock.includes(label), label);
});

test("admin owns the dedicated connection page without exposing a secret", () => {
  const html = text("admin.html");
  const script = text("admin-ai-connection-v60-24.js");
  assert.match(html, /data-admin-view="connection"/);
  assert.match(html, /id="connectionPanel"/);
  assert.match(html, /Kiểm tra trạng thái dịch vụ mà không hiển thị khóa bí mật/);
  assert.ok(html.includes("admin-ai-connection-v60-24.js"));
  assert.match(script, /X-Milo-Admin/);
  assert.doesNotMatch(script, /keyMasked|apiKeyLast|modelName|endpoint/i);
});

test("admin lists use on-demand detail views instead of permanent split panes", () => {
  const html = text("admin.html");
  const css = text("admin-vip-pro-max-v60-7.css");
  const script = text("admin-vip-pro-max-v60-7.js");
  for (const id of ["pendingMasterDetail", "accountsMasterDetail", "ordersMasterDetail", "transactionsMasterDetail"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /data-detail-close="accounts"/);
  assert.match(html, /data-detail-close="pending"/);
  assert.match(css, /\.detail-on-demand > \.detail-card,[\s\S]*display: none/);
  assert.match(css, /\.detail-on-demand\.detail-open > \.table-card,[\s\S]*display: none/);
  assert.match(script, /function openDetail\(view\)/);
  assert.match(script, /function closeDetail\(view\)/);
  assert.match(script, /event\.key === "Escape" && activeDetailIsOpen\(\)/);
});

test("version metadata and service worker publish the current app assets", () => {
  assert.equal(text("PHIEN_BAN.txt").trim(), "60.24.4-admin-readable-text");
  assert.equal(text("MILO_CONTENT_BUILD_ID.txt").trim(), "60.25.5-ai-corner-toggle");
  const sw = text("sw.js");
  assert.match(sw, /milo-v60-25-ai-corner-toggle/);
  assert.match(sw, /learning-review\.js/);
  assert.match(sw, /student-chat-v60-24\.css/);
  assert.match(sw, /student-assistant-status-v60-24\.js/);
});

test("legacy technical student configuration script is not loaded", () => {
  const html = text("index.html");
  assert.doesNotMatch(html, /<script[^>]+env-ai-status\.js/i);
  assert.match(html, /student-assistant-status-v60-24\.js/);
  assert.doesNotMatch(html, /id="view-assistants"/);
});

test("floating assistant dock is hidden while the dedicated chat page is open", () => {
  const journey = text("ai-journey-v60-13-14.js");
  assert.match(journey, /function syncDockVisibility/);
  assert.match(journey, /document\.body\.classList\.toggle\("milo-chat-page-open", visible\)/);
  assert.match(journey, /MutationObserver\(syncDockVisibility\)/);
});

test("desktop chat view overrides the legacy tall main panel without page scrolling", () => {
  const css = text("student-chat-v60-24.css");
  assert.match(css, /body\.milo-chat-page-open \.main\{[^}]*min-height:0!important/);
  assert.match(css, /body\.milo-chat-page-open \.layout\{[^}]*height:calc\(100vh - 84px\)/);
  assert.match(css, /body\.milo-chat-page-open #view-chat \.milo-chat-pro-layout\{[^}]*height:calc\(100% - 54px\)/);
});


test("student assistant automatically resolves Plus, active trial, paid VIP and expired access", () => {
  const source = text("student-assistant-status-v60-24.js");
  const context = {
    console,
    Date,
    setTimeout() { return 0; },
    localStorage: { getItem() { return ""; } },
    document: { querySelector() { return null; }, documentElement: {} },
    MutationObserver: class { observe() {} disconnect() {} },
    addEventListener() {},
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "student-assistant-status-v60-24.js" });
  const check = context.MILO_STUDENT_ASSISTANT_STATUS_V60_24.isActiveVip;
  assert.equal(check({ accessLevel: "plus" }), false);
  assert.equal(check({ accessLevel: "vip-pro-max" }), false);
  assert.equal(check({ accessLevel: "vip-pro-max-trial", activeUntil: new Date(Date.now() + 3600000).toISOString() }), true);
  assert.equal(check({ accessLevel: "vip-pro-max", activeUntil: new Date(Date.now() + 3600000).toISOString() }), true);
  assert.equal(check({ accessLevel: "vip-pro-max-trial", activeUntil: new Date(Date.now() - 3600000).toISOString() }), false);
});

test("6-month VIP plan pricing is 1.199.000đ and provides best monthly value", async () => {
  const { MILO_PLANS } = await import("../server/commerce-server.mjs");
  const starter = MILO_PLANS.find((p) => p.id === "starter");
  const plus = MILO_PLANS.find((p) => p.id === "plus");
  const premium = MILO_PLANS.find((p) => p.id === "premium");
  assert.equal(starter.price, 299000);
  assert.equal(plus.price, 649000);
  assert.equal(premium.price, 1199000);
  assert.equal(premium.durationMonths, 6);
  const monthlyStarter = starter.price / starter.durationMonths;
  const monthlyPlus = plus.price / plus.durationMonths;
  const monthlyPremium = premium.price / premium.durationMonths;
  assert.ok(monthlyPremium < monthlyPlus, "6-month monthly cost must be lower than 3-month monthly cost");
  assert.ok(monthlyPlus < monthlyStarter, "3-month monthly cost must be lower than 1-month monthly cost");
  assert.ok(premium.price < 2 * plus.price, "6-month plan must be cheaper than buying 3-month plan twice");
  assert.match(premium.benefits.join("\n"), /595\.000đ/);
});

test("unified SubscriptionUI.openPlans API exists and pronunciation-coach avoids .click() hacks", () => {
  const coach = text("pronunciation-coach.js");
  assert.ok(!coach.includes('querySelector("[data-open-vip-plans],[data-show-paid-plans]")?.click?.()'), "pronunciation-coach must not use querySelector click hack");
  assert.match(coach, /SubscriptionUI\.openPlans/);
  assert.match(coach, /Milo chưa mở được bảng gói/);

  const commerce = text("commerce-v54.js");
  assert.match(commerce, /SubscriptionUI/);
  assert.match(commerce, /openVipPlans/);
  assert.match(commerce, /_planModalLock/);
  assert.match(commerce, /data-action="open-vip-plans"/);
});

test("student payment status UI masks technical .env and bank variable names", () => {
  const commerce = text("commerce-v54.js");
  assert.ok(!commerce.includes("Thiếu trong file .env:"), "commerce-v54 must not render raw file .env error");
  assert.ok(!commerce.includes("MILO_BANK_NAME, MILO_BANK_ACCOUNT_NUMBER"), "commerce-v54 must not render raw bank variable names to student");
  assert.match(commerce, /Thanh toán đang được chuẩn bị\. Phụ huynh vui lòng thử lại sau\./);
});

test("P1: responsibility-based clean modules pricing-utils, subscription-ui and student-assistant-status load cleanly", () => {
  const pricingText = text("pricing-utils.js");
  assert.match(pricingText, /MiloPricingUtils/);
  assert.match(pricingText, /calculatePlanSavings/);

  const subUiText = text("subscription-ui.js");
  assert.match(subUiText, /MiloSubscriptionUI/);
  assert.match(subUiText, /openPlans/);

  const statusText = text("student-assistant-status.js");
  assert.match(statusText, /StudentAssistantStatus/);
});

test("P1: documentation AGENTS.md, README.md, CHANGELOG.md, PROJECT_AUDIT.md and docs/ exist", () => {
  for (const doc of [
    "AGENTS.md",
    "README.md",
    "CHANGELOG.md",
    "PROJECT_AUDIT.md",
    "docs/architecture.md",
    "docs/module-boundaries.md",
    "docs/migration-map.md",
    "reports/p0-runtime-verification.md",
    "reports/script-load-and-risk-map.md",
  ]) {
    assert.ok(existsSync(resolvePath(doc)), `Missing documentation file: ${doc}`);
  }
});

test("P1: no patch files like fix-final or commerce-v55 exist in workspace", () => {
  for (const invalidName of ["fix-final.js", "fix-final-2.js", "commerce-v55.js", "app-v40.js"]) {
    assert.ok(!existsSync(join(root, invalidName)), `Invalid patch file found: ${invalidName}`);
  }
});

test("P2: 8 major tasks per unit structure and pedagogy mapping", () => {
  const mapCode = text("unit-task-mapping.js");
  assert.match(mapCode, /MAJOR_TASK_DEFINITIONS/);
  assert.match(mapCode, /Học/);
  assert.match(mapCode, /Luyện/);
  assert.match(mapCode, /Kiểm tra/);

  const context = { console, window: {} };
  vm.createContext(context);
  vm.runInContext(mapCode, context);
  const mapper = context.window.MILO_UNIT_TASK_MAPPER;
  assert.equal(mapper.MAJOR_TASK_DEFINITIONS.length, 8);

  const sampleSections = ['book-big-question', 'book-vocabulary-1', 'book-reading-1', 'book-grammar-1', 'book-listening', 'book-vocabulary-2', 'book-writing', 'book-project'];
  const tasks = mapper.getMajorTasksForUnit(sampleSections, []);
  assert.equal(tasks.length, 8);
  assert.equal(tasks[0].stage, 'Học');
  assert.equal(tasks[3].stage, 'Luyện');
  assert.equal(tasks[7].stage, 'Kiểm tra');
});

test("STRUCTURE: Root does not contain duplicate EXEs, BATs, or server.mjs", () => {
  const rootFiles = ["Milo.exe", "Milo-App-Hoc.exe", "Milo-Quan-Tri-VIP-PRO-MAX.exe", "MO_APP_HOC.bat", "MO_QUAN_TRI.bat", "server.mjs"];
  for (const file of rootFiles) {
    assert.ok(!existsSync(join(root, file)), `Root should not contain ${file}`);
  }
});

test("STRUCTURE: runtime tree contains exactly one executable at bin/Milo.exe", () => {
  const executablePaths = [];
  const directories = [root];
  while (directories.length) {
    const directory = directories.pop();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) directories.push(entryPath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".exe")) executablePaths.push(entryPath);
    }
  }
  assert.deepEqual(executablePaths.sort(), [join(root, "bin", "Milo.exe")]);
});

test("STRUCTURE: server/server.mjs exists and uses paths.mjs", () => {
  const serverPath = join(root, "server", "server.mjs");
  const pathsPath = join(root, "server", "paths.mjs");
  assert.ok(existsSync(serverPath), "server/server.mjs must exist");
  assert.ok(existsSync(pathsPath), "server/paths.mjs must exist");
  const serverCode = readFileSync(serverPath, "utf8");
  assert.match(serverCode, /import.*paths\.mjs/, "server.mjs must import paths.mjs");
  assert.match(serverCode, /\/api\/health/, "server.mjs must implement /api/health");
});

test("STARTUP: .env is ignored by gitignore and .env.example contains safe defaults", () => {
  const gitignorePath = join(root, ".gitignore");
  assert.ok(existsSync(gitignorePath), ".gitignore must exist");
  const gitignore = readFileSync(gitignorePath, "utf8");
  assert.match(gitignore, /\.env/, ".gitignore must include .env");

  const example = text(".env.example");
  assert.doesNotMatch(example, /AIzaSy/, ".env.example must not contain real API key");
  assert.doesNotMatch(example, /Hung2004/, ".env.example must not contain real admin password");
});

test("STARTUP: canonical runtime tree contains server, public and desktop modules", () => {
  assert.ok(!existsSync(join(root, "release")), "Duplicate release runtime tree must not exist");
  const serverDir = join(root, "server");
  for (const mod of ["server.mjs", "commerce-server.mjs", "tutor-prompt.mjs", "tutor-response.mjs", "paths.mjs"]) {
    assert.ok(existsSync(join(serverDir, mod)), `Missing canonical server module: ${mod}`);
  }
  for (const page of ["index.html", "lesson.html", "admin.html"]) {
    assert.ok(existsSync(join(root, "public", page)), `Missing canonical public page: ${page}`);
  }
  assert.ok(existsSync(join(root, "windows-launcher-src", "milo-webview-host", "MiloDesktopHost.csproj")), "Missing native desktop project");
  assert.ok(existsSync(join(root, "windows-launcher-src", "milo-webview-host", "Program.cs")), "Missing native desktop host");
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}
console.log(`RESULT ${passed}/${tests.length}`);
if (passed !== tests.length) process.exit(1);
