import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputJson = resolve(root, "reports", "SOURCE_EXACTNESS_V60_25.json");
const outputMarkdown = resolve(root, "reports", "SOURCE_EXACTNESS_TODO_V60_25.md");

const readJson = (relativePath) => JSON.parse(readFileSync(join(root, relativePath), "utf8"));
const source = readJson("src/data/source-sections-v60-17.json");
const exactTranscriptions = readJson("src/data/source-exact-transcriptions.json");
const imageMap = readJson("src/data/source-image-map-v60-17.json");
const exercises = readJson("src/data/book-exercises-v60-23.json");
const ocrConsensus = existsSync(join(root, "reports", "SOURCE_OCR_CONSENSUS.json"))
  ? readJson("reports/SOURCE_OCR_CONSENSUS.json")
  : null;
const ocrReview = existsSync(join(root, "reports", "SOURCE_OCR_CANONICAL_REVIEW.json"))
  ? readJson("reports/SOURCE_OCR_CANONICAL_REVIEW.json")
  : null;

const gradeSources = {
  2: {
    manifest: readJson("content/grade2-source/manifest.json"),
    runtimeFile: "src/js/grade2-sourcebook-data.js",
    runtimeGlobal: "MILO_GRADE2_SOURCEBOOK_DATA",
  },
  3: {
    manifest: readJson("src/data/GRADE3_SOURCE_MANIFEST.json"),
    runtimeFile: "src/js/grade3-sourcebook-data.js",
    runtimeGlobal: "MILO_GRADE3_SOURCEBOOK_DATA",
  },
};

function runtimeData(file, globalName) {
  const context = { window: {} };
  vm.runInNewContext(readFileSync(join(root, file), "utf8"), context, { filename: file });
  return context.window[globalName];
}

const isExactStructuredBookSection = (section) =>
  section.id !== "sourcebook" &&
  section.contentOrigin === "book_source" &&
  section.verificationStatus === "verified_from_image";

const exactTranscriptionBySection = new Map(
  exactTranscriptions.entries.map((entry) => [`${entry.grade}:${entry.unit}:${entry.sectionId}`, entry]),
);

const withExactTranscription = (section) => {
  const record = exactTranscriptionBySection.get(`${section.grade}:${section.unit}:${section.id}`);
  if (!record) return section;
  return {
    ...section,
    verificationStatus:
      record.coverage === "complete_visible_section" ? "verified_from_image" : section.verificationStatus,
    exactVerification: record,
  };
};

const isPendingStructuredBookSection = (section) =>
  section.id !== "sourcebook" &&
  section.contentOrigin === "book_source" &&
  !isExactStructuredBookSection(section);

const isExactBookTask = (task) =>
  ["direct_visual_verified_2026_08_05", "verified_from_image_map"].includes(
    task.source?.verificationStatus,
  );

