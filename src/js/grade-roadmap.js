(function () {
  const MODULES = {
    vipmax: ["👑", "Bản đồ VIP Max", "Chuẩn đầu ra & 12 buổi"],
    sourcebook: ["📕", "Sách nguồn gốc", "Ảnh chuẩn theo từng lớp"],
    warmup: ["🎈", "Khởi động", "Tình huống giao tiếp"],
    vocabulary: ["📚", "Bài 1 · Từ mới", "Nghĩa, âm và ví dụ"],
    phonics: ["🔤", "Bài 2 · Phát âm", "Âm và nhịp câu"],
    language: ["🧠", "Bài 3 · Mẫu câu", "Cách dùng và cấu trúc"],
    listening: ["🎧", "Bài 4 · Nghe", "Nghe ý chính, chi tiết"],
    speaking: ["💬", "Bài 5 · Nói", "Hội thoại với bạn đồng hành"],
    reading: ["📖", "Bài 6 · Đọc", "Đọc hiểu có câu hỏi"],
    writing: ["✍️", "Bài 7 · Viết", "Lập ý và viết đoạn"],
    grammar: ["🚀", "Grammar Levels", "Level 1 đến Level 5"],
    games: ["🎮", "Game Zone", "3 trò chơi ôn tập"],
    project: ["🎨", "Vận dụng", "Dự án và văn hóa"],
    test: ["✅", "Kiểm tra", "24–48 câu đủ kỹ năng"],
  };

  const CORE_ORDER = [
    "vipmax",
    "warmup",
    "vocabulary",
    "phonics",
    "language",
    "listening",
    "speaking",
    "reading",
    "writing",
    "grammar",
    "games",
    "project",
    "test",
  ];
  const GRADE2_ORDER = ["vipmax", "sourcebook", ...CORE_ORDER.slice(1)];
  const GRADE3_ORDER = ["vipmax", "sourcebook", ...CORE_ORDER.slice(1)];
  const flowFor = (order) => order.map((id) => [MODULES[id][0], MODULES[id][1]]);

  window.MILO_LESSON_MODULES = MODULES;
  window.MILO_CANONICAL_LESSON_ORDER = {
    2: GRADE2_ORDER.slice(),
    3: GRADE3_ORDER.slice(),
    4: CORE_ORDER.slice(),
    5: CORE_ORDER.slice(),
  };

  const common = {
    periods: 11,
    nativePeriods: 3,
  };

  window.MILO_GRADE_ROADMAP = {
    2: {
      ...common,
      stage: "Nhà thám hiểm Big Questions",
      benchmark: "Now I Know Level 2 · GSE 27–34 · A1/A2",
      words: "12–16",
      games: 16,
      reading: "25–50 từ · tranh, ý chính và từ khóa",
      writing: "5–20 từ · câu ngắn có mẫu",
      grammar: [
        "Hiện tại đơn",
        "Câu hỏi Do/Does",
        "Hiện tại tiếp diễn",
        "should/shouldn't",
        "Quá khứ đơn mở đầu",
      ],
      order: GRADE2_ORDER.slice(),
      flow: flowFor(GRADE2_ORDER),
      phases: [
        ["🏫", "Unit 1–4", "Trường và thế giới quanh em", "Ngày học, động vật, thời tiết, thành phố", "Bản đồ Big Questions"],
        ["🎉", "Unit 5–8", "Con người khỏe và tự tin", "Lễ kỷ niệm, nghề, thể thao, cơ thể", "Show & Tell 45 giây"],
        ["🌍", "Unit 9–12", "Thời gian và giải quyết vấn đề", "Mùa, khác biệt, câu đố, thiên nhiên", "Dự án ngoài trời"],
      ],
    },
    3: {
      ...common,
      stage: "Kiến trúc sư câu chuyện",
      benchmark: "Now I Know Level 3 · GSE 33–39 · A2/A2+",
      words: "14–20",
      games: 24,
      reading: "60–100 từ · ý chính, trình tự và chi tiết",
      writing: "35–60 từ · mở–thân–kết",
      grammar: [
        "Câu mệnh lệnh",
        "Quá khứ đơn",
        "So sánh hơn/nhất",
        "Cụm số lượng và cách nói giờ",
        "should/must/can",
      ],
      order: GRADE3_ORDER.slice(),
      flow: flowFor(GRADE3_ORDER),
      phases: [
        ["🧭", "Unit 1–4", "Đường đi và quá khứ", "Bản đồ, lịch sử, kỳ nghỉ, truyện kể", "Truyện tranh sáu khung"],
        ["🌱", "Unit 5–8", "Thế giới khoa học", "Môi trường, số, giải trí, không gian", "Bản tin khoa học"],
        ["🏠", "Unit 9–12", "Con người và văn hóa", "Nhà ở, sức khỏe, Nam Cực, lễ hội", "Triển lãm văn hóa"],
      ],
    },
    4: {
      ...common,
      stage: "Nhà nghiên cứu trẻ",
      benchmark: "Now I Know Level 4 · GSE 38–46 · A2+/B1",
      words: "16–24",
      games: 32,
      reading: "120–180 từ · suy luận và bằng chứng",
      writing: "80–120 từ · hai đoạn có lý do",
      grammar: [
        "Tương lai will/going to",
        "So sánh hơn/nhất",
        "must/have to",
        "Quá khứ tiếp diễn",
        "used to và mệnh đề quan hệ",
      ],
      order: CORE_ORDER.slice(),
      flow: flowFor(CORE_ORDER),
      phases: [
        ["🥗", "Unit 1–4", "Sống khỏe và bền vững", "Dinh dưỡng, kiến trúc, động vật, rác", "Infographic có dữ liệu"],
        ["🔬", "Unit 5–8", "Con người và thay đổi", "Nghề, cực đoan, thời trang, giải trí", "Bài nói 90 giây"],
        ["⛵", "Unit 9–12", "Câu chuyện và cộng đồng", "Phiêu lưu, từ thiện, khác biệt, lịch sử", "Bảo tàng Before & Now"],
      ],
    },
    5: {
      ...common,
      stage: "Thủ lĩnh học thuật",
      benchmark: "Now I Know Level 5 · GSE 43–54 · B1/B1+",
      words: "18–28",
      games: 40,
      reading: "180–260 từ · đọc hai nguồn",
      writing: "130–180 từ · lập luận và sửa bài",
      grammar: [
        "Các thì quá khứ",
        "Hiện tại hoàn thành",
        "may/might",
        "Câu điều kiện 0–1",
        "Tường thuật và mệnh đề",
      ],
      order: CORE_ORDER.slice(),
      flow: flowFor(CORE_ORDER),
      phases: [
        ["💡", "Unit 1–4", "Con người giải quyết vấn đề", "Phát minh, lịch sử, di cư, an toàn", "Hồ sơ điều tra"],
        ["🦏", "Unit 5–8", "Văn hóa và sáng tạo", "Động vật, văn học, giao tiếp, thủ công", "Tạp chí học thuật"],
        ["🌪️", "Unit 9–12", "Bằng chứng và hành động", "Thể thao, thời tiết, nấu ăn, học tập", "Capstone có dữ liệu"],
      ],
    },
  };
})();
