import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const inputPath = join(root, "src", "data", "source-exact-transcriptions.json");
const outputPath = join(root, "src", "js", "source-exact-transcriptions.js");
const data = JSON.parse(readFileSync(inputPath, "utf8"));

const output = `/* Generated from src/data/source-exact-transcriptions.json. Do not edit by hand. */\nwindow.MILO_SOURCE_EXACT_TRANSCRIPTIONS = ${JSON.stringify(data, null, 2)};\n`;
writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${outputPath} with ${data.entries.length} verified records.`);