function addCount(target, key, by = 1) {
  target[key] = (target[key] || 0) + by;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const failures = [];

if (exactTranscriptionBySection.size !== exactTranscriptions.entries.length) {
  failures.push("Duplicate exact-transcription section key");
}
for (const entry of exactTranscriptions.entries) {
  const unit = source.grades[String(entry.grade)]?.units?.find((item) => item.unit === entry.unit);
  const section = unit?.sections?.find((item) => item.id === entry.sectionId);
  const transcription = entry.content?.exactTranscription;
  if (!section) failures.push({ type: "exact_transcription_section_missing", id: entry.id });
  if (entry.verificationMethod !== "direct_model_visual_character_review") {
    failures.push({ type: "exact_transcription_method", id: entry.id });
  }
  if (!['complete_visible_section', 'visible_text_only'].includes(entry.coverage)) {
    failures.push({ type: "exact_transcription_coverage", id: entry.id });
  }
  if (!transcription?.title || !Array.isArray(transcription.blocks) || !transcription.blocks.length) {
    failures.push({ type: "exact_transcription_content", id: entry.id });
  }
  if ((entry.sourceImages || []).some((image) => !(section?.sourceImage || []).includes(image))) {
    failures.push({ type: "exact_transcription_source_image", id: entry.id });
  }
  if ((entry.sourceAssets || []).some((asset) => !(section?.sourceAsset || []).includes(asset))) {
    failures.push({ type: "exact_transcription_source_asset", id: entry.id });
  }
}

if ((ocrConsensus?.summary?.publishedExactLines || 0) !== 0 || (ocrReview?.summary?.publishedExactLines || 0) !== 0) {
  failures.push("Machine OCR was published as exact text without visual verification");
}
const imageLedger = [];
const mapByGradeAndId = new Map(
  imageMap.records.map((record) => [`${record.grade}:${record.id}`, record]),
);

const imageIntegrity = {
  total: 0,
  present: 0,
  optimizedSizeMatched: 0,
  manifestSourceMatch: 0,
  mappingMatched: 0,
  runtimeCatalogMatched: 0,
  unitPages: 0,
  unitPagesMappedToJourney: 0,
  sharedOrSupplementPages: 0,
};

for (const grade of [2, 3]) {
  const entry = gradeSources[grade];
  const manifest = entry.manifest;
  const runtime = runtimeData(entry.runtimeFile, entry.runtimeGlobal);
  const runtimeById = new Map((runtime?.pages || []).map((page) => [page.id, page]));
  const manifestIds = new Set();

  if (!runtime || runtime.sourceCount !== manifest.sourceCount) {
    failures.push({ type: "runtime_source_count", grade, expected: manifest.sourceCount, actual: runtime?.sourceCount });
  }
  if ((runtime?.pages || []).length !== manifest.pages.length) {
    failures.push({ type: "runtime_page_count", grade, expected: manifest.pages.length, actual: runtime?.pages?.length || 0 });
  }

  for (const page of manifest.pages) {
    imageIntegrity.total += 1;
    if (manifestIds.has(page.id)) failures.push({ type: "duplicate_manifest_id", grade, id: page.id });
    manifestIds.add(page.id);

    const absoluteAsset = join(root, "content", page.original);
    const present = existsSync(absoluteAsset);
    const actualBytes = present ? statSync(absoluteAsset).size : 0;
    const sizeMatched = present && actualBytes === page.optimizedBytes;
    const mapRecord = mapByGradeAndId.get(`${grade}:${page.id}`);
    const mappingMatched = Boolean(
      mapRecord &&
      mapRecord.sourceAsset === page.original &&
      mapRecord.sourceImage === page.originalName &&
      mapRecord.sha256 === page.sha256,
    );
    const runtimePage = runtimeById.get(page.id);
    const runtimeMatched = Boolean(
      runtimePage &&
      runtimePage.original === page.original &&
      runtimePage.originalName === page.originalName &&
      runtimePage.sha256 === page.sha256 &&
      runtimePage.optimizedBytes === page.optimizedBytes,
    );

    if (present) imageIntegrity.present += 1;
    else failures.push({ type: "missing_source_asset", grade, id: page.id, asset: page.original });
    if (sizeMatched) imageIntegrity.optimizedSizeMatched += 1;
    else if (present) failures.push({ type: "source_asset_size", grade, id: page.id, expected: page.optimizedBytes, actual: actualBytes });
    if (page.sourceMatch === true && page.optimizedFromSource === true) imageIntegrity.manifestSourceMatch += 1;
    else failures.push({ type: "manifest_source_match", grade, id: page.id });
    if (mappingMatched) imageIntegrity.mappingMatched += 1;
    else failures.push({ type: "mapping_mismatch", grade, id: page.id });
    if (runtimeMatched) imageIntegrity.runtimeCatalogMatched += 1;
    else failures.push({ type: "runtime_catalog_mismatch", grade, id: page.id });

    if (Number.isInteger(page.unit)) imageIntegrity.unitPages += 1;
    else imageIntegrity.sharedOrSupplementPages += 1;

    imageLedger.push({
      grade,
      id: page.id,
      unit: page.unit,
      category: page.category,
      sourceImage: page.originalName,
      sourceAsset: page.original,
      bytes: actualBytes,
      webpSha256: present ? sha256(absoluteAsset) : "",
      sourceArchiveSha256: page.sha256,
      sourceMatch: page.sourceMatch === true,
      runtimeMatched,
    });
  }

  for (const unit of source.grades[String(grade)].units) {
    const sourcebook = unit.sections.find((section) => section.id === "sourcebook");
    const expected = manifest.pages
      .filter((page) => page.unit === unit.unit)
      .map((page) => page.original)
      .sort();
    const actual = [...(sourcebook?.sourceAsset || [])].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push({ type: "unit_journey_image_set", grade, unit: unit.unit, expected: expected.length, actual: actual.length });
    } else {
      imageIntegrity.unitPagesMappedToJourney += expected.length;
    }
  }
}

