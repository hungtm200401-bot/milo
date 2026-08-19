import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";
import { createWorker, OEM, PSM } from "tesseract.js";
import englishData from "@tesseract.js-data/eng";
import {
  buildSpatialConsensus,
  cleanSpacing,
  detectBookPageBands,
  tesseractLines,
  windowsLines,
} from "./source-ocr-core.mjs";

const execFileAsync = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pageDirectory = join(root, "reports", "source-ocr-consensus", "pages");
const reportPath = join(root, "reports", "SOURCE_OCR_CONSENSUS.json");
const reviewPath = join(root, "reports", "SOURCE_OCR_REVIEW.md");
const imageMap = JSON.parse(await readFile(join(root, "src", "data", "source-image-map-v60-17.json"), "utf8"));
const PIPELINE_VERSION = 2;

function optionsFromArgs(args) {
  const options = { grade: 0, unit: 0, limit: 0, ids: [], all: false, resume: false };
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (item === "--all") options.all = true;
    else if (item === "--resume") options.resume = true;
    else if (item === "--grade") options.grade = Number(args[++index]);
    else if (item === "--unit") options.unit = Number(args[++index]);
    else if (item === "--limit") options.limit = Number(args[++index]);
    else if (item === "--id") options.ids.push(...String(args[++index] || "").split(",").filter(Boolean));
  }
  return options;
}

const options = optionsFromArgs(process.argv.slice(2));
let records = imageMap.records.filter((record) => {
  if (options.grade && record.grade !== options.grade) return false;
  if (options.unit && record.unit !== options.unit) return false;
  if (options.ids.length && !options.ids.includes(record.id)) return false;
  return options.all || options.grade || options.unit || options.ids.length;
});
if (!records.length) {
  console.error("Choose --all, --grade N, --unit N or --id id1,id2.");
  process.exit(2);
}
if (options.limit > 0) records = records.slice(0, options.limit);

