/*
 * Lớp 2 — chế độ nguồn nghiêm ngặt từ hai ZIP anh_tam.
 * Mục đích: ngăn dữ liệu từ vựng cũ / Scope & Sequence bên ngoài hai ZIP
 * xuất hiện trong phần Từ mới, nhóm từ mở rộng, báo cáo quản trị và bài học.
 */
(function () {
  "use strict";

  const grade = window.MILO_CURRICULUM?.[2];
  if (!grade || !Array.isArray(grade.units) || grade.units.length !== 12) {
    throw new Error("GRADE2_STRICT: Không tìm thấy đủ 12 Unit lớp 2.");
  }

  const expectedCounts = [16, 16, 16, 16, 16, 16, 16, 16, 20, 16, 16, 16];
  const expectedTotal = 196;
  const auditUnits = [];

  const normalize = (value) => String(value || "").trim().toLowerCase();

  grade.units.forEach((unit, unitIndex) => {
    const sourceGroups = Array.isArray(unit.vocabularyGroups)
      ? unit.vocabularyGroups.slice(0, 2).map((group) => ({
          label: group.label,
          terms: Array.isArray(group.terms) ? group.terms.slice() : [],
        }))
      : [];

    if (sourceGroups.length !== 2) {
      throw new Error(`GRADE2_STRICT: Unit ${unitIndex + 1} thiếu 2 bảng Vocabulary nguồn.`);
    }

    const orderedTerms = sourceGroups.flatMap((group) => group.terms);
    const expectedCount = expectedCounts[unitIndex];
    if (orderedTerms.length !== expectedCount) {
      throw new Error(
        `GRADE2_STRICT: Unit ${unitIndex + 1} có ${orderedTerms.length}/${expectedCount} từ nguồn.`,
      );
    }

    const existingWords = new Map(
      (Array.isArray(unit.words) ? unit.words : []).map((word) => [
        normalize(word?.[0]),
        word,
      ]),
    );

    const strictWords = orderedTerms.map((term) => {
      const word = existingWords.get(normalize(term));
      if (!word) {
        throw new Error(`GRADE2_STRICT: Thiếu dữ liệu từ “${term}” ở Unit ${unitIndex + 1}.`);
      }
      return word.slice();
    });

    // Nguồn từ mới duy nhất của lớp 2: đúng hai bảng Vocabulary trong hai ZIP.
    unit.words = strictWords;
    unit.vocabularyGroups = sourceGroups;

    const objectives = {
      grammar: (unit.grammarFocus || []).join(" · "),
      listening: "Học qua nội dung và trang nguồn có trong hai ZIP; không gắn audio ngoài nguồn.",
      reading: unit.skills?.[0] || "Đọc nội dung trên trang nguồn của Unit.",
      speaking: unit.skills?.[1] || "Luyện nói theo nội dung của Unit.",
      writing: unit.skills?.[2] || unit.writing || "Luyện viết theo nội dung của Unit.",
    };

    unit.alignment = {
      title: unit.title,
      benchmark: "Lớp 2 · nguồn nghiêm ngặt từ anh_tam(1) và anh_tam(2)",
      vocabularyGroups: sourceGroups.map((group) => ({
        label: group.label,
        terms: group.terms.slice(),
      })),
      extendedWords: orderedTerms.map((term) => ({
        term,
        group: sourceGroups.find((group) => group.terms.includes(term))?.label || "Vocabulary",
        active: true,
      })),
      objectives,
      exerciseTypes: [
        "Học đúng từ mới trong hai bảng Vocabulary của Unit",
        "Nghe phát âm bằng giọng máy từ đúng danh sách nguồn",
        "Xem toàn bộ trang ảnh gốc thuộc hai ZIP",
        "Luyện ngữ pháp, đọc, nói, viết theo nội dung đã gắn với Unit nguồn",
      ],
      sourcePolicy: "ZIP_ONLY_GRADE2",
    };

    const sourceTerms = strictWords.map((word, termIndex) => {
      const term = String(word[0]);
      const group = sourceGroups.find((item) => item.terms.includes(term))?.label || "Vocabulary";
      return {
        id: `g2-u${unitIndex + 1}-zip-t${termIndex + 1}`,
        term,
        meaning: String(word[1] || ""),
        group,
        groupVi: group === "Key vocabulary 1" ? "Từ mới 1" : "Từ mới 2",
        active: true,
        example: String(word[3] || ""),
        exampleType: "zip-source-core",
        pronunciation: "speech-synthesis",
      };
    });

    unit.fullKnowledge = {
      ...(unit.fullKnowledge || {}),
      version: "V60.12.2-ZIP-STRICT-196",
      scope: "Lớp 2 chỉ dùng dữ liệu được gắn với hai ZIP anh_tam; không trộn danh sách từ cũ.",
      sourceTerms,
      sourceTermCount: sourceTerms.length,
      vocabularyGroups: sourceGroups.map((group) => ({
        label: group.label,
        labelVi: group.label === "Key vocabulary 1" ? "Từ mới 1" : "Từ mới 2",
        terms: group.terms.slice(),
      })),
      objectives,
      verification: {
        ...(unit.fullKnowledge?.verification || {}),
        zipVocabularyOnly: true,
        expectedVocabularyCount: expectedCount,
        actualVocabularyCount: sourceTerms.length,
        noLegacyVocabularyGroups: true,
      },
    };

    auditUnits.push({
      unit: unitIndex + 1,
      expected: expectedCount,
      actual: strictWords.length,
      groups: sourceGroups.map((group) => ({ label: group.label, count: group.terms.length })),
      terms: orderedTerms.slice(),
    });
  });

  const total = grade.units.reduce((sum, unit) => sum + unit.words.length, 0);
  if (total !== expectedTotal) {
    throw new Error(`GRADE2_STRICT: Tổng từ mới là ${total}/${expectedTotal}.`);
  }

  window.MILO_GRADE2_FULL_KNOWLEDGE = {
    ...(window.MILO_GRADE2_FULL_KNOWLEDGE || {}),
    version: "V60.12.2-ZIP-STRICT-196",
    generatedAt: "2026-08-03",
    vocabularyPolicy: "Chỉ 196 mục từ trong hai bảng Vocabulary của 12 Unit từ hai ZIP.",
    totalVocabularyTerms: expectedTotal,
    units: grade.units.map((unit) => unit.fullKnowledge),
    limitations: [
      "Không dùng các nhóm CLIL/Reading/Passive/Revised cũ làm danh sách Từ mới.",
      "Audio gốc không có trong hai ZIP; nút nghe dùng speech synthesis.",
      "Toàn bộ 181 ảnh nguồn vẫn được giữ trong mục Sách nguồn.",
    ],
  };

  window.MILO_GRADE2_STRICT_AUDIT = Object.freeze({
    version: "V60.12.2-ZIP-STRICT-196",
    source: ["anh_tam(1)(1).zip", "anh_tam(2)(1).zip"],
    totalUnits: auditUnits.length,
    totalTerms: total,
    legacyVocabularyGroupsRemoved: true,
    units: auditUnits,
  });
})();
