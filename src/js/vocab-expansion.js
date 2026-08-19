(function () {
  const curriculum = window.MILO_CURRICULUM;
  if (!curriculum) return;

  const splitSentences = (value) =>
    String(value || "")
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) || [];

  const level2Extensions = [
    [
      ["violin practice", "luyện đàn violin", "🎻"],
      ["piano practice", "luyện đàn piano", "🎹"],
      ["bored", "buồn chán", "🥱"],
      ["worried", "lo lắng", "😟"],
    ],
    [
      ["angry", "tức giận", "😠"],
      ["smart", "thông minh", "🧠"],
      ["dangerous", "nguy hiểm", "⚠️"],
      ["strong", "khỏe mạnh", "💪"],
    ],
    [
      ["cap", "mũ lưỡi trai", "🧢"],
      ["sneakers", "giày thể thao", "👟"],
      ["flip flops", "dép xỏ ngón", "🩴"],
      ["robe", "áo choàng", "🥋"],
    ],
    [
      ["computer store", "cửa hàng máy tính", "🖥️"],
      ["movie theater", "rạp chiếu phim", "🎬"],
      ["restaurant", "nhà hàng", "🍽️"],
      ["gas station", "trạm xăng", "⛽"],
    ],
    [
      ["bowling alley", "sân bowling", "🎳"],
      ["adventure playground", "khu vui chơi phiêu lưu", "🛝"],
      ["arts center", "trung tâm nghệ thuật", "🎭"],
      ["swimming pool", "bể bơi", "🏊"],
    ],
    [
      ["cook", "nấu ăn", "🍳"],
      ["whistle", "thổi còi", "📣"],
      ["perform", "biểu diễn", "🎭"],
      ["clean", "làm sạch", "🧹"],
    ],
    [
      ["hit", "đánh", "🏓"],
      ["hold", "giữ", "🤲"],
      ["push", "đẩy", "➡️"],
      ["pull", "kéo", "⬅️"],
    ],
    [
      ["dirty", "bẩn", "🦠"],
      ["hurt", "đau", "🤕"],
      ["feel", "cảm thấy", "💗"],
      ["breathe", "hít thở", "🌬️"],
    ],
    [
      ["May", "tháng Năm", "5️⃣"],
      ["June", "tháng Sáu", "6️⃣"],
      ["July", "tháng Bảy", "7️⃣"],
      ["August", "tháng Tám", "8️⃣"],
      ["September", "tháng Chín", "9️⃣"],
      ["October", "tháng Mười", "🔟"],
      ["November", "tháng Mười Một", "🍁"],
      ["December", "tháng Mười Hai", "🎄"],
    ],
    [
      ["blonde", "tóc vàng", "👱"],
      ["straight", "thẳng", "📏"],
      ["wavy", "gợn sóng", "🌊"],
      ["eyebrows", "lông mày", "👀"],
    ],
    [
      ["problem", "vấn đề", "❓"],
      ["hide", "giấu", "🙈"],
      ["lost", "bị lạc", "🧭"],
      ["solve", "giải quyết", "💡"],
    ],
    [
      ["water wings", "phao tay", "🛟"],
      ["air mattress", "đệm hơi", "🏖️"],
      ["hotel", "khách sạn", "🏨"],
      ["sandcastle", "lâu đài cát", "🏰"],
    ],
  ];

  const level2Units = curriculum[2]?.units || [];
  level2Extensions.forEach((additions, unitIndex) => {
    const unit = level2Units[unitIndex];
    if (!unit) return;
    const known = new Set(
      unit.words.map((word) => String(word[0]).toLowerCase()),
    );
    additions.forEach((word) => {
      if (known.has(word[0].toLowerCase())) return;
      unit.words.push([
        ...word,
        `Milo uses “${word[0]}” while exploring ${unit.theme.toLowerCase()}.`,
        `I can use “${word[0]}” to answer this Unit's Big Question.`,
      ]);
      known.add(word[0].toLowerCase());
    });
  });

  Object.values(curriculum).forEach((grade) => {
    grade.units.forEach((unit) => {
      const sampleSentences = splitSentences(unit.sample);

      unit.words.forEach((word) => {
        const term = String(word[0] || "").trim();
        if (!term) return;

        const matchingSentence = sampleSentences.find((sentence) =>
          sentence.toLowerCase().includes(term.toLowerCase()),
        );

        if (!word[3]) {
          word[3] =
            matchingSentence ||
            `The word “${term}” is useful when we talk about ${unit.theme.toLowerCase()}.`;
        }
        if (!word[4]) {
          word[4] = `I can use “${term}” in a complete English sentence.`;
        }
      });
    });
  });
})();