if (imageMap.records.length !== imageIntegrity.total) {
  failures.push({ type: "source_map_total", expected: imageIntegrity.total, actual: imageMap.records.length });
}

function byGradeUnit() {
  const rows = [];
  for (const gradeKey of ["2", "3"]) {
    for (const unit of source.grades[gradeKey].units) {
      const structuredBookSections = unit.sections.filter(
        (section) => section.contentOrigin === "book_source" && section.id !== "sourcebook",
      ).map(withExactTranscription);
      const exactSections = structuredBookSections.filter(isExactStructuredBookSection);
      const pendingSections = structuredBookSections.filter(isPendingStructuredBookSection);
      const activeTasks = exercises.tasks.filter(
        (task) => String(task.source?.grade) === gradeKey && task.source?.unit === unit.unit,
      );
      rows.push({
        grade: Number(gradeKey),
        unit: unit.unit,
        title: unit.title,
        images: unit.imageCount,
        structuredBookSections: structuredBookSections.length,
        exactStructuredSections: exactSections.length,
        pendingTextSections: pendingSections.length,
        activeExactBookTasks: activeTasks.filter(isExactBookTask).length,
      });
    }
  }
  return rows;
}

const sectionStatusCounts = {};
const imageStatusCounts = {};
const pendingSections = [];
let structuredBookSections = 0;
let exactStructuredBookSections = 0;
let sourcebookImageSections = 0;

for (const gradeKey of ["2", "3"]) {
  for (const unit of source.grades[gradeKey].units) {
    for (const section of unit.sections) {
      const auditedSection = withExactTranscription(section);
      addCount(sectionStatusCounts, auditedSection.verificationStatus);
      if (auditedSection.id === "sourcebook" && auditedSection.contentOrigin === "book_source") {
        sourcebookImageSections += 1;
        continue;
      }
      if (auditedSection.contentOrigin !== "book_source") continue;
      structuredBookSections += 1;
      if (isExactStructuredBookSection(auditedSection)) exactStructuredBookSections += 1;
      if (isPendingStructuredBookSection(auditedSection)) {
        const content = auditedSection.content || {};
        pendingSections.push({
          grade: auditedSection.grade,
          unit: auditedSection.unit,
          section: auditedSection.id,
          sectionType: auditedSection.sectionType,
          title: auditedSection.title,
          verificationStatus: auditedSection.verificationStatus,
          sourcePage: auditedSection.sourcePage || "",
          sourceImage: auditedSection.sourceImage || [],
          sourceAsset: auditedSection.sourceAsset || [],
          sourceTextChars: String(content.sourceText || "").length,
          reviewUrl: `source-review-v60-18.html?grade=${auditedSection.grade}&unit=${auditedSection.unit}&section=${encodeURIComponent(auditedSection.id)}&filter=pending`,
        });
      }
    }
  }
}

for (const record of imageMap.records) addCount(imageStatusCounts, record.verificationStatus);

const unitRows = byGradeUnit();
const sourceSafeTasks = exercises.tasks.filter(isExactBookTask);
const directVisualTasks = exercises.tasks.filter(
  (task) => task.source?.verificationStatus === "direct_visual_verified_2026_08_05",
);
const verifiedWordPracticeTasks = exercises.tasks.filter(
  (task) => task.source?.verificationStatus === "verified_from_image_map",
);
const activeFromUnreviewedOcr = exercises.tasks.filter(
  (task) => task.source?.verificationStatus === "ocr_extracted_needs_review",
);

