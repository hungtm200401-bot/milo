import { readFileSync, writeFileSync } from "node:fs";

const curriculum = JSON.parse(readFileSync("src/data/GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json", "utf8"));

// 1. Compile JSON Master Vocabulary Dictionary
const allVocabList = [];
let g2List = [];
let g3List = [];

curriculum.grade2.forEach((unit) => {
  unit.magicWords.forEach((word, idx) => {
    const item = {
      grade: 2,
      unitNumber: unit.unit,
      unitTitle: unit.title,
      unitThemeVi: unit.vietnameseTitle,
      orderInUnit: idx + 1,
      term: word.term,
      ipa: word.ipa,
      meaning: word.meaning,
      exampleEn: word.exampleEn,
      exampleVi: word.exampleVi,
      tprAction: word.tprAction,
      flashcard3D: word.flashcard
    };
    allVocabList.push(item);
    g2List.push(item);
  });
});

curriculum.grade3.forEach((unit) => {
  unit.magicWords.forEach((word, idx) => {
    const item = {
      grade: 3,
      unitNumber: unit.unit,
      unitTitle: unit.title,
      unitThemeVi: unit.vietnameseTitle,
      orderInUnit: idx + 1,
      term: word.term,
      ipa: word.ipa,
      meaning: word.meaning,
      exampleEn: word.exampleEn,
      exampleVi: word.exampleVi,
      tprAction: word.tprAction,
      flashcard3D: word.flashcard
    };
    allVocabList.push(item);
    g3List.push(item);
  });
});

const masterVocabJson = {
  title: "TỔNG HỢP TOÀN BỘ 436 TỪ VỰNG TIẾNG ANH LỚP 2 VÀ LỚP 3 (MILO ENGLISH ADVENTURE)",
  createdAt: new Date().toISOString(),
  totalWords: allVocabList.length,
  grade2: {
    totalUnits: 12,
    totalWords: g2List.length,
    words: g2List
  },
  grade3: {
    totalUnits: 12,
    totalWords: g3List.length,
    words: g3List
  },
  allVocabulary: allVocabList
};

writeFileSync(
  "src/data/TONG_HOP_TAT_CA_TU_MOI_LOP_2_VA_LOP_3_436_TU.json",
  JSON.stringify(masterVocabJson, null, 2),
  "utf8"
);

// 2. Compile Human-Readable Markdown Document
let mdContent = `# 🌟 BẢNG TỔNG HỢP TOÀN BỘ 436 TỪ VỰNG TIẾNG ANH LỚP 2 & LỚP 3
**Dự Án:** Milo English Adventure  
**Chuẩn Sư Phạm:** Teacher Milo - World-Class Kids English Pedagogical Expert  
**Tổng số từ vựng:** 436 từ (196 từ Lớp 2 + 240 từ Lớp 3)  
**Hình thức học:** 100% từ mới có hình ảnh 3D chuyển động riêng biệt, phát âm chuẩn IPA, nghĩa tiếng Việt, câu ví dụ và động tác trực quan (TPR).

---

## 📑 MỤC LỤC TỔNG QUAN
- [I. DANH SÁCH TỪ VỰNG LỚP 2 (12 UNITS - 196 TỪ)](#i-danh-sách-từ-vựng-lớp-2-12-units---196-từ)
- [II. DANH SÁCH TỪ VỰNG LỚP 3 (12 UNITS - 240 TỪ)](#ii-danh-sách-từ-vựng-lớp-3-12-units---240-từ)

---

## I. DANH SÁCH TỪ VỰNG LỚP 2 (12 UNITS - 196 TỪ)
`;

curriculum.grade2.forEach((unit) => {
  mdContent += `\n### 📘 Lớp 2 · Unit ${unit.unit}: ${unit.title} (${unit.vietnameseTitle})\n`;
  mdContent += `| STT | Từ vựng (Term) | Phiên âm (IPA) | Nghĩa tiếng Việt | Câu ví dụ (Example) | Động tác trực quan (TPR) |\n`;
  mdContent += `| :---: | :--- | :--- | :--- | :--- | :--- |\n`;
  unit.magicWords.forEach((w, idx) => {
    mdContent += `| ${idx + 1} | **${w.term}** | \`${w.ipa}\` | ${w.meaning} | ${w.exampleEn}<br>👉 *${w.exampleVi}* | ${w.tprAction} |\n`;
  });
});

mdContent += `\n---\n\n## II. DANH SÁCH TỪ VỰNG LỚP 3 (12 UNITS - 240 TỪ)\n`;

curriculum.grade3.forEach((unit) => {
  mdContent += `\n### 📗 Lớp 3 · Unit ${unit.unit}: ${unit.title} (${unit.vietnameseTitle})\n`;
  mdContent += `| STT | Từ vựng (Term) | Phiên âm (IPA) | Nghĩa tiếng Việt | Câu ví dụ (Example) | Động tác trực quan (TPR) |\n`;
  mdContent += `| :---: | :--- | :--- | :--- | :--- | :--- |\n`;
  unit.magicWords.forEach((w, idx) => {
    mdContent += `| ${idx + 1} | **${w.term}** | \`${w.ipa}\` | ${w.meaning} | ${w.exampleEn}<br>👉 *${w.exampleVi}* | ${w.tprAction} |\n`;
  });
});

writeFileSync("docs/TONG_HOP_TOAN_BO_TU_MOI_LOP_2_VA_LOP_3_436_TU.md", mdContent, "utf8");

console.log("✅ Đã xuất thành công 2 tệp tổng hợp 436 từ vựng:");
console.log("1. src/data/TONG_HOP_TAT_CA_TU_MOI_LOP_2_VA_LOP_3_436_TU.json");
console.log("2. docs/TONG_HOP_TOAN_BO_TU_MOI_LOP_2_VA_LOP_3_436_TU.md");
console.log(`Tổng số: Lớp 2 = ${g2List.length} từ | Lớp 3 = ${g3List.length} từ | Tổng cộng = ${allVocabList.length} từ.`);
