(function () {
  const tidy = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, " ")
      .trim();

  const includesAny = (text, terms) => {
    const haystack = ` ${tidy(text).replace(/[^a-z0-9\s]/g, " ")} `;
    return terms.some((term) => {
      const needle = tidy(term).replace(/[^a-z0-9\s]/g, " ").trim();
      return needle && haystack.includes(` ${needle} `);
    });
  };

  let conversationHistory = [];
  let conversationPet = "";
  let lastDifficulty = "";
  let repeatedDifficulty = 0;
  const difficultyCounts = {};
  let diagnosticOwner = "";
  let pendingLearningTurn = null;
  let lastEvaluation = null;

  const diagnosisLabels = {
    translation: "đang cần chuyển đúng ý giữa tiếng Việt và tiếng Anh",
    "translation-open": "đang cần làm rõ câu muốn dịch",
    vocabulary: "đang vướng nghĩa hoặc cách dùng từ",
    word: "đang vướng nghĩa hoặc cách nhớ từ",
    spelling: "đang vướng chính tả",
    listening: "đang vướng nhận diện từ khi nghe",
    speaking: "đang cần ghép ý để nói thành câu",
    conversation: "đang cần phản xạ hội thoại",
    pronunciation: "đang vướng âm hoặc nhịp nói",
    grammar: "đang nhầm cấu trúc ngữ pháp",
    reading: "đang vướng tìm từ khóa và bằng chứng",
    writing: "đang vướng sắp xếp ý hoặc sửa câu",
    test: "đang vướng cách nhận diện yêu cầu bài tập",
    "task-understanding": "đang chưa rõ đề bài yêu cầu gì",
    emotion: "đang thiếu tự tin và cần chia bài thành bước nhỏ",
    unit: "đang cần nắm mục tiêu của Unit",
    greeting: "đang bắt đầu một cuộc trò chuyện",
    start: "đang cần chọn điểm bắt đầu",
    open: "chưa đủ dữ liệu; Milo cần nghe thêm một câu",
  };

  function profile() {
    try {
      return JSON.parse(localStorage.getItem("milo-child-profile-v1") || "null");
    } catch {
      return null;
    }
  }

  function hasActiveAiAccess() {
    return Boolean(localStorage.getItem("milo-commerce-token-v1"));
  }

  function diagnosticKey() {
    return `milo-ai-diagnostic-v58-${profile()?.nickname || "guest"}`;
  }

  function ensureDiagnosticLoaded() {
    const key = diagnosticKey();
    if (diagnosticOwner === key) return;
    diagnosticOwner = key;
    lastDifficulty = "";
    repeatedDifficulty = 0;
    Object.keys(difficultyCounts).forEach((item) => delete difficultyCounts[item]);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      Object.entries(saved?.counts || {}).forEach(([item, count]) => {
        difficultyCounts[item] = Math.max(0, Math.min(200, Number(count || 0)));
      });
      lastDifficulty = String(saved?.lastDifficulty || "");
      repeatedDifficulty = Math.max(
        0,
        Math.min(20, Number(saved?.repeated || 0)),
      );
    } catch {
      // Hồ sơ chẩn đoán hỏng sẽ được tạo lại an toàn.
    }
  }

  function rememberDifficulty(difficulty) {
    ensureDiagnosticLoaded();
    const safe = String(difficulty || "open");
    difficultyCounts[safe] = Number(difficultyCounts[safe] || 0) + 1;
    repeatedDifficulty =
      lastDifficulty === safe ? repeatedDifficulty + 1 : 1;
    lastDifficulty = safe;
    localStorage.setItem(
      diagnosticKey(),
      JSON.stringify({
        counts: difficultyCounts,
        lastDifficulty,
        repeated: repeatedDifficulty,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  function diagnosticProfile() {
    ensureDiagnosticLoaded();
    return {
      counts: { ...difficultyCounts },
      lastDifficulty,
      repeated: repeatedDifficulty,
    };
  }

  function diagnosisFor(difficulty, confidence = 0.5) {
    return {
      category: String(difficulty || "open"),
      label:
        diagnosisLabels[difficulty] ||
        "chưa đủ dữ liệu; Milo cần nghe thêm một câu",
      confidence: Number(confidence || 0),
      repeated: repeatedDifficulty,
      nextStep:
        repeatedDifficulty >= 2
          ? "Milo sẽ đổi cách giải thích và chia nhỏ hơn."
          : "Milo sẽ giải thích rồi hỏi lại một câu ngắn.",
    };
  }

  function findWord(question, gradeData, unit) {
    const normalized = ` ${tidy(question).replace(/[^a-z0-9\s]/g, " ")} `;
    const words = [
      ...(unit?.words || []),
      ...(gradeData?.units || []).flatMap((item) => item.words || []),
    ];
    return words.find(
      (word) =>
        normalized.includes(` ${tidy(word[0])} `) ||
        normalized.includes(` ${tidy(word[1])} `),
    );
  }

  function childOpening(childName, petName, message) {
    const name = childName ? `${childName} ơi, ` : "";
    return `🐾 ${petName}: ${name}${message}`;
  }

  function learningSteps(title, explanation, example, practice) {
    return [
      `🎯 ${title}`,
      `1. ${explanation}`,
      `2. Ví dụ: ${example}`,
      `3. Con thử ngay: ${practice}`,
    ].join("\n");
  }

  const familyVocatives = {
    me: "Mom",
    ma: "Mom",
    bo: "Dad",
    ba: "Dad",
    ong: "Grandpa",
    "ong noi": "Grandpa",
    "ong ngoai": "Grandpa",
    "ba noi": "Grandma",
    "ba ngoai": "Grandma",
    "co giao": "teacher",
    "thay giao": "teacher",
    co: "teacher",
    thay: "teacher",
    ban: "my friend",
    "cac ban": "everyone",
    "moi nguoi": "everyone",
    "anh trai": "my brother",
    "chi gai": "my sister",
    "em trai": "my little brother",
    "em gai": "my little sister",
  };

  function extractTranslationText(question) {
    const text = tidy(question)
      .replace(/[“”"'?!.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (
      !text.includes("tieng anh") &&
      !includesAny(text, ["translate", "dich sang english"])
    ) {
      return "";
    }
    const patterns = [
      /^(.+?)\s+(?:viet|noi|dich)\s+(?:sang\s+|bang\s+)?tieng anh(?:\s+(?:nhu nao|the nao|la gi|ra sao))?$/,
      /^(?:viet|noi|dich)\s+(.+?)\s+(?:sang\s+|bang\s+)?tieng anh(?:\s+(?:nhu nao|the nao|la gi|ra sao))?$/,
      /^tieng anh (?:cua|cho) (.+?)(?:\s+la gi)?$/,
      /^(.+?)\s+(?:sang|trong|bang)\s+tieng anh(?:\s+(?:la gi|noi sao|viet sao))?$/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1]
          .replace(/^(?:cau|cum tu|tu)\s+/, "")
          .replace(/\s+/g, " ")
          .trim();
      }
    }
    return "";
  }

  function vocative(value) {
    return familyVocatives[value] || "";
  }

  function titleWords(value) {
    return String(value || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function translateKnownPhrase(source) {
    const exact = {
      "xin chao": ["Hello.", "Hi."],
      "xin chao moi nguoi": ["Hello, everyone.", "Hi, everyone."],
      "chao moi nguoi": ["Hello, everyone.", "Hi, everyone."],
      "chao buoi sang": ["Good morning.", "Morning!"],
      "chao buoi chieu": ["Good afternoon.", "Afternoon!"],
      "chao buoi toi": ["Good evening.", "Evening!"],
      "chuc ngu ngon": ["Good night.", "Sleep well."],
      "cam on": ["Thank you.", "Thanks."],
      "xin loi": ["I'm sorry.", "Sorry."],
      "tam biet": ["Goodbye.", "Bye."],
      "hen gap lai": ["See you again.", "See you later."],
      "con khoe": ["I am fine.", "I'm doing well."],
      "con khong hieu": ["I don't understand.", "I do not understand."],
      "con can giup do": ["I need help.", "Could you help me?"],
      "hom nay la thu may": ["What day is it today?", "What day is today?"],
      "bay gio la may gio": ["What time is it now?", "What time is it?"],
      "day la gi": ["What is this?", "What is it?"],
      "cai kia la gi": ["What is that?", "What is it over there?"],
      "ban ten la gi": ["What is your name?", "What's your name?"],
      "ban khoe khong": ["How are you?", "Are you well?"],
    };
    if (exact[source]) {
      return {
        source,
        answer: exact[source][0],
        alternative: exact[source][1],
      };
    }

    const patterns = [
      {
        regex: /^(?:xin chao|chao) (.+)$/,
        build: (person) => `Hello, ${person}.`,
        alternative: (person) => `Hi, ${person}.`,
      },
      {
        regex: /^chao buoi sang (.+)$/,
        build: (person) => `Good morning, ${person}.`,
        alternative: (person) => `Morning, ${person}!`,
      },
      {
        regex: /^chao buoi toi (.+)$/,
        build: (person) => `Good evening, ${person}.`,
        alternative: (person) => `Evening, ${person}!`,
      },
      {
        regex: /^chuc ngu ngon (.+)$/,
        build: (person) => `Good night, ${person}.`,
        alternative: (person) => `Sleep well, ${person}.`,
      },
      {
        regex: /^(?:con )?yeu (.+)$/,
        build: (person) => `I love you, ${person}.`,
        alternative: (person) => `I love you so much, ${person}.`,
      },
      {
        regex: /^cam on (.+)$/,
        build: (person) => `Thank you, ${person}.`,
        alternative: (person) => `Thanks, ${person}.`,
      },
      {
        regex: /^xin loi (.+)$/,
        build: (person) => `I'm sorry, ${person}.`,
        alternative: (person) => `Sorry, ${person}.`,
      },
      {
        regex: /^tam biet (.+)$/,
        build: (person) => `Goodbye, ${person}.`,
        alternative: (person) => `Bye, ${person}.`,
      },
    ];
    for (const pattern of patterns) {
      const match = source.match(pattern.regex);
      if (!match?.[1]) continue;
      const person = vocative(match[1]);
      if (!person) continue;
      return {
        source,
        answer: pattern.build(person),
        alternative: pattern.alternative(person),
      };
    }

    const nameMatch = source.match(/^(?:ten con la|con ten la) (.+)$/);
    if (nameMatch?.[1]) {
      const name = titleWords(nameMatch[1]);
      return {
        source,
        answer: `My name is ${name}.`,
        alternative: `I'm ${name}.`,
      };
    }

    const ageMatch = source.match(/^con (\d{1,2}) tuoi$/);
    if (ageMatch?.[1]) {
      return {
        source,
        answer: `I am ${ageMatch[1]} years old.`,
        alternative: `I'm ${ageMatch[1]}.`,
      };
    }
    return null;
  }

  function translationAnswer(question, childName, petName) {
    const source = extractTranslationText(question);
    if (!source) return null;
    const translated = translateKnownPhrase(source);
    if (!translated) {
      return {
        difficulty: "translation-open",
        confidence: 0.25,
        answer:
          childOpening(
            childName,
            petName,
            `Pet hiểu con muốn dịch cả cụm “${source}”, không phải hỏi lại từ của câu trước.`,
          ) +
          "\n🌐 Cụm này cần AI trực tuyến để dịch chính xác theo ngữ cảnh. Pet sẽ không đoán bừa trong chế độ offline.",
      };
    }
    return {
      difficulty: "translation",
      confidence: 1,
      answer:
        childOpening(
          childName,
          petName,
          `Cả cụm “${translated.source}” viết bằng tiếng Anh là: “${translated.answer}”`,
        ) +
        `\n🔊 Cách nói tự nhiên khác: ${translated.alternative}\n💡 Nhớ: khi gọi trực tiếp một người, tiếng Anh đặt dấu phẩy trước tên gọi.\n⚡ Con thử ngay: đọc “${translated.answer}” hai lần nhé.`,
    };
  }

  function isDirectWordQuestion(text, word) {
    if (!word) return false;
    const normalized = tidy(text).replace(/[^a-z0-9\s]/g, " ").trim();
    const english = tidy(word[0]);
    const vietnamese = tidy(word[1]);
    return (
      normalized === english ||
      normalized === vietnamese ||
      includesAny(normalized, [
        `${english} la gi`,
        `${english} nghia la gi`,
        `nghia cua ${english}`,
        `tu ${english}`,
        `${vietnamese} la gi`,
        `what does ${english} mean`,
      ])
    );
  }

  function selfIntroductionAnswer(grade, childName, petName) {
    const models = {
      2: [
        "Hello. My name is Mai.",
        "I am eight years old.",
        "I am a student.",
        "I like drawing.",
        "Nice to meet you!",
      ],
      3: [
        "Hello! My name is Mai and I am nine years old.",
        "I study in Grade 3.",
        "I live with my family in Viet Nam.",
        "My favourite subject is English because it is fun.",
        "In my free time, I like reading and drawing.",
        "Nice to meet you!",
      ],
      4: [
        "Hello! My name is Mai. I am ten years old and I am a Grade 4 student.",
        "I live in Viet Nam with my family.",
        "I am friendly and hard-working.",
        "My favourite subject is English because I enjoy learning new words.",
        "After school, I usually read books and play badminton.",
        "In the future, I want to speak English confidently.",
        "Thank you for listening!",
      ],
      5: [
        "Hello everyone! My name is Mai. I am eleven years old and I am currently in Grade 5.",
        "I live in Viet Nam with my family.",
        "I would describe myself as friendly, curious and responsible.",
        "English is my favourite subject because it helps me communicate with people around the world.",
        "When I have free time, I enjoy reading adventure stories, drawing and playing badminton with my friends.",
        "This year, my goal is to improve my speaking skills and become more confident.",
        "It is lovely to meet you. Thank you for listening!",
      ],
    };
    const model = models[grade] || models[3];
    return {
      difficulty: "writing",
      confidence: 1,
      answer:
        childOpening(
          childName,
          petName,
          `Để viết bài giới thiệu bản thân, con đi theo 5 ý: tên → tuổi/lớp → nơi sống → tính cách/sở thích → mục tiêu.`,
        ) +
        `\n\n✍️ Bài mẫu lớp ${grade}:\n${model.join(" ")}\n\n🧩 Cụm từ thay thế:\n• My name is … / I am … years old.\n• My favourite … is … because …\n• In my free time, I like …\n• My goal is to …\n\n⚡ Con thử ngay: viết 2 câu đầu bằng thông tin của con. Không cần gửi họ tên đầy đủ; con có thể dùng tên gọi ở nhà.`,
    };
  }

  function answerOffline(context) {
    const {
      question,
      grade = 3,
      unit,
      gradeData,
      petName = "Milo",
      childName = profile()?.name || "",
      part = "",
    } = context;
    const text = tidy(question);
    const patternQuestion = unit?.pattern?.[0] || "What do you like?";
    const patternAnswer = unit?.pattern?.[1] || "I like English.";
    const firstWord = unit?.words?.[0] || ["English", "tiếng Anh", "📚"];

    if (!text) {
      return {
        difficulty: "start",
        confidence: 1,
        answer: childOpening(
          childName,
          petName,
          "Con hãy nói điều đang làm con khó nhé. Ví dụ: “Con không nhớ từ”, “Con chưa hiểu ngữ pháp” hoặc “Con nghe không kịp”.",
        ),
      };
    }

    if (
      includesAny(text, [
        "bi bat nat",
        "bi danh",
        "khong an toan",
        "so ai do",
        "nguoi la",
      ])
    ) {
      return {
        difficulty: "safety",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Cảm ơn con đã nói ra. Việc này quan trọng hơn bài học.",
          ) +
          "\n1. Con hãy đến ngay chỗ có bố mẹ, thầy cô hoặc người lớn con tin tưởng.\n2. Nói rõ: “Con đang không an toàn và con cần người lớn giúp ngay.”\n3. Không đi một mình với người làm con sợ. Pet sẽ ở đây chờ con quay lại.",
      };
    }

    const translated = translationAnswer(question, childName, petName);
    if (translated) return translated;

    const word = findWord(question, gradeData, unit);

    if (
      includesAny(text, [
        "con buon",
        "con so",
        "con met",
        "con khoc",
        "con chan",
        "khong muon hoc",
        "con kem",
        "con dot",
      ])
    ) {
      return {
        difficulty: "emotion",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Pet hiểu là con đang mệt hoặc chưa tự tin. Chưa làm được ngay không có nghĩa là con kém.",
          ) +
          `\n1. Hít vào chậm 3 giây, thở ra 3 giây.\n2. Mình chỉ làm một việc nhỏ: đọc “${firstWord[0]}” một lần.\n3. Sau đó con nói cho pet biết: khó nhất là nghe, nhớ từ, nói hay viết?`,
      };
    }

    if (
      includesAny(text, [
        "khong hieu",
        "chua hieu",
        "kho qua",
        "khong biet lam",
        "giup con",
        "giup em",
      ]) &&
      !includesAny(text, [
        "ngu phap",
        "grammar",
        "tu moi",
        "tu vung",
        "vocabulary",
        "nghe",
        "listening",
        "noi",
        "speaking",
        "phat am",
        "doc",
        "reading",
        "viet",
        "writing",
        "kiem tra",
        "test",
      ])
    ) {
      const focus =
        part === "grammar"
          ? "ngữ pháp"
          : part === "listening"
            ? "nghe"
            : part === "speaking"
              ? "nói"
              : part === "reading"
                ? "đọc"
                : part === "writing"
                  ? "viết"
                  : "bài hiện tại";
      return {
        difficulty: focus,
        confidence: 0.95,
        answer:
          childOpening(
            childName,
            petName,
            `Pet hiểu: con đang mắc ở phần ${focus}. Mình chia nhỏ bài nhé.`,
          ) +
          `\n${learningSteps(
            "Làm từng bước",
            `Nhìn câu hỏi trước: “${patternQuestion}”`,
            `${patternQuestion} — ${patternAnswer}`,
            `đọc chậm câu trả lời “${patternAnswer}”, rồi thay một thông tin thật của con`,
          )}`,
      };
    }

    if (
      includesAny(text, [
        "khong nho",
        "quen tu",
        "hoc tu",
        "tu moi",
        "vocabulary",
      ])
    ) {
      const target = word || firstWord;
      return {
        difficulty: "vocabulary",
        confidence: 0.98,
        answer:
          childOpening(
            childName,
            petName,
            `Mình nhớ từ “${target[0]}” bằng hình, âm và câu; không học từ rời nhé.`,
          ) +
          `\n${learningSteps(
            `${target[2] || "🖼️"} ${target[0]} = ${target[1]}`,
            `Nhìn hình và đọc chậm: ${target[0]}.`,
            target[3] || `I can use “${target[0]}” in this Unit.`,
            `nói một câu mới có từ “${target[0]}”`,
          )}`,
      };
    }

    if (
      includesAny(text, [
        "khong nghe",
        "nghe khong kip",
        "listening",
        "nghe tieng anh",
      ])
    ) {
      return {
        difficulty: "listening",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Pet biết con đang nghe chưa kịp. Không cần hiểu từng từ trong lần đầu.",
          ) +
          `\n${learningSteps(
            "Nghe theo 3 lượt",
            "Lượt 1 chỉ tìm chủ đề; lượt 2 nghe từ khóa; lượt 3 dừng sau từng câu và nhắc lại.",
            `${patternQuestion} — ${patternAnswer}`,
            `bấm nghe chậm rồi ghi lại một từ con nghe rõ nhất`,
          )}`,
      };
    }

    if (
      includesAny(text, [
        "khong noi",
        "ngai noi",
        "phat am",
        "doc tu nay",
        "speaking",
        "pronunciation",
      ])
    ) {
      const target = word || firstWord;
      return {
        difficulty: "speaking",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Mình nói chậm và rõ trước, chưa cần nói nhanh.",
          ) +
          `\n${learningSteps(
            `Luyện nói “${target[0]}”`,
            "Nghe một lần, nhìn khẩu hình, tách từ thành nhịp ngắn rồi ghép lại.",
            `${patternQuestion} — ${patternAnswer}`,
            `bấm micro và nói “${target[0]}” hai lần`,
          )}`,
      };
    }

    if (
      includesAny(text, [
        "ngu phap",
        "grammar",
        "cau nay",
        "mau cau",
        "chia dong tu",
      ])
    ) {
      return {
        difficulty: "grammar",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Pet sẽ giải thích ngữ pháp bằng công thức ngắn, ví dụ thật và một câu con tự làm.",
          ) +
          `\n${learningSteps(
            "Mẫu câu của Unit",
            `Câu hỏi: ${patternQuestion}`,
            `Câu trả lời đầy đủ: ${patternAnswer}`,
            `giữ khung câu nhưng đổi một từ để nói đúng về bản thân con`,
          )}`,
      };
    }

    if (
      includesAny(text, [
        "khong doc",
        "bai doc",
        "khong hieu bai doc",
        "doc hieu",
        "reading",
        "dich bai",
        "doan van",
      ])
    ) {
      return {
        difficulty: "reading",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Đọc hiểu không cần dịch hết. Pet giúp con tìm bằng chứng trong bài.",
          ) +
          `\n${learningSteps(
            "Đọc theo 4 bước",
            "Đọc tiêu đề → khoanh từ đã học → đọc câu hỏi → quay lại đúng câu chứa bằng chứng.",
            `Từ khóa của Unit là “${firstWord[0]}” (${firstWord[1]}).`,
            "nói cho pet biết một từ con đã nhận ra trong đoạn",
          )}`,
      };
    }

    if (
      includesAny(text, [
        "gioi thieu ban than",
        "gioi thieu ve ban than",
        "bai van ve ban than",
        "doan van ve ban than",
        "about myself",
        "introduce myself",
        "self introduction",
      ])
    ) {
      return selfIntroductionAnswer(grade, childName, petName);
    }

    if (
      includesAny(text, [
        "khong viet",
        "viet doan",
        "writing",
        "viet cau",
        "khong biet viet",
      ])
    ) {
      return {
        difficulty: "writing",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Mình không bắt đầu từ trang trắng; hãy viết theo khung 3 câu.",
          ) +
          `\n${learningSteps(
            "Lập ý rồi mới viết",
            "Câu 1 giới thiệu chủ đề; câu 2 thêm chi tiết; câu 3 nói cảm nghĩ.",
            `${patternAnswer} I practise every day. I feel happy.`,
            "gửi pet một câu đầu tiên; pet sẽ góp ý chữ hoa, từ mới và dấu câu",
          )}`,
      };
    }

    if (
      includesAny(text, [
        "kiem tra",
        "thi",
        "sai nhieu",
        "so sai",
        "test",
      ])
    ) {
      return {
        difficulty: "test",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            "Sai là tín hiệu để biết phần nào cần luyện, không phải điểm xấu về con.",
          ) +
          "\n1. Làm câu chắc chắn trước.\n2. Gạch từ khóa trong câu hỏi.\n3. Loại hai đáp án sai rõ nhất.\n4. Sau bài, pet sẽ gom câu sai theo từ vựng, ngữ pháp, nghe và đọc để con ôn đúng chỗ.",
      };
    }

    if (isDirectWordQuestion(text, word)) {
      return {
        difficulty: "word",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            `“${word[0]}” nghĩa là “${word[1]}”.`,
          ) +
          `\n🔊 Đọc chậm: ${word[0]}.\n💡 Ví dụ: ${word[3] || `I learn the word “${word[0]}”.`}\n⚡ Con thử đặt một câu khác có “${word[0]}” nhé.`,
      };
    }

    if (includesAny(text, ["hello", "hi ", "xin chao", "chao pet"])) {
      return {
        difficulty: "greeting",
        confidence: 1,
        answer: childOpening(
          childName,
          petName,
          `Hello! Hôm nay mình đang học Unit “${unit?.title || "English Adventure"}”. Con muốn pet giúp nghe, nói, đọc, viết hay ngữ pháp?`,
        ),
      };
    }

    if (includesAny(text, ["hoc gi", "unit", "bai nay"])) {
      return {
        difficulty: "unit",
        confidence: 1,
        answer:
          childOpening(
            childName,
            petName,
            `Unit này học về “${unit?.vi || unit?.title || "tiếng Anh"}”.`,
          ) +
          `\n1. Từ trọng tâm: ${(unit?.words || []).slice(0, 5).map((item) => item[0]).join(", ")}.\n2. Câu hỏi: ${patternQuestion}\n3. Câu trả lời: ${patternAnswer}\n4. Sau đó con luyện nghe, nói, đọc, viết, game và kiểm tra.`,
      };
    }

    return {
      difficulty: "open",
      confidence: 0.45,
      answer:
        childOpening(
          childName,
          petName,
          "Pet chưa tìm thấy ý cụ thể trong học liệu offline, nhưng pet vẫn giúp con chia nhỏ câu hỏi.",
        ) +
        `\n1. Con đang hỏi về từ vựng, ngữ pháp, nghe, nói, đọc hay viết?\n2. Hãy gửi nguyên từ/câu/đề bài làm con khó.\n3. Pet sẽ giải thích, làm một ví dụ rồi cho con thử ngay.\n\n💡 Khi AI trực tuyến được kết nối, pet có thể trả lời thêm các câu hỏi mở ngoài học liệu.`,
    };
  }

  async function ask(context) {
    const offline = answerOffline(context);
    const endpoint = window.MILO_AI_ENDPOINT || "/api/tutor";
    const petName = context.petName || "Milo";
    if (conversationPet !== petName) {
      conversationPet = petName;
      conversationHistory = [];
      pendingLearningTurn = null;
      lastEvaluation = null;
    }

    const finish = (result) => {
      if (result.mode !== "locked") rememberDifficulty(result.difficulty);
      result.diagnosis =
        result.diagnosis ||
        diagnosisFor(result.difficulty, result.confidence);
      result.evaluation = result.evaluation || {
        status: "not_applicable",
        score: null,
        childAnswer: "",
        betterAnswer: "",
        strength: "",
        reason: "",
        retryPrompt: "",
        shouldRetry: false,
      };
      result.next = result.next || { type: "none", question: "" };
      result.speechSegments = Array.isArray(result.speechSegments)
        ? result.speechSegments
        : [];
      lastEvaluation = result.evaluation;
      pendingLearningTurn = result.next?.question
        ? {
            question: String(result.next.question).slice(0, 600),
            lastStatus: String(result.evaluation.status || ""),
            lastScore: Number(result.evaluation.score || 0),
          }
        : null;
      conversationHistory.push(
        { role: "user", content: String(context.question || "").slice(0, 1200) },
        { role: "assistant", content: String(result.answer || "").slice(0, 1200) },
      );
      conversationHistory = conversationHistory.slice(-12);
      window.dispatchEvent(
        new CustomEvent("milo:tutor-mode", {
          detail: {
            mode: result.mode,
            petName,
            difficulty: result.difficulty,
            accessLevel: result.accessLevel || "",
          },
        }),
      );
      if (result.mode !== "locked") {
        window.dispatchEvent(
          new CustomEvent("milo:learning-event", {
            detail: {
              type: "tutor",
              skill: result.difficulty || "general",
              durationMinutes: context.conversationMode === "voice" ? 1 : 0.5,
              assistantMode: context.assistantMode || "general",
              score: Number.isFinite(Number(result.evaluation?.score))
                ? Number(result.evaluation.score)
                : undefined,
              issues:
                result.evaluation?.status && !["correct", "not_applicable"].includes(result.evaluation.status)
                  ? [result.evaluation.reason || result.diagnosis?.label || "Cần luyện lại"]
                  : result.diagnosis?.repeated >= 2 && result.diagnosis?.label
                    ? [result.diagnosis.label]
                    : [],
            },
          }),
        );
      }
      window.dispatchEvent(new CustomEvent("milo:tutor-response", { detail: result }));
      return result;
    };

    if (offline.difficulty === "safety") {
      return finish({ ...offline, mode: "offline" });
    }

    // Trò chuyện offline luôn sẵn sàng, kể cả khi chưa đăng nhập hoặc chưa có AI.
    // Khi có phiên học viên và máy chủ AI hợp lệ, luồng bên dưới tự chuyển online.
    if (!hasActiveAiAccess() || !navigator.onLine) {
      return finish({ ...offline, mode: "offline" });
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 24000);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("milo-commerce-token-v1")
            ? {
                Authorization: `Bearer ${localStorage.getItem("milo-commerce-token-v1")}`,
              }
            : {}),
        },
        body: JSON.stringify({
          question: context.question,
          grade: context.grade,
          unit: context.unit?.title,
          part: context.part,
          petName,
          difficulty: offline.difficulty,
          history: conversationHistory,
          conversationMode: context.conversationMode || "chat",
          assistantMode: context.assistantMode || "general",
          diagnosticProfile: diagnosticProfile(),
          pronunciationAttempt: context.pronunciationAttempt || null,
          learningTurn: pendingLearningTurn,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.status === 401 || response.status === 402) {
        return finish({ ...offline, mode: "offline" });
      }
      if (!response.ok) throw new Error("online tutor unavailable");
      const payload = await response.json();
      if (!payload?.answer) throw new Error("empty tutor answer");
      return finish({
        answer: payload.answer,
        difficulty: payload.difficulty || payload.skill || "open",
        confidence: 1,
        mode: "online",
        accessLevel: payload.accessLevel || "plus",
        evaluation: payload.evaluation,
        next: payload.next,
        speechSegments: payload.speechSegments || [],
        language: payload.language || "mixed",
        skill: payload.skill || payload.difficulty || "open",
      });
    } catch {
      return finish({ ...offline, mode: "offline" });
    }
  }

  function cleanVoiceText(value) {
    return String(value || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
      .replace(/[*_#>`~|]/g, " ")
      .replace(/[🎯✅❌⚠️✨👑✦💡🔊🎤🧭]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectVoiceLanguage(text) {
    const value = String(text || "");
    const vi = /[À-ỹĐđ]/.test(value) || /\b(con|bé|milo|hãy|đúng|sai|câu|từ|nghĩa|thử|lại|giải thích|phát âm)\b/i.test(value);
    const en = /\b(the|a|an|is|are|am|do|does|can|should|what|where|when|how|because|I|you|we|they|this|that)\b/i.test(value);
    return en && !vi ? "en-US" : "vi-VN";
  }

  function segmentVoiceInput(input) {
    if (Array.isArray(input)) {
      return input
        .slice(0, 20)
        .map((item) => ({
          lang: item?.lang === "en-US" ? "en-US" : "vi-VN",
          text: cleanVoiceText(item?.text),
        }))
        .filter((item) => item.text);
    }
    const source = cleanVoiceText(input);
    if (!source) return [];
    const chunks = source
      .split(/(?<=[.!?])\s+|\n+/)
      .map((text) => text.trim())
      .filter(Boolean)
      .slice(0, 20);
    return chunks.map((text) => ({ lang: detectVoiceLanguage(text), text }));
  }

  function chooseVoice(voices, lang) {
    const prefix = lang === "en-US" ? "en" : "vi";
    const preferred = lang === "en-US"
      ? ["Microsoft Ana Online", "Microsoft Jenny Online", "Microsoft Ava Online", "Samantha", "Google US English", "Female"]
      : ["HoaiMy", "Hoài My", "Linh", "Vietnamese Female", "Vietnamese"];
    return preferred
      .map((name) => voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix) && voice.name?.toLowerCase().includes(name.toLowerCase())))
      .find(Boolean)
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang.toLowerCase()))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix))
      || null;
  }

  function speakOne(segment, rate, voices) {
    return new Promise((resolve) => {
      const line = new SpeechSynthesisUtterance(segment.text);
      line.lang = segment.lang;
      line.rate = segment.lang === "en-US" ? Math.min(rate, 0.78) : Math.min(rate, 0.86);
      line.pitch = segment.lang === "en-US" ? 1.08 : 1.04;
      line.volume = 1;
      line.voice = chooseVoice(voices, segment.lang);
      line.onend = () => resolve(true);
      line.onerror = () => resolve(false);
      speechSynthesis.speak(line);
    });
  }

  function speak(text, rate = 0.82) {
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      return Promise.resolve(false);
    }
    const segments = segmentVoiceInput(text);
    if (!segments.length) return Promise.resolve(false);
    speechSynthesis.cancel();
    return new Promise((resolve) => {
      let started = false;
      const run = async () => {
        if (started) return;
        started = true;
        speechSynthesis.removeEventListener("voiceschanged", run);
        const voices = speechSynthesis.getVoices();
        for (const segment of segments) {
          await speakOne(segment, rate, voices);
        }
        resolve(true);
      };
      if (speechSynthesis.getVoices().length) run();
      else {
        speechSynthesis.addEventListener("voiceschanged", run);
        setTimeout(run, 260);
      }
    });
  }

  function resetConversation() {
    const key = diagnosticKey();
    conversationHistory = [];
    conversationPet = "";
    pendingLearningTurn = null;
    lastEvaluation = null;
    lastDifficulty = "";
    repeatedDifficulty = 0;
    Object.keys(difficultyCounts).forEach((key) => delete difficultyCounts[key]);
    localStorage.removeItem(key);
    diagnosticOwner = "";
  }

  window.MILO_TUTOR = {
    ask,
    answerOffline,
    profile,
    hasActiveAiAccess,
    diagnosticProfile,
    resetConversation,
    learningTurn: () => pendingLearningTurn,
    lastEvaluation: () => lastEvaluation,
  };
  window.MILO_PET_VOICE = { speak, segmentVoiceInput };
})();