const report = {
  version: "60.25.1-source-exactness",
  generatedAt: new Date().toISOString(),
  passed: failures.length === 0,
  policy: {
    exactImageCoverage:
      "Every source image must exist, match its optimized manifest size, match the source map, and appear in the runtime sourcebook catalog.",
    exactStructuredSection:
      "A structured book section is exact only when it is not the sourcebook image container and is verified_from_image in the source map or has a complete direct-visual transcription registry record.",
    exactBookTask:
      "A book exercise may be active only after direct visual verification or a verified image-map transcription.",
    studentSafety:
      "Pending OCR/needs_review text is never presented as book text. Students read the original source image; generated practice is labeled Milo Practice.",
  },
  summary: {
    imageIntegrity,
    sourceImages: {
      total: imageMap.records.length,
      grade2: imageMap.records.filter((item) => item.grade === 2).length,
      grade3: imageMap.records.filter((item) => item.grade === 3).length,
      byVerificationStatus: imageStatusCounts,
    },
    sections: {
      structuredBookSections,
      sourcebookImageSections,
      exactStructuredBookSections,
      pendingExactTranscription: pendingSections.length,
      directVisualTranscriptions: exactTranscriptions.entries.length,
      completeVisibleTranscriptions: exactTranscriptions.entries.filter((entry) => entry.coverage === "complete_visible_section").length,
      partialVisibleTranscriptions: exactTranscriptions.entries.filter((entry) => entry.coverage === "visible_text_only").length,
      byVerificationStatus: sectionStatusCounts,
    },
    activeBookExercises: {
      total: exercises.tasks.length,
      sourceSafe: sourceSafeTasks.length,
      directVisualExact: directVisualTasks.length,
      verifiedWordPractice: verifiedWordPracticeTasks.length,
      activeFromUnreviewedOcr: activeFromUnreviewedOcr.length,
      mappingSummary: exercises.mappingSummary,
    },
    ocrReview: ocrReview ? {
      sourcePages: ocrConsensus?.summary.pages || 0,
      sourceRegions: ocrConsensus?.summary.sourceRegions || 0,
      strongMachineConsensus: ocrConsensus?.summary.strongMachineConsensus || 0,
      uniqueCandidates: ocrReview.summary.uniqueCandidates,
      repeatAgreement: ocrReview.summary.repeatAgreement,
      visuallyVerified: ocrReview.summary.visuallyVerified,
      publishedExactLines: ocrReview.summary.publishedExactLines,
    } : null,
  },
  failures,
  byGradeUnit: unitRows,
  pendingSections,
  imageLedger,
};