async function windowsOcr(path) {
  const powershell = join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const script = join(root, "tools", "windows-ocr.ps1");
  const { stdout } = await execFileAsync(
    powershell,
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-InputPath", path],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(stdout.trim());
}

async function tesseractOcr(worker, image, pageSegmentationMode, engine) {
  await worker.setParameters({
    tessedit_pageseg_mode: pageSegmentationMode,
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });
  const { data } = await worker.recognize(image, {}, { text: true, blocks: true });
  return {
    confidence: Number(data.confidence.toFixed(2)),
    text: cleanSpacing(data.text).replace(/\s*\n\s*/g, "\n"),
    lines: tesseractLines(data, engine),
  };
}

function splitBand(band) {
  const half = Math.floor(band.width / 2);
  return [
    { side: "left", left: band.left + 2, top: band.top, width: Math.max(1, half - 3), height: band.height },
    { side: "right", left: band.left + half, top: band.top, width: Math.max(1, band.width - half - 2), height: band.height },
  ];
}

async function recognizeRegion(worker, sourcePath, record, bandIndex, region) {
  const scale = 3;
  const base = sharp(sourcePath)
    .extract({ left: region.left, top: region.top, width: region.width, height: region.height })
    .resize({ width: region.width * scale, height: region.height * scale, kernel: "lanczos3" });
  const color = await base.clone().sharpen().png({ compressionLevel: 9 }).toBuffer();
  const threshold = await base.clone().grayscale().normalize().sharpen().threshold(185).png({ compressionLevel: 9 }).toBuffer();
  const temporaryPath = join(tmpdir(), `milo-source-ocr-${record.id}-${bandIndex}-${region.side}-${process.pid}.png`);
  await writeFile(temporaryPath, color);
  try {
    const windowsPromise = windowsOcr(temporaryPath);
    const tesseractColor = await tesseractOcr(worker, color, PSM.AUTO, "tesseract-color");
    const tesseractThreshold = await tesseractOcr(worker, threshold, PSM.SPARSE_TEXT, "tesseract-threshold");
    const windows = await windowsPromise;
    const consensus = buildSpatialConsensus({
      color: tesseractColor.lines,
      threshold: tesseractThreshold.lines,
      windows: windowsLines(windows),
    });
    return {
      id: `${record.id}-band${bandIndex + 1}-${region.side}`,
      sourceRegion: region,
      scale,
      engines: {
        tesseractColor,
        tesseractThreshold,
        windows: { language: windows.language, text: windows.text, lines: windows.lines },
      },
      summary: {
        consensusLines: consensus.length,
        strongMachineConsensus: consensus.filter((row) => row.strongMachineConsensus).length,
        requiresVisualReview: consensus.filter((row) => !row.probableUiNoise).length,
        probableUiNoise: consensus.filter((row) => row.probableUiNoise).length,
        publishedExactLines: consensus.filter((row) => row.publishedAsExactText).length,
      },
      consensus,
    };
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

await mkdir(pageDirectory, { recursive: true });
const worker = await createWorker("eng", OEM.LSTM_ONLY, {
  langPath: englishData.langPath,
  gzip: englishData.gzip,
  cacheMethod: "none",
});

const pages = [];
try {
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const cachedPath = join(pageDirectory, `${record.id}.json`);
    if (options.resume) {
      try {
        const cached = JSON.parse(await readFile(cachedPath, "utf8"));
        if (cached.pipelineVersion === PIPELINE_VERSION) {
          pages.push(cached);
          console.log(`[${index + 1}/${records.length}] ${record.id} cached`);
          continue;
        }
      } catch {
        // Missing or incomplete cache: recognize the source image below.
      }
    }
    const sourcePath = join(root, "content", record.sourceAsset);
    const { data, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const pageDetection = detectBookPageBands(data, info, record);
    const regions = [];
    for (let bandIndex = 0; bandIndex < pageDetection.bands.length; bandIndex += 1) {
      for (const region of splitBand(pageDetection.bands[bandIndex])) {
        regions.push(await recognizeRegion(worker, sourcePath, record, bandIndex, region));
      }
    }
    const sum = (field) => regions.reduce((total, region) => total + region.summary[field], 0);
    const page = {
      pipelineVersion: PIPELINE_VERSION,
      id: record.id,
      grade: record.grade,
      unit: record.unit,
      sourceImage: record.sourceImage,
      sourceAsset: record.sourceAsset,
      sourceStatus: record.sourceStatus,
      pageDetection,
      regions,
      summary: {
        detectedBookBands: pageDetection.bands.length,
        consensusLines: sum("consensusLines"),
        strongMachineConsensus: sum("strongMachineConsensus"),
        requiresVisualReview: sum("requiresVisualReview"),
        probableUiNoise: sum("probableUiNoise"),
        publishedExactLines: sum("publishedExactLines"),
      },
      publishStatus: "machine_consensus_needs_visual_review",
    };
    pages.push(page);
    await writeFile(cachedPath, `${JSON.stringify(page, null, 2)}\n`);
    console.log(`[${index + 1}/${records.length}] ${record.id} bands=${page.summary.detectedBookBands} strong=${page.summary.strongMachineConsensus} review=${page.summary.requiresVisualReview}`);
  }
} finally {
  await worker.terminate();
}

const report = {
  version: "60.25.0-source-ocr-consensus",
  generatedAt: new Date().toISOString(),
  policy: {
    publish: "No machine-only OCR line is published as exact book text.",
    consensus: "A strong candidate requires positional and textual agreement between Windows OCR and Tesseract. Two Tesseract passes are not counted as independent engines.",
    finalVerification: "Every candidate requires character-by-character visual comparison with the original source image before publication.",
  },
  selection: {
    grade: options.grade || null,
    unit: options.unit || null,
    ids: options.ids,
    requestedAll: options.all,
  },
  summary: {
    pages: pages.length,
    sourceRegions: pages.reduce((sum, page) => sum + page.regions.length, 0),
    strongMachineConsensus: pages.reduce((sum, page) => sum + page.summary.strongMachineConsensus, 0),
    requiresVisualReview: pages.reduce((sum, page) => sum + page.summary.requiresVisualReview, 0),
    probableUiNoise: pages.reduce((sum, page) => sum + page.summary.probableUiNoise, 0),
    publishedExactLines: pages.reduce((sum, page) => sum + page.summary.publishedExactLines, 0),
  },
  pages: pages.map((page) => ({
    id: page.id,
    grade: page.grade,
    unit: page.unit,
    sourceImage: page.sourceImage,
    pageDetection: page.pageDetection,
    summary: page.summary,
    publishStatus: page.publishStatus,
  })),
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const reviewLines = [
  "# SOURCE OCR REVIEW",
  "",
  "Không dòng nào được coi là nguyên văn sách chỉ nhờ OCR. Dòng đồng thuận mạnh vẫn phải mở ảnh và kiểm tra từng ký tự.",
  "",
  `- Ảnh đã chạy: **${report.summary.pages}**`,
  `- Vùng trang trái/phải: **${report.summary.sourceRegions}**`,
  `- Dòng đồng thuận mạnh giữa hai bộ máy độc lập: **${report.summary.strongMachineConsensus}**`,
  `- Dòng chờ đối chiếu ảnh: **${report.summary.requiresVisualReview}**`,
  `- Dòng nghi là giao diện/quảng cáo: **${report.summary.probableUiNoise}**`,
  `- Dòng được tự động xuất bản: **${report.summary.publishedExactLines}**`,
  "",
  "## Hàng chờ",
  "",
  ...pages.map((page) => `- ${page.id} · G${page.grade} U${page.unit ?? "-"} · ${page.summary.detectedBookBands} dải trang · mạnh ${page.summary.strongMachineConsensus} · cần xem ${page.summary.requiresVisualReview} · reports/source-ocr-consensus/pages/${page.id}.json`),
];
await writeFile(reviewPath, `${reviewLines.join("\n")}\n`);
console.log(JSON.stringify(report.summary, null, 2));
