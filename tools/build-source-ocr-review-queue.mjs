import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pageDirectory = join(root, "reports", "source-ocr-consensus", "pages");
const outputPath = join(root, "reports", "SOURCE_OCR_CANONICAL_REVIEW.json");
const markdownPath = join(root, "reports", "SOURCE_OCR_CANONICAL_REVIEW.md");
const filenames = (await readdir(pageDirectory)).filter((name) => name.endsWith(".json")).sort();
const groups = new Map();
let sourceRows = 0;
let excludedUiNoise = 0;

function visualCrop(region, bbox) {
  const scale = Number(region.scale) || 1;
  const source = region.sourceRegion;
  const padding = 8;
  const x0 = Math.max(source.left, source.left + bbox.x0 / scale - padding);
  const y0 = Math.max(source.top, source.top + bbox.y0 / scale - padding);
  const x1 = Math.min(source.left + source.width, source.left + bbox.x1 / scale + padding);
  const y1 = Math.min(source.top + source.height, source.top + bbox.y1 / scale + padding);
  return {
    left: Math.round(x0),
    top: Math.round(y0),
    width: Math.max(1, Math.round(x1 - x0)),
    height: Math.max(1, Math.round(y1 - y0)),
  };
}

for (const filename of filenames) {
  const page = JSON.parse(await readFile(join(pageDirectory, filename), "utf8"));
  if (page.pipelineVersion !== 2) throw new Error(`Stale OCR report: ${filename}`);
  for (const region of page.regions || []) {
    for (const row of region.consensus || []) {
      sourceRows += 1;
      if (row.publishedAsExactText) throw new Error(`Unsafe published OCR row in ${page.id}/${region.id}`);
      if (row.probableUiNoise) {
        excludedUiNoise += 1;
        continue;
      }
      const key = `${page.grade}|${page.unit ?? "front-matter"}|${row.normalized}`;
      if (!groups.has(key)) {
        groups.set(key, {
          grade: page.grade,
          unit: page.unit,
          normalized: row.normalized,
          displayVariants: new Map(),
          evidence: [],
        });
      }
      const group = groups.get(key);
      group.displayVariants.set(row.candidate, (group.displayVariants.get(row.candidate) || 0) + 1);
      group.evidence.push({
        sourceId: page.id,
        sourceImage: page.sourceImage,
        sourceAsset: page.sourceAsset,
        regionId: region.id,
        visualCrop: visualCrop(region, row.bbox),
        strongMachineConsensus: row.strongMachineConsensus,
        independentAgreement: row.independentAgreement,
        exactNormalizedAgreement: row.exactNormalizedAgreement,
      });
    }
  }
}

const queue = [...groups.values()].map((group) => {
  const variants = [...group.displayVariants.entries()]
    .map(([text, occurrences]) => ({ text, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences || b.text.length - a.text.length);
  const sourceImages = new Set(group.evidence.map((item) => item.sourceId));
  const strongEvidence = group.evidence.filter((item) => item.strongMachineConsensus).length;
  return {
    grade: group.grade,
    unit: group.unit,
    candidate: variants[0]?.text || group.normalized,
    normalized: group.normalized,
    displayVariants: variants,
    evidenceImages: sourceImages.size,
    evidenceOccurrences: group.evidence.length,
    strongEvidence,
    reviewPriority: strongEvidence > 0 && sourceImages.size >= 2 ? "high_repeat_agreement" : strongEvidence > 0 ? "strong_single_image" : "manual_review",
    verificationStatus: "pending_visual_character_check",
    publishStatus: "blocked_until_visual_verification",
    evidence: group.evidence,
  };
}).sort((a, b) => (
  a.grade - b.grade
  || (a.unit ?? 0) - (b.unit ?? 0)
  || b.evidenceImages - a.evidenceImages
  || b.strongEvidence - a.strongEvidence
  || a.normalized.localeCompare(b.normalized)
));

const unitSummary = [];
for (const grade of [2, 3]) {
  for (let unit = 1; unit <= 12; unit += 1) {
    const rows = queue.filter((item) => item.grade === grade && item.unit === unit);
    unitSummary.push({
      grade,
      unit,
      uniqueCandidates: rows.length,
      repeatAgreement: rows.filter((item) => item.reviewPriority === "high_repeat_agreement").length,
      strongSingleImage: rows.filter((item) => item.reviewPriority === "strong_single_image").length,
      manualReview: rows.filter((item) => item.reviewPriority === "manual_review").length,
      visuallyVerified: 0,
      publishedExactLines: 0,
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  policy: "Candidates are OCR review aids only. Publication requires a human character-by-character check against the source crop.",
  summary: {
    sourcePageReports: filenames.length,
    sourceRows,
    excludedUiNoise,
    uniqueCandidates: queue.length,
    repeatAgreement: queue.filter((item) => item.reviewPriority === "high_repeat_agreement").length,
    strongSingleImage: queue.filter((item) => item.reviewPriority === "strong_single_image").length,
    manualReview: queue.filter((item) => item.reviewPriority === "manual_review").length,
    visuallyVerified: 0,
    publishedExactLines: 0,
  },
  unitSummary,
  queue,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  "# SOURCE OCR CANONICAL REVIEW",
  "",
  "Các dòng đã được gom theo lớp/Unit và nội dung chuẩn hóa để bỏ lặp do ảnh cuộn chồng nhau. Đây chưa phải bản chép nguyên văn.",
  "",
  `- Báo cáo ảnh nguồn: **${report.summary.sourcePageReports}**`,
  `- Dòng OCR ban đầu: **${report.summary.sourceRows}**`,
  `- Dòng giao diện/quảng cáo bị loại: **${report.summary.excludedUiNoise}**`,
  `- Ứng viên duy nhất còn lại: **${report.summary.uniqueCandidates}**`,
  `- Ứng viên lặp trên nhiều ảnh và có đồng thuận mạnh: **${report.summary.repeatAgreement}**`,
  `- Đã xác minh trực quan: **${report.summary.visuallyVerified}**`,
  `- Đã xuất bản nguyên văn: **${report.summary.publishedExactLines}**`,
  "",
  "## Theo Unit",
  "",
  "| Lớp | Unit | Ứng viên | Lặp mạnh | Mạnh một ảnh | Cần xem kỹ | Đã xác minh |",
  "|---:|---:|---:|---:|---:|---:|---:|",
  ...unitSummary.map((item) => `| ${item.grade} | ${item.unit} | ${item.uniqueCandidates} | ${item.repeatAgreement} | ${item.strongSingleImage} | ${item.manualReview} | ${item.visuallyVerified} |`),
];
await writeFile(markdownPath, `${markdown.join("\n")}\n`);
console.log(JSON.stringify(report.summary, null, 2));
