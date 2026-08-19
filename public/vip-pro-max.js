(function () {
  const curriculum = window.MILO_CURRICULUM;
  if (!curriculum) return;

  const VERSION = "V60.12.0 · VIP PRO MAX · NOW I KNOW ALIGNMENT";
  const standards = {
    2: {
      level: "Now I Know Level 2",
      benchmark: "GSE 27–34 · A1/A2",
      minutes: 35,
      words: "12–16",
      reading: "25–50",
      writing: "5–15",
      speaking: 4,
      evidence: 1,
      pass: 75,
    },
    3: {
      level: "Now I Know Level 3",
      benchmark: "GSE 33–39 · A2/A2+",
      minutes: 45,
      words: "14–20",
      reading: "60–100",
      writing: "35–60",
      speaking: 6,
      evidence: 1,
      pass: 80,
    },
    4: {
      level: "Now I Know Level 4",
      benchmark: "GSE 38–46 · A2+/B1",
      minutes: 50,
      words: "16–24",
      reading: "120–180",
      writing: "80–120",
      speaking: 8,
      evidence: 2,
      pass: 80,
    },
    5: {
      level: "Now I Know Level 5",
      benchmark: "GSE 43–54 · B1/B1+",
      minutes: 55,
      words: "18–28",
      reading: "180–260",
      writing: "130–180",
      speaking: 10,
      evidence: 2,
      pass: 80,
    },
  };

  function clean(value) {
    return String(value || "").trim();
  }

  function splitWords(unit) {
    const midpoint = Math.ceil(unit.words.length / 2);
    return [
      unit.words.slice(0, midpoint).map((item) => item[0]),
      unit.words.slice(midpoint).map((item) => item[0]),
    ];
  }

  function grammarItems(unit) {
    const focus = (unit.grammarFocus || []).filter(Boolean);
    return [
      focus[0] || "Mẫu câu giao tiếp của Unit",
      focus[1] || focus[0] || "Dùng từ mới trong câu hoàn chỉnh",
      focus[2] || "Mở rộng câu bằng chi tiết và từ nối phù hợp",
    ];
  }

  function buildOutcomes(unit, grade) {
    const spec = standards[grade];
    const grammar = grammarItems(unit);
    return [
      `Trả lời Big Question “${unit.title}” bằng câu tiếng Anh đúng mức lớp ${grade}.`,
      `Hiểu và dùng chủ động ${unit.words.length} từ/cụm từ trọng tâm; nhận diện ngân hàng ${unit.alignment?.extendedWords?.length || unit.words.length} mục từ theo nhóm của Unit.`,
      `Hỏi “${unit.pattern[0]}” và đáp “${unit.pattern[1]}” với ít nhất ${spec.speaking} lượt hội thoại.`,
      `Dùng đúng trọng tâm ngữ pháp: ${grammar.join(" · ")}.`,
      `Nhận ra và đọc rõ trọng tâm âm: ${unit.phonics}.`,
      `Đọc hai văn bản nguyên bản; tìm ít nhất ${spec.evidence} chi tiết làm bằng chứng cho câu trả lời.`,
      `Viết sản phẩm ${spec.writing} từ theo đúng đề: ${unit.writing}`,
      `Hoàn thành dự án ứng dụng và đạt tối thiểu ${spec.pass}% ở bài kiểm tra cuối Unit.`,
    ];
  }

  function buildSessions(unit, grade) {
    const spec = standards[grade];
    const wordSets = splitWords(unit);
    const grammar = grammarItems(unit);
    const reading = unit.expert?.reading || {};
    const tracks = unit.expert?.listening || [];
    return [
      {
        icon: "❓",
        title: "Big Question & chẩn đoán",
        focus: unit.title,
        output: `Nói điều em đã biết và thử trả lời: ${unit.pattern[0]}`,
      },
      {
        icon: "🖼️",
        title: "Vocabulary A trong ngữ cảnh",
        focus: wordSets[0].join(" · "),
        output: `Nhận diện, nghe và dùng ${wordSets[0].length} từ trong câu.`,
      },
      {
        icon: "🧠",
        title: "Language Focus 1",
        focus: grammar[0],
        output: `Tạo ba câu mới theo mẫu “${unit.pattern[1]}”.`,
      },
      {
        icon: "📖",
        title: "Reading 1 · Fiction & Values",
        focus: reading.sourceATitle || "Truyện nguyên bản và giá trị sống",
        output: `Nêu nhân vật/sự việc chính và ${spec.evidence} chi tiết bằng chứng.`,
      },
      {
        icon: "🔤",
        title: "Vocabulary B & Phonics",
        focus: `${wordSets[1].join(" · ")} · ${unit.phonics}`,
        output: "Nghe–nhắc lại–phân biệt âm, sau đó đọc một câu hoàn chỉnh.",
      },
      {
        icon: "🚀",
        title: "Language Focus 2",
        focus: grammar[1],
        output: "Làm bài nhận biết, điền câu và tự tạo câu.",
      },
      {
        icon: "🌍",
        title: "Reading 2 · Factual & CLIL",
        focus: reading.sourceBTitle || "Bài đọc kiến thức thế giới nguyên bản",
        output: `Tìm ý chính, từ khóa và ${spec.evidence} dữ kiện hỗ trợ.`,
      },
      {
        icon: "🎧",
        title: "Listening Lab",
        focus: tracks.map((item) => item.title).join(" · ") || "Ý chính và chi tiết",
        output: `Nghe ba lượt: dự đoán → bắt ý → ghi ${grade >= 4 ? 5 : 3} từ khóa.`,
      },
      {
        icon: "💬",
        title: "Speaking Mission",
        focus: `${unit.pattern[0]} ↔ ${unit.pattern[1]}`,
        output: `Thực hiện hội thoại ${spec.speaking} lượt và thay thông tin bằng ý thật của em.`,
      },
      {
        icon: "✍️",
        title: "Writing Workshop",
        focus: unit.writing,
        output: `Lập ý → viết nháp → tự kiểm → hoàn thiện ${spec.writing} từ.`,
      },
      {
        icon: "🎨",
        title: "Project & Show and Tell",
        focus: unit.project,
        output: "Tạo sản phẩm, dùng từ/mẫu câu Unit và trình bày cho một người nghe.",
      },
      {
        icon: "🏆",
        title: "Mastery Test & học lại",
        focus: `${unit.expert?.standard?.testItems || 24} câu · chuẩn đạt ${spec.pass}%`,
        output: "Phân tích lỗi theo kỹ năng; học lại phần yếu trước khi mở Unit tiếp.",
      },
    ];
  }

  function buildRubric(unit, grade) {
    const spec = standards[grade];
    return [
      {
        skill: "Vocabulary & Grammar",
        icon: "🧠",
        ready: `Dùng đúng ít nhất 85% từ mục tiêu và các cấu trúc ${grammarItems(unit).slice(0, 2).join(" / ")}.`,
        review: "Ôn lại từ bằng hình–âm–câu; làm lại Grammar Levels còn sai.",
      },
      {
        skill: "Listening & Speaking",
        icon: "🎧",
        ready: `Bắt được ý chính, chi tiết quan trọng và duy trì ${spec.speaking} lượt nói.`,
        review: "Nghe chậm, ghi từ khóa rồi shadow từng cụm; chưa cần nói nhanh.",
      },
      {
        skill: "Reading",
        icon: "📖",
        ready: `Xác định ý chính và chỉ ra ${spec.evidence} bằng chứng từ hai bài đọc.`,
        review: "Đọc lại tiêu đề/câu hỏi, khoanh từ khóa rồi tìm câu chứa bằng chứng.",
      },
      {
        skill: "Writing & Project",
        icon: "✍️",
        ready: `Viết ${spec.writing} từ, có từ Unit, mẫu câu, chữ hoa và dấu câu; hoàn thành project.`,
        review: "Dùng khung lập ý ba bước, sửa một lỗi mỗi lượt thay vì viết lại toàn bộ.",
      },
    ];
  }

  function buildHomePlan(unit, grade) {
    const spec = standards[grade];
    const daily = Math.max(15, Math.round(spec.minutes / 2));
    return [
      `Ngày 1 · ${daily} phút: xem Big Question, học nửa đầu bộ từ và nói mẫu câu.`,
      `Ngày 2 · ${daily} phút: đọc Reading 1, kể lại ý chính và giá trị sống.`,
      `Ngày 3 · ${daily} phút: học nửa sau bộ từ, phonics và Language Focus.`,
      `Ngày 4 · ${daily} phút: đọc Reading 2, tìm dữ kiện CLIL và nghe hai Track.`,
      `Ngày 5 · ${daily} phút: luyện hội thoại, viết nháp và để phụ huynh nghe bài nói.`,
      `Ngày 6 · ${daily} phút: làm Project, tự kiểm bài viết và chơi ôn tập.`,
      `Ngày 7 · ${spec.minutes} phút: làm Treasure Test; chỉ mở Unit tiếp khi đạt ${spec.pass}%.`,
    ];
  }

  function pack(unit, grade, unitIndex) {
    const spec = standards[grade] || standards[3];
    return {
      version: VERSION,
      grade,
      unit: unitIndex + 1,
      level: spec.level,
      benchmark: spec.benchmark,
      lessonMinutes: spec.minutes,
      reference: clean(unit.reference) || `${spec.level} · Unit ${unitIndex + 1}`,
      policy:
        "Milo đối chiếu Big Question, phạm vi từ vựng, cấu trúc và mục tiêu kỹ năng từ Scope & Sequence. Bài đọc, hội thoại, câu hỏi, ví dụ, audio giọng máy và dự án được biên soạn nguyên bản. Student Book, Workbook, Teacher Book, BBC video, audio, tranh, bài kiểm tra và đáp án Pearson không được sao chép khi chưa có giấy phép.",
      outcomes: buildOutcomes(unit, grade),
      sessions: buildSessions(unit, grade),
      rubric: buildRubric(unit, grade),
      homePlan: buildHomePlan(unit, grade),
      coverage: {
        bigQuestion: unit.title,
        vocabulary: `${unit.words.length} từ học nhanh · ${unit.alignment?.extendedWords?.length || unit.words.length} mục từ theo nhóm`,
        grammar: grammarItems(unit).join(" · "),
        phonics: unit.phonics,
        reading: `2 bài nguyên bản · chuẩn ${spec.reading} từ`,
        listening: `${unit.expert?.listening?.length || 2} Track`,
        speaking: `${spec.speaking} lượt hội thoại`,
        writing: `${spec.writing} từ`,
        project: unit.project,
        assessment: `${unit.expert?.standard?.testItems || 24} câu · đạt ${spec.pass}%`,
      },
    };
  }

  Object.keys(curriculum).forEach((gradeKey) => {
    const grade = Number(gradeKey);
    curriculum[grade].units.forEach((unit, unitIndex) => {
      unit.vipProMax = pack(unit, grade, unitIndex);
    });
  });

  window.MILO_VIP_PRO_MAX = {
    version: VERSION,
    standards,
    get(unit, grade, unitIndex = 0) {
      return unit?.vipProMax || pack(unit, grade, unitIndex);
    },
  };
})();
