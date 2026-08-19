import { readFileSync, writeFileSync } from "node:fs";

const g2Data = JSON.parse(readFileSync("src/data/GRADE2_VOCABULARY_196_FROM_2_ZIPS.json", "utf8"));
const g3Data = JSON.parse(readFileSync("src/data/GRADE3_KEY_VOCABULARY_240.json", "utf8"));

// 1. Clean Compact JSON
const cleanVocabJson = {
  grade2: g2Data.units.map(u => ({
    unit: u.unit,
    title: u.title,
    theme: u.theme,
    words: (u.items || []).map(i => ({
      term: i.term,
      meaning: i.meaning
    }))
  })),
  grade3: Object.entries(g3Data.units).map(([unitNum, items]) => ({
    unit: Number(unitNum),
    title: g3Data.titles?.[unitNum] || `Unit ${unitNum}`,
    words: (items || []).map(i => ({
      term: i.term,
      meaning: i.meaning
    }))
  }))
};

writeFileSync("src/data/DANH_SACH_TU_MOI_LOP_2_VA_LOP_3.json", JSON.stringify(cleanVocabJson, null, 2), "utf8");

// 2. Clean Text File (.txt)
let txtContent = `=======================================================
DANH SÁCH TOÀN BỘ TỪ MỚI LỚP 2 VÀ LỚP 3 (TỔNG CỘNG 436 TỪ)
=======================================================\n\n`;

txtContent += `-------------------------------------------------------\n`;
txtContent += `PHẦN I: TỪ MỚI LỚP 2 (12 UNITS - 196 TỪ)\n`;
txtContent += `-------------------------------------------------------\n\n`;

g2Data.units.forEach(u => {
  txtContent += `[LỚP 2 - UNIT ${u.unit}: ${u.title.toUpperCase()} (${u.theme})]\n`;
  (u.items || []).forEach((item, idx) => {
    txtContent += `  ${idx + 1}. ${item.term}: ${item.meaning}\n`;
  });
  txtContent += `\n`;
});

txtContent += `-------------------------------------------------------\n`;
txtContent += `PHẦN II: TỪ MỚI LỚP 3 (12 UNITS - 240 TỪ)\n`;
txtContent += `-------------------------------------------------------\n\n`;

Object.entries(g3Data.units).forEach(([unitNum, items]) => {
  const title = g3Data.titles?.[unitNum] || `Unit ${unitNum}`;
  txtContent += `[LỚP 3 - UNIT ${unitNum}: ${title.toUpperCase()}]\n`;
  (items || []).forEach((item, idx) => {
    txtContent += `  ${idx + 1}. ${item.term}: ${item.meaning}\n`;
  });
  txtContent += `\n`;
});

writeFileSync("docs/DANH_SACH_TU_MOI_LOP_2_VA_LOP_3.txt", txtContent, "utf8");

console.log("✅ Đã tạo thành công 2 file chỉ chứa từ mới:");
console.log("1. src/data/DANH_SACH_TU_MOI_LOP_2_VA_LOP_3.json");
console.log("2. docs/DANH_SACH_TU_MOI_LOP_2_VA_LOP_3.txt");
