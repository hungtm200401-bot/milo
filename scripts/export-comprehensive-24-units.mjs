import { readFileSync, writeFileSync } from "node:fs";

// Load data sources
const g2Source = JSON.parse(readFileSync("src/data/GRADE2_VOCABULARY_196_FROM_2_ZIPS.json", "utf8"));
const g3Vocab = JSON.parse(readFileSync("src/data/GRADE3_KEY_VOCABULARY_240.json", "utf8"));

function sanitizeTerm(term) {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function getPhonicsBreakdown(term) {
  const clean = term.toLowerCase().trim();
  const customMap = {
    "math": { syllables: "math", ipa: "/mæθ/", tip: "Âm /m/ khép hai môi, phát âm /æ/ mở rộng miệng và âm /θ/ đặt lưỡi giữa hai hàm răng." },
    "art": { syllables: "art", ipa: "/ɑːrt/", tip: "Âm /ɑː/ ngân dài tròn miệng và cong nhẹ đầu lưỡi cho âm /rt/." },
    "science": { syllables: "sci · ence", ipa: "/ˈsaɪ.əns/", tip: "Gồm 2 âm tiết. Nhấn mạnh vào âm tiết 1 /ˈsaɪ/, kết thúc với âm /ns/ nhẹ nhàng." },
    "p.e.": { syllables: "P · E", ipa: "/ˌpiːˈiː/", tip: "Viết tắt của Physical Education. Đọc rõ từng chữ cái: P - E." },
    "computer science": { syllables: "com · pu · ter · sci · ence", ipa: "/kəmˈpjuː.tər ˈsaɪ.əns/", tip: "Cụm 5 âm tiết. Nhấn mạnh vào /ˈpjuː/ và /ˈsaɪ/." },
    "music": { syllables: "mu · sic", ipa: "/ˈmjuː.zɪk/", tip: "Nhấn mạnh âm đầu /ˈmjuː/, kết thúc âm /zɪk/ dứt khoát." },
    "violin practice": { syllables: "vi · o · lin · prac · tice", ipa: "/ˌvaɪəˈlɪn ˈpræk.tɪs/", tip: "Đọc lướt nhẹ 'vi-o-lin' và nhấn mạnh 'prac-tice'." },
    "piano practice": { syllables: "pi · an · o · prac · tice", ipa: "/piˈæn.oʊ ˈpræk.tɪs/", tip: "Đọc rõ âm /piˈæn.oʊ/ và kết hợp cụm 'practice'." },
    "crocodile": { syllables: "croc · o · dile", ipa: "/ˈkrɒk.ə.daɪl/", tip: "Nhấn âm 1: CROC-o-dile. Bật rõ âm /kr/ ở đầu." },
    "kangaroo": { syllables: "kan · ga · roo", ipa: "/ˌkæŋ.ɡəˈruː/", tip: "Nhấn mạnh âm cuối: kan-ga-ROO với âm /ruː/ ngân dài." },
    "panda": { syllables: "pan · da", ipa: "/ˈpæn.də/", tip: "Nhấn âm 1: PAN-da. Bật nhẹ hơi ở âm /p/." },
    "snake": { syllables: "snake", ipa: "/sneɪk/", tip: "Kéo dài âm /s/, phát âm nguyên âm đôi /eɪ/ và bật âm /k/ ở cuối." },
    "cheetah": { syllables: "chee · tah", ipa: "/ˈtʃiː.tə/", tip: "Âm /tʃ/ bật dứt khoát như 'ch', nhấn mạnh CHEE-tah." },
    "seal": { syllables: "seal", ipa: "/siːl/", tip: "Âm /s/ kéo dài, nguyên âm /iː/ cười tươi và nâng đầu lưỡi cho âm /l/." },
    "camel": { syllables: "cam · el", ipa: "/ˈkæm.əl/", tip: "Nhấn mạnh âm 1: CAM-el." },
    "whale": { syllables: "whale", ipa: "/weɪl/", tip: "Tròn môi âm /w/, nguyên âm đôi /eɪ/ và kết thúc âm /l/." }
  };

  if (customMap[clean]) return customMap[clean];

  const words = clean.split(" ");
  const syllables = words.map(w => {
    if (w.length <= 4) return w;
    return w.replace(/([aeiouy]+)/gi, "$1·").replace(/·$/, "");
  }).join(" ");

  return {
    syllables: syllables || clean,
    ipa: `/${clean}/`,
    tip: `Lắng nghe cô Milo phát âm mẫu và lặp lại rõ từng âm tiết: ${syllables || clean}.`
  };
}

function getAppliedSentences(term, meaning) {
  const clean = term.toLowerCase().trim();
  const map = {
    "math": [
      { en: "I do my math homework with my dad every evening.", vi: "Tôi làm bài tập Toán cùng bố vào mỗi buổi tối." },
      { en: "Math helps us count money and solve fun puzzles.", vi: "Toán học giúp chúng ta tính tiền và giải các câu đố vui." }
    ],
    "art": [
      { en: "We draw colorful flowers and trees in art class.", vi: "Chúng em vẽ hoa và cây cối nhiều màu sắc trong giờ Mỹ thuật." },
      { en: "My little sister loves painting cute animals in art class.", vi: "Em gái tôi rất thích vẽ các con vật dễ thương trong giờ Mỹ thuật." }
    ],
    "science": [
      { en: "We do amazing experiments with water in science class.", vi: "Chúng em làm những thí nghiệm kỳ thú với nước trong giờ Khoa học." },
      { en: "Science helps us understand why the sky is blue.", vi: "Khoa học giúp chúng ta hiểu vì sao bầu trời lại có màu xanh." }
    ],
    "p.e.": [
      { en: "We play football and run around the playground in P.E.", vi: "Chúng em chơi bóng đá và chạy quanh sân trong giờ Thể dục." },
      { en: "P.E. class helps us stay healthy and strong every day.", vi: "Giờ Thể dục giúp chúng em luôn khỏe mạnh và tràn đầy năng lượng mỗi ngày." }
    ],
    "computer science": [
      { en: "We learn how to type fast and create games in computer science.", vi: "Chúng em học cách gõ phím nhanh và tạo trò chơi trong môn Tin học." },
      { en: "Computer science is very useful in our modern world.", vi: "Môn Tin học rất hữu ích trong thế giới hiện đại của chúng ta." }
    ],
    "music": [
      { en: "The whole class sings happy English songs in music class.", vi: "Cả lớp cùng hát những bài hát tiếng Anh vui tươi trong giờ Âm nhạc." },
      { en: "Playing music makes everybody feel cheerful and relaxed.", vi: "Chơi nhạc làm cho mọi người cảm thấy vui vẻ và thư thái." }
    ]
  };

  if (map[clean]) return map[clean];

  return [
    { en: `I always use ${term} when talking about ${meaning}.`, vi: `Tôi luôn dùng từ ${term} khi nói về ${meaning}.` },
    { en: `My teacher asks us to make a sentence with "${term}".`, vi: `Cô giáo yêu cầu chúng tôi đặt một câu với từ "${term}".` }
  ];
}

// Generate rich applied sentences and practice for every Unit
function generateCompleteUnitPedagogy(uSpec, grade) {
  const gVocab = grade === 2 ? g2Source.units.find(u => u.unit === uSpec.unit)?.items || [] : g3Vocab.units[String(uSpec.unit)] || [];
  
  // 6 Rich Practical Application Sentences per Unit
  const grammarAppliedExamples = [
    {
      context: "🏫 Tình huống 1: Tại trường học (At School)",
      en: `I study ${gVocab[0]?.term || 'math'} and ${gVocab[1]?.term || 'science'} on Monday morning.`,
      vi: `Tôi học môn ${gVocab[0]?.meaning || 'Toán'} và ${gVocab[1]?.meaning || 'Khoa học'} vào sáng thứ Hai.`
    },
    {
      context: "🏡 Tình huống 2: Ở nhà cùng gia đình (At Home)",
      en: `After school, I review my lessons and do ${gVocab[2]?.term || 'violin practice'} at 5 PM.`,
      vi: `Sau giờ học, tôi ôn bài và tham gia ${gVocab[2]?.meaning || 'buổi luyện đàn'} lúc 5 giờ chiều.`
    },
    {
      context: "🤝 Tình huống 3: Nói chuyện cùng bạn bè (With Friends)",
      en: `My best friend loves ${gVocab[1]?.term || 'art'} because she draws very beautifully.`,
      vi: `Bạn thân của tôi rất yêu thích ${gVocab[1]?.meaning || 'Mỹ thuật'} vì bạn ấy vẽ rất đẹp.`
    },
    {
      context: "❓ Tình huống 4: Câu hỏi phỏng vấn (Interview Question)",
      en: `Do you have ${gVocab[0]?.term || 'English'} on Tuesday? - Yes, I do!`,
      vi: `Bạn có môn ${gVocab[0]?.meaning || 'Tiếng Anh'} vào thứ Ba không? - Có, mình có!`
    },
    {
      context: "🚫 Tình huống 5: Câu phủ định (Negative Sentence)",
      en: `We do not have ${gVocab[3]?.term || 'P.E.'} on rainy days.`,
      vi: `Chúng tôi không học ${gVocab[3]?.meaning || 'Thể dục'} vào những ngày trời mưa.`
    },
    {
      context: "🌟 Tình huống 6: Chia sẻ sở thích (Expressing Preference)",
      en: `Which subject do you like best? - I love ${gVocab[0]?.term || 'math'} the most!`,
      vi: `Bạn thích môn học nào nhất? - Mình thích môn ${gVocab[0]?.meaning || 'Toán'} nhất!`
    }
  ];

  // 4 Extensive Grammar Exercises per Unit
  const grammarExercises = [
    {
      id: "g_ex1",
      title: "Bài tập 1: Vận dụng điền giới từ / trợ động từ",
      question: `Chọn từ thích hợp: I have ${gVocab[0]?.term || 'math'} class ___ Wednesday morning.`,
      options: ["on", "in", "at"],
      correct: "on",
      explain: "Dùng giới từ 'on' trước các thứ trong tuần (on Wednesday, on Monday...)."
    },
    {
      id: "g_ex2",
      title: "Bài tập 2: Vận dụng sắp xếp trật tự từ thành câu",
      question: `Sắp xếp các từ thành câu hoàn chỉnh: [ on / study / We / Friday / science / . ]`,
      options: [
        "We study science on Friday.",
        "We on Friday study science.",
        "Science study we on Friday."
      ],
      correct: "We study science on Friday.",
      explain: "Cấu trúc câu khẳng định: Chủ ngữ (We) + Động từ (study) + Tân ngữ (science) + Trạng từ thời gian (on Friday)."
    },
    {
      id: "g_ex3",
      title: "Bài tập 3: Vận dụng chia động từ theo chủ ngữ",
      question: `Chọn dạng đúng của động từ: Nam ___ English and art on Thursday.`,
      options: ["studies", "study", "studying"],
      correct: "studies",
      explain: "Chủ ngữ 'Nam' là ngôi thứ ba số ít nên động từ 'study' đổi 'y' thành 'i' rồi thêm 'es' thành 'studies'."
    },
    {
      id: "g_ex4",
      title: "Bài tập 4: Vận dụng xử lý tình huống giao tiếp đời thực",
      question: `Khi bạn hỏi: "What is your favourite subject?", em sẽ trả lời thế nào?`,
      options: [
        `My favourite subject is ${gVocab[0]?.term || 'math'}.`,
        "I am eight years old.",
        "It is sunny today."
      ],
      correct: `My favourite subject is ${gVocab[0]?.term || 'math'}.`,
      explain: `Câu trả lời chuẩn diễn đạt môn học yêu thích: "My favourite subject is ${gVocab[0]?.term || 'math'}."`
    }
  ];

  // 4 Reading Comprehension Checks per Unit
  const readingExercises = [
    {
      id: "r_ex1",
      title: "Câu hỏi đọc hiểu 1: Chi tiết bài học",
      q: `Nhân vật trong bài đọc học môn gì vào buổi sáng?`,
      options: [
        `${gVocab[0]?.meaning || 'Toán'} và ${gVocab[1]?.meaning || 'Khoa học'}`,
        "Chỉ chơi điện tử",
        "Ngủ ở nhà"
      ],
      correct: `${gVocab[0]?.meaning || 'Toán'} và ${gVocab[1]?.meaning || 'Khoa học'}`
    },
    {
      id: "r_ex2",
      title: "Câu hỏi đọc hiểu 2: Cảm xúc nhân vật",
      q: `Sau giờ học, bạn nhỏ cảm thấy thế nào?`,
      options: ["Hào hứng, vui vẻ và tự hào", "Rất buồn bã", "Muốn bỏ học"],
      correct: "Hào hứng, vui vẻ và tự hào"
    },
    {
      id: "r_ex3",
      title: "Câu hỏi Đúng / Sai (True / False)",
      q: `Nhận định: "Học tập chăm chỉ mỗi ngày giúp chúng ta tự tin và thông minh hơn." là Đúng hay Sai?`,
      options: ["Đúng (True)", "Sai (False)"],
      correct: "Đúng (True)"
    },
    {
      id: "r_ex4",
      title: "Câu hỏi vận dụng liên hệ bản thân (Personal Connection)",
      q: `Còn em thì sao? Môn học nào mang lại cho em nhiều niềm vui nhất?`,
      options: [
        `Em thích môn ${gVocab[0]?.meaning || 'Toán'} vì được rèn luyện tư duy.`,
        `Em thích môn ${gVocab[1]?.meaning || 'Mỹ thuật'} vì được vẽ tranh sáng tạo.`,
        "Cả hai môn trên em đều rất yêu thích!"
      ],
      correct: "Cả hai môn trên em đều rất yêu thích!"
    }
  ];

  // 5 Quiz Arena Questions per Unit
  const quiz3D = [
    {
      q: `Từ vựng "${gVocab[0]?.term || 'word'}" có nghĩa tiếng Việt là gì?`,
      options: [gVocab[0]?.meaning || 'nghĩa đúng', 'nghĩa sai 1', 'nghĩa sai 2'],
      correct: gVocab[0]?.meaning || 'nghĩa đúng'
    },
    {
      q: `Từ nào có nghĩa là "${gVocab[1]?.meaning || 'từ 2'}"?`,
      options: [gVocab[1]?.term || 'word2', gVocab[2]?.term || 'word3', 'random_word'],
      correct: gVocab[1]?.term || 'word2'
    },
    {
      q: `Hoàn thành mẫu câu: ${uSpec.pattern[0].slice(0, 14)}...`,
      options: [uSpec.pattern[0], "How old are you?", "What is your name?"],
      correct: uSpec.pattern[0]
    },
    {
      q: `Vận dụng thực tế: Để nói "Tôi học Toán vào thứ Hai", em chọn câu nào?`,
      options: [
        `I study ${gVocab[0]?.term || 'math'} on Monday.`,
        `I study ${gVocab[0]?.term || 'math'} in Monday.`,
        `I study ${gVocab[0]?.term || 'math'} at Monday.`
      ],
      correct: `I study ${gVocab[0]?.term || 'math'} on Monday.`
    },
    {
      q: `Thông điệp ý nghĩa sống của Unit này là gì?`,
      options: [uSpec.value || "Learn and grow", "Do not study", "Forget everything"],
      correct: uSpec.value || "Learn and grow"
    }
  ];

  const dlg = [
    { speaker: "🦊 Milo", en: uSpec.pattern[0], vi: `Milo hỏi: ${uSpec.vi}` },
    { speaker: "👧 Bé", en: uSpec.pattern[1], vi: `Bé trả lời tự tin bằng tiếng Anh!` },
    { speaker: "🦊 Milo", en: "That sounds wonderful! Which subject do you like best?", vi: "Tuyệt quá! Bé thích môn học nào nhất?" },
    { speaker: "👧 Bé", en: `I love learning ${gVocab[0]?.term || 'English'} with Milo!`, vi: `Mình thích học ${gVocab[0]?.meaning || 'tiếng Anh'} cùng Milo!` }
  ];

  return {
    grade,
    unit: uSpec.unit,
    title: uSpec.title,
    vi: uSpec.vi,
    theme: uSpec.theme,
    phonics: uSpec.phonics,
    pattern: uSpec.pattern,
    grammarTitle: uSpec.grammarTitle || `Trọng Tâm Ngữ Pháp & Mẫu Câu Unit ${uSpec.unit}`,
    grammarRule: uSpec.grammarRule || `Nắm vững cấu trúc câu: ${uSpec.pattern[0]} ➔ ${uSpec.pattern[1]}`,
    grammarAppliedExamples: grammarAppliedExamples,
    grammarExercises: grammarExercises,
    readingTitles: uSpec.readingTitles || ["Story Time", "Discovery"],
    sampleReading: uSpec.sampleReading || `Every day, we learn exciting lessons in Unit ${uSpec.unit}. We explore ${gVocab[0]?.term || 'new words'} and ${gVocab[1]?.term || 'interesting topics'}. Teacher Milo guides us with fun activities. Learning English makes us confident and happy!`,
    readingExercises: readingExercises,
    dialogue: dlg,
    tprAction: uSpec.tprAction || "👉 Động tác: Bé đứng thẳng, vỗ tay và làm động tác diễn hoạt theo từng lời thoại cùng bạn Milo.",
    quiz3D: quiz3D,
    writing: uSpec.writing || "Viết 3-4 câu hoàn chỉnh vận dụng từ vựng và mẫu câu đã học trong Unit.",
    writingPrompt: uSpec.writingPrompt || `On school days, I have... In the morning, I study... My favourite subject is...`,
    writingTemplates: [
      `Template 1: On Monday morning, I study ${gVocab[0]?.term || 'math'}.`,
      `Template 2: In the afternoon, I have ${gVocab[1]?.term || 'science'} and ${gVocab[2]?.term || 'art'}.`,
      `Template 3: After school, I do ${gVocab[3]?.term || 'piano practice'} with my friends.`
    ],
    project: uSpec.project || "Thực hành dự án sáng tạo và thuyết trình 45 giây trước lớp.",
    value: uSpec.value || "Learn new things every day · Luôn chăm chỉ và tự tin khám phá tri thức mới",
    totalVocabulary: gVocab.length,
    vocabulary: gVocab.map((item, idx) => {
      const phonics = getPhonicsBreakdown(item.term);
      const appliedSentences = getAppliedSentences(item.term, item.meaning);
      const safeTerm = sanitizeTerm(item.term);
      return {
        order: idx + 1,
        term: item.term,
        ipa: phonics.ipa,
        syllables: phonics.syllables,
        phonicsTip: phonics.tip,
        meaning: item.meaning,
        exampleSentence: appliedSentences[0].en,
        exampleVi: appliedSentences[0].vi,
        appliedSentence2: appliedSentences[1].en,
        appliedVi2: appliedSentences[1].vi,
        flashcard3D: `assets/flashcards/grade${grade}/g${grade}_u${uSpec.unit}_${safeTerm}.svg`
      };
    })
  };
}

const masterCurriculum = JSON.parse(readFileSync("src/data/GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json", "utf8"));

const fullGrade2 = masterCurriculum.grade2.map((u) => {
  return generateCompleteUnitPedagogy(u, 2);
});

const fullGrade3 = masterCurriculum.grade3.map((u) => {
  return generateCompleteUnitPedagogy(u, 3);
});

const masterAll24Complete = {
  title: "CHƯƠNG TRÌNH TOÀN DIỆN 24 UNIT CHUẨN SƯ PHẠM LỚP 2 VÀ LỚP 3 (MILO ENGLISH ADVENTURE)",
  version: "V60.38.0-MASSIVE-APPLIED-SENTENCES-ALL-PARTS",
  author: "Teacher Milo - World-Class Kids English Pedagogical Expert",
  grade2: fullGrade2,
  grade3: fullGrade3
};

writeFileSync(
  "src/data/CHUONG_TRINH_TOAN_DIEN_24_UNIT_LOP_2_VA_LOP_3.json",
  JSON.stringify(masterAll24Complete, null, 2),
  "utf8"
);

writeFileSync(
  "src/data/GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json",
  JSON.stringify(masterAll24Complete, null, 2),
  "utf8"
);

console.log("✅ Đã cập nhật xong 6 câu vận dụng thực tế và ngân hàng bài tập vận dụng cho toàn bộ 24 Unit!");
