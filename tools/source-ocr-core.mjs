export const UI_NOISE_PATTERNS = [
  /scribd/i,
  /frenglish\.ru/i,
  /the magic door parts/i,
  /now\s*[|i]?\s*know\s+\d*\s*students?\s+book/i,
  /power up\s+\d+\s+activity book/i,
  /téléchargez|recommandé|recommand'?|imprimer|intégrer|signaler|en savoir|sans publicité/i,
  /titre amélior|pas encore d['’]évaluation|commencez votre essai|déverrouillez/i,
  /english file|ask ai|google chrome|activate windows/i,
];

export const cleanSpacing = (value) => String(value || "")
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
  .replace(/[ \t]+/g, " ")
  .replace(/\s+([,.;:!?])/g, "$1")
  .trim();

export const normalized = (value) => cleanSpacing(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[“”‘’]/g, "'")
  .replace(/[^a-z0-9'?.!, -]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function levenshtein(left, right) {
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

export function similarity(left, right) {
  const a = normalized(left);
  const b = normalized(right);
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function averageRgb(data, info, y, fromX, toX) {
  const start = Math.max(0, Math.round(fromX));
  const end = Math.min(info.width - 1, Math.round(toX));
  const row = Math.max(0, Math.min(info.height - 1, Math.round(y)));
  const totals = [0, 0, 0];
  let count = 0;
  for (let x = start; x <= end; x += 1) {
    const offset = (row * info.width + x) * info.channels;
    totals[0] += data[offset];
    totals[1] += data[offset + 1];
    totals[2] += data[offset + 2];
    count += 1;
  }
  return totals.map((total) => total / Math.max(1, count));
}

const rgbDistance = (left, right) => Math.hypot(
  left[0] - right[0],
  left[1] - right[1],
  left[2] - right[2],
);

export function sourcePageBounds(record, width) {
  const grade2 = Number(record.grade) === 2;
  return {
    left: Math.round(width * (grade2 ? 0.3115 : 0.2719)),
    right: Math.round(width * (grade2 ? 0.7474 : 0.8005)),
  };
}

export function detectBookPageBands(data, info, record) {
  const bounds = sourcePageBounds(record, info.width);
  const minimumY = Math.min(info.height - 1, Math.round(info.height * (Number(record.grade) === 2 ? 0.178 : 0.198)));
  const samples = [];
  for (let y = minimumY; y < info.height; y += 2) {
    const leftOutside = averageRgb(data, info, y, bounds.left - 18, bounds.left - 6);
    const leftInside = averageRgb(data, info, y, bounds.left + 2, bounds.left + 14);
    const rightOutside = averageRgb(data, info, y, bounds.right + 6, bounds.right + 18);
    const rightInside = averageRgb(data, info, y, bounds.right - 14, bounds.right - 2);
    samples.push({
      y,
      score: Math.max(rgbDistance(leftOutside, leftInside), rgbDistance(rightOutside, rightInside)),
    });
  }

  const sortedScores = samples.map((sample) => sample.score).sort((a, b) => a - b);
  // A screenshot can contain two book fragments and only a narrow advert gap,
  // so the lower decile is a safer estimate of the viewer background than the
  // lower quintile.
  const baseline = sortedScores[Math.floor(sortedScores.length * 0.1)] || 0;
  const threshold = baseline + Math.max(0.45, baseline * 0.1);
  const active = samples.map((sample, index) => {
    const from = Math.max(0, index - 2);
    const to = Math.min(samples.length, index + 3);
    const local = samples.slice(from, to).map((item) => item.score).sort((a, b) => a - b);
    return { y: sample.y, score: local[Math.floor(local.length / 2)], active: local[Math.floor(local.length / 2)] >= threshold };
  });

  const runs = [];
  let start = null;
  let lastActive = null;
  for (const sample of active) {
    if (sample.active) {
      if (start === null) start = sample.y;
      lastActive = sample.y;
    } else if (start !== null && sample.y - lastActive > 16) {
      runs.push({ top: start, bottom: lastActive });
      start = null;
      lastActive = null;
    }
  }
  if (start !== null) runs.push({ top: start, bottom: lastActive });

  const bands = runs
    .map((run) => ({
      left: bounds.left,
      top: Math.max(minimumY, run.top - 4),
      width: bounds.right - bounds.left + 1,
      height: Math.min(info.height - 1, run.bottom + 5) - Math.max(minimumY, run.top - 4) + 1,
    }))
    .filter((region) => region.height >= 96);

  return {
    bounds,
    baseline: Number(baseline.toFixed(3)),
    threshold: Number(threshold.toFixed(3)),
    confidence: bands.length ? "edge_detected" : "fallback_needs_review",
    bands: bands.length ? bands : [{
      left: bounds.left,
      top: minimumY,
      width: bounds.right - bounds.left + 1,
      height: info.height - minimumY,
    }],
  };
}

function validLine(line) {
  const value = normalized(line?.text);
  const words = value.split(/\s+/).filter(Boolean);
  return value.length >= 2 && value.length <= 220 && words.length <= 36;
}

function bboxCenterY(bbox) {
  return (bbox.y0 + bbox.y1) / 2;
}

function compatibleLines(anchor, candidate) {
  const leftLength = normalized(anchor.text).length;
  const rightLength = normalized(candidate.text).length;
  const ratio = Math.min(leftLength, rightLength) / Math.max(leftLength, rightLength, 1);
  if (ratio < 0.5) return false;
  const height = Math.max(anchor.bbox.y1 - anchor.bbox.y0, candidate.bbox.y1 - candidate.bbox.y0, 12);
  return Math.abs(bboxCenterY(anchor.bbox) - bboxCenterY(candidate.bbox)) <= Math.max(36, height * 2.25);
}

function nearestLine(anchor, candidates) {
  let best = null;
  for (const candidate of candidates) {
    if (!compatibleLines(anchor, candidate)) continue;
    const score = similarity(anchor.text, candidate.text);
    if (!best || score > best.score) best = { ...candidate, score };
  }
  return best;
}

function uniqueLines(lines) {
  const output = [];
  for (const line of lines.filter(validLine).sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0)) {
    if (output.some((item) => Math.abs(bboxCenterY(item.bbox) - bboxCenterY(line.bbox)) < 12 && similarity(item.text, line.text) >= 0.96)) continue;
    output.push(line);
  }
  return output;
}

export function buildSpatialConsensus(engineLines) {
  const windows = uniqueLines(engineLines.windows || []);
  const color = uniqueLines(engineLines.color || []);
  const threshold = uniqueLines(engineLines.threshold || []);
  const rows = [];
  const usedColor = new Set();
  const usedThreshold = new Set();

  for (const windowsLine of windows) {
    const colorMatch = nearestLine(windowsLine, color);
    const thresholdMatch = nearestLine(windowsLine, threshold);
    if (colorMatch) usedColor.add(colorMatch.id);
    if (thresholdMatch) usedThreshold.add(thresholdMatch.id);
    const tesseractMatch = [colorMatch, thresholdMatch].filter(Boolean).sort((a, b) => b.score - a.score)[0] || null;
    const independentAgreement = tesseractMatch?.score || 0;
    const exactNormalizedAgreement = Boolean(tesseractMatch && normalized(windowsLine.text) === normalized(tesseractMatch.text));
    const candidates = [
      { engine: "windows", ...windowsLine, score: 1 },
      colorMatch && { engine: "tesseract-color", ...colorMatch },
      thresholdMatch && { engine: "tesseract-threshold", ...thresholdMatch },
    ].filter(Boolean);
    const chosen = tesseractMatch && (tesseractMatch.confidence || 0) >= 70 ? tesseractMatch : windowsLine;
    const probableUiNoise = candidates.some((candidate) => UI_NOISE_PATTERNS.some((pattern) => pattern.test(candidate.text)));
    rows.push({
      candidate: cleanSpacing(chosen.text),
      normalized: normalized(chosen.text),
      strongMachineConsensus: !probableUiNoise && (exactNormalizedAgreement || independentAgreement >= 0.97),
      requiresVisualReview: true,
      visualVerificationStatus: "pending",
      publishedAsExactText: false,
      probableUiNoise,
      independentAgreement: Number(independentAgreement.toFixed(4)),
      exactNormalizedAgreement,
      bbox: windowsLine.bbox,
      candidates: candidates.map(({ engine, text, score, confidence, bbox }) => ({
        engine,
        text: cleanSpacing(text),
        score: Number((score || 0).toFixed(4)),
        confidence: Number.isFinite(confidence) ? Number(confidence.toFixed(2)) : null,
        bbox,
      })),
    });
  }

  for (const line of [...color.filter((item) => !usedColor.has(item.id)), ...threshold.filter((item) => !usedThreshold.has(item.id))]) {
    if (rows.some((row) => Math.abs(bboxCenterY(row.bbox) - bboxCenterY(line.bbox)) < 12 && similarity(row.candidate, line.text) >= 0.94)) continue;
    const probableUiNoise = UI_NOISE_PATTERNS.some((pattern) => pattern.test(line.text));
    rows.push({
      candidate: cleanSpacing(line.text),
      normalized: normalized(line.text),
      strongMachineConsensus: false,
      requiresVisualReview: true,
      visualVerificationStatus: "pending",
      publishedAsExactText: false,
      probableUiNoise,
      independentAgreement: 0,
      exactNormalizedAgreement: false,
      bbox: line.bbox,
      candidates: [{
        engine: line.engine || "tesseract",
        text: cleanSpacing(line.text),
        score: 1,
        confidence: Number.isFinite(line.confidence) ? Number(line.confidence.toFixed(2)) : null,
        bbox: line.bbox,
      }],
    });
  }

  return rows.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
}

export function tesseractLines(data, engine) {
  const lines = [];
  for (const block of data.blocks || []) {
    for (const paragraph of block.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        lines.push({
          id: `${engine}-${lines.length}`,
          engine,
          text: cleanSpacing(line.text),
          confidence: Number(line.confidence || 0),
          bbox: line.bbox,
        });
      }
    }
  }
  return lines;
}

export function windowsLines(result) {
  return (result.lines || []).map((line, index) => {
    const words = line.words || [];
    const left = Math.min(...words.map((word) => word.x));
    const top = Math.min(...words.map((word) => word.y));
    const right = Math.max(...words.map((word) => word.x + word.width));
    const bottom = Math.max(...words.map((word) => word.y + word.height));
    return {
      id: `windows-${index}`,
      engine: "windows",
      text: cleanSpacing(line.text),
      confidence: null,
      bbox: words.length ? { x0: left, y0: top, x1: right, y1: bottom } : { x0: 0, y0: index * 30, x1: 0, y1: index * 30 + 20 },
    };
  });
}
