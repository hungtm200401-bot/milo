import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { detectBookPageBands } from "./source-ocr-core.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const imageMap = JSON.parse(await readFile(join(root, "src", "data", "source-image-map-v60-17.json"), "utf8"));
const pages = [];

for (const record of imageMap.records) {
  const sourcePath = join(root, "content", record.sourceAsset);
  const { data, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const detection = detectBookPageBands(data, info, record);
  pages.push({
    id: record.id,
    grade: record.grade,
    unit: record.unit,
    sourceAsset: record.sourceAsset,
    sourceImage: record.sourceImage,
    imageSize: { width: info.width, height: info.height },
    detection,
    needsReview: detection.confidence !== "edge_detected" || detection.bands.length > 3,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  purpose: "Detect textbook page bands before OCR so browser controls, recommendations and adverts are excluded.",
  summary: {
    sourceImages: pages.length,
    grade2: pages.filter((page) => page.grade === 2).length,
    grade3: pages.filter((page) => page.grade === 3).length,
    edgeDetected: pages.filter((page) => page.detection.confidence === "edge_detected").length,
    fallbackNeedsReview: pages.filter((page) => page.detection.confidence !== "edge_detected").length,
    unusualBandCount: pages.filter((page) => page.detection.bands.length > 3).length,
  },
  reviewQueue: pages.filter((page) => page.needsReview).map((page) => page.id),
  pages,
};

await writeFile(join(root, "reports", "SOURCE_PAGE_REGIONS.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
if (report.summary.edgeDetected + report.summary.fallbackNeedsReview !== report.summary.sourceImages) process.exit(1);