const lines = [
  "# ĐỐI CHIẾU NGUỒN LỚP 2–3 · V60.25",
  "",
  "Mục tiêu: giữ đủ mọi ảnh nguồn trong app, không đưa OCR chưa duyệt ra làm nguyên văn sách và theo dõi việc chép từng chữ.",
  "",
  "## Kết quả kiểm kê toàn bộ ảnh",
  `- Trạng thái kiểm toán: **${report.passed ? "PASS" : "FAIL"}**`,
  `- Ảnh nguồn có trong app: **${imageIntegrity.present}/${imageIntegrity.total}**`,
  `- Kích thước khớp manifest: **${imageIntegrity.optimizedSizeMatched}/${imageIntegrity.total}**`,
  `- Bản ghi nguồn khớp manifest: **${imageIntegrity.mappingMatched}/${imageIntegrity.total}**`,
  `- Danh mục chạy trong app khớp: **${imageIntegrity.runtimeCatalogMatched}/${imageIntegrity.total}**`,
  `- Ảnh nội dung Unit được gắn đúng Hành trình: **${imageIntegrity.unitPagesMappedToJourney}/${imageIntegrity.unitPages}**`,
  `- Ảnh đầu/cuối/phụ vẫn có trong Sách nguồn: **${imageIntegrity.sharedOrSupplementPages}**`,
  "",
  "## Trạng thái chép chữ",
  `- Mục sách dạng cấu trúc: **${structuredBookSections}**`,
  `- Mục đã đối chiếu trực tiếp từng dữ liệu: **${exactStructuredBookSections}**`,
  `- Mục còn phải chép/đối chiếu từng chữ: **${pendingSections.length}**`,
  `- Bản chép được đọc trực tiếp bằng mắt từ ảnh: **${exactTranscriptions.entries.length}**`,
  `- Mục đã đủ phần chữ nhìn thấy: **${exactTranscriptions.entries.filter((entry) => entry.coverage === "complete_visible_section").length}**`,
  `- Mục chỉ xác minh chữ in, còn thiếu nguồn audio/video: **${exactTranscriptions.entries.filter((entry) => entry.coverage === "visible_text_only").length}**`,
  `- Bài tập chép trực tiếp từ vùng ảnh đã duyệt: **${directVisualTasks.length}**`,
  `- Bài luyện Milo dùng từ đã xác minh trên ảnh: **${verifiedWordPracticeTasks.length}**`,
  `- Tổng hoạt động có nguồn an toàn: **${sourceSafeTasks.length}/${exercises.tasks.length}**`,
  `- Bài tập active từ OCR chưa duyệt: **${activeFromUnreviewedOcr.length}**`,
  "",
  "## OCR hỗ trợ đối chiếu",
  `- Ảnh đã chạy qua bộ dò trang + OCR kép: **${ocrConsensus?.summary.pages || 0}/${imageMap.records.length}**`,
  `- Vùng trang trái/phải đã đọc: **${ocrConsensus?.summary.sourceRegions || 0}**`,
  `- Dòng đồng thuận mạnh giữa hai bộ máy độc lập: **${ocrConsensus?.summary.strongMachineConsensus || 0}**`,
  `- Ứng viên duy nhất sau khi gom ảnh cuộn trùng: **${ocrReview?.summary.uniqueCandidates || 0}**`,
  `- Ứng viên có bằng chứng lặp trên nhiều ảnh: **${ocrReview?.summary.repeatAgreement || 0}**`,
  `- Dòng OCR đã xác minh trực quan: **${ocrReview?.summary.visuallyVerified || 0}**`,
  `- Dòng OCR tự động xuất bản: **${ocrReview?.summary.publishedExactLines || 0}**`,
  "",
  "> OCR chỉ dùng để giảm công chép. Kết quả máy dù đồng thuận vẫn bị khóa; muốn ghi vào nội dung dạy bé phải mở đúng vùng ảnh nguồn và kiểm tra từng ký tự.",
  "",
  "> 371/371 ảnh đã được đối chiếu về sự tồn tại, manifest, ánh xạ Unit và danh mục runtime. Điều này bảo đảm không thất lạc ảnh. Trạng thái “đã chép đúng từng chữ” chỉ áp dụng cho mục đã xác minh trực tiếp; không đánh đồng ảnh đầy đủ với bản chép OCR.",
  "",
  "## Theo Unit",
  "",
  "| Lớp | Unit | Ảnh Unit | Mục cấu trúc | Đã exact | Cần chép chữ | Bài active exact |",
  "|---:|---:|---:|---:|---:|---:|---:|",
  ...unitRows.map(
    (row) =>
      `| ${row.grade} | ${row.unit} | ${row.images} | ${row.structuredBookSections} | ${row.exactStructuredSections} | ${row.pendingTextSections} | ${row.activeExactBookTasks} |`,
  ),
  "",
  "## Danh sách cần chép và đối chiếu từng chữ",
  "",
];

for (const item of pendingSections) {
  lines.push(
    `- G${item.grade} U${item.unit} · ${item.sectionType} · ${item.verificationStatus} · ${item.sourceImage.join(" | ")} · ${item.reviewUrl}`,
  );
}

mkdirSync(dirname(outputJson), { recursive: true });
writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(outputMarkdown, `${lines.join("\n")}\n`);

console.log(JSON.stringify(report.summary, null, 2));
if (!report.passed) {
  console.error(JSON.stringify(failures.slice(0, 25), null, 2));
  process.exitCode = 1;
}
