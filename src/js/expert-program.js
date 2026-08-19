(function () {
  const curriculum = window.MILO_CURRICULUM;
  if (!curriculum) return;

  const PROGRAM_VERSION = "V60.12.0 · VIP PRO MAX · NOW I KNOW LEVEL 2–5";

  const gradeStandards = {
    2: {
      label: "Now I Know Level 2",
      benchmark: "GSE 27–34 · A1/A2",
      wordBand: [12, 16],
      readingBand: [25, 50],
      writingBand: [5, 15],
      dialogueTurns: 4,
      grammarDepth: 2,
      lessonMinutes: 35,
      testItems: 24,
      methods: ["TPR", "phonics có hệ thống", "picture talk", "retrieval practice"],
    },
    3: {
      label: "Now I Know Level 3",
      benchmark: "GSE 33–39 · A2/A2+",
      wordBand: [14, 20],
      readingBand: [60, 100],
      writingBand: [35, 60],
      dialogueTurns: 6,
      grammarDepth: 3,
      lessonMinutes: 45,
      testItems: 32,
      methods: ["lexical chunks", "guided discovery", "information gap", "spaced review"],
    },
    4: {
      label: "Now I Know Level 4",
      benchmark: "GSE 38–46 · A2+/B1",
      wordBand: [16, 24],
      readingBand: [120, 180],
      writingBand: [80, 120],
      dialogueTurns: 8,
      grammarDepth: 4,
      lessonMinutes: 50,
      testItems: 40,
      methods: ["inference", "note-taking", "story retell", "process writing"],
    },
    5: {
      label: "Now I Know Level 5",
      benchmark: "GSE 43–54 · B1/B1+",
      wordBand: [18, 28],
      readingBand: [180, 260],
      writingBand: [130, 180],
      dialogueTurns: 10,
      grammarDepth: 5,
      lessonMinutes: 55,
      testItems: 48,
      methods: ["two-source reading", "discussion", "evidence-based answer", "project-based learning"],
    },
  };

  const grammarBlueprints = {
    2: [
      {
        title: "I am / You are / This is",
        badge: "FOUNDATION",
        rule: "Dùng am/is/are để giới thiệu người, vật hoặc trạng thái. Mỗi câu cần có chủ ngữ.",
        formula: "I + am · You/We/They + are · He/She/It + is",
        examples: (u) => [`I am ready for ${u.title}.`, `This is ${u.words[0][0]}.`, "You are my friend."],
        question: "Chọn câu đúng.",
        answer: "This is my book.",
        options: ["This is my book.", "This are my book.", "This my book is.", "Is this my book are."],
      },
      {
        title: "a / an · số ít – số nhiều",
        badge: "CORE",
        rule: "Dùng a trước âm phụ âm, an trước âm nguyên âm; thêm -s/-es khi có từ hai đồ vật trở lên.",
        formula: "a + consonant sound · an + vowel sound · number + plural noun",
        examples: (u) => [`a ${u.words[0][0]}`, `an ${vowelWord(u)}`, `two ${pluralize(u.words[1][0])}`],
        question: "Chọn cụm đúng.",
        answer: "an apple",
        options: ["an apple", "a apple", "two apple", "an apples"],
      },
      {
        title: "I have / I like / I can",
        badge: "USE IT",
        rule: "Dùng have để nói em có gì, like để nói sở thích và can để nói khả năng.",
        formula: "I + have/like/can + word",
        examples: (u) => [`I have ${articlePhrase(u.words[0][0])}.`, `I like ${u.words[1][0]}.`, `I can say “${u.words[2][0]}”.`],
        question: "Câu nào nói về khả năng?",
        answer: "I can swim.",
        options: ["I can swim.", "I have swim.", "I am swim.", "I like can swim."],
      },
      {
        title: "What / Who / How old",
        badge: "QUESTIONS",
        rule: "What hỏi thông tin hoặc đồ vật, Who hỏi người, How old hỏi tuổi.",
        formula: "Question word + be + subject?",
        examples: (u) => [u.pattern[0], "Who is she?", "How old are you?"],
        question: "Muốn hỏi tuổi, em dùng câu nào?",
        answer: "How old are you?",
        options: ["How old are you?", "Who old are you?", "What are old you?", "How you are old?"],
      },
      {
        title: "in / on / under · and",
        badge: "CHALLENGE",
        rule: "in, on, under chỉ vị trí; and nối hai từ hoặc hai ý cùng loại.",
        formula: "noun + is + in/on/under + place · idea + and + idea",
        examples: () => ["The pen is on the desk.", "The ball is under the chair.", "I have a book and a ruler."],
        question: "The cat is ___ the box.",
        answer: "in",
        options: ["in", "and", "can", "an"],
      },
    ],
    3: [
      {
        title: "be / have got · sở hữu",
        badge: "FOUNDATION",
        rule: "Dùng be để miêu tả và have got/has got để nói người hoặc vật sở hữu đặc điểm nào.",
        formula: "S + am/is/are · S + have/has got + noun",
        examples: (u) => [`It is ${u.words[0][0]}.`, `I have got ${articlePhrase(u.words[1][0])}.`, "She has got a new bag."],
        question: "She ___ got a new book.",
        answer: "has",
        options: ["has", "have", "is", "are"],
      },
      {
        title: "Hiện tại đơn · Do/Does",
        badge: "ROUTINE",
        rule: "Dùng hiện tại đơn cho thói quen và sự thật. Do đi với I/you/we/they; does đi với he/she/it.",
        formula: "Do/Does + S + V? · S + V/V-s",
        examples: (u) => [`I use ${u.words[0][0]} in this Unit.`, "Does she study every day?", "He practises English after school."],
        question: "___ Nam go to school every day?",
        answer: "Does",
        options: ["Does", "Do", "Is", "Has"],
      },
      {
        title: "There is/are · some/any",
        badge: "QUANTITY",
        rule: "There is dùng với một vật; There are dùng với nhiều vật. some thường dùng trong câu khẳng định, any trong câu hỏi/phủ định.",
        formula: "There is + singular · There are + plural · some/any + noun",
        examples: (u) => [`There is ${articlePhrase(u.words[0][0])}.`, `There are some ${pluralize(u.words[1][0])}.`, "Are there any pencils?"],
        question: "There ___ some books on the desk.",
        answer: "are",
        options: ["are", "is", "has", "does"],
      },
      {
        title: "Hiện tại tiếp diễn",
        badge: "NOW",
        rule: "Dùng am/is/are + V-ing để nói việc đang diễn ra ngay lúc nói.",
        formula: "S + am/is/are + V-ing",
        examples: () => ["I am listening now.", "Milo is asking a question.", "The children are working in pairs."],
        question: "They ___ playing a game now.",
        answer: "are",
        options: ["are", "is", "do", "have"],
      },
      {
        title: "Wh- questions · can/can't",
        badge: "COMMUNICATION",
        rule: "Dùng từ hỏi để lấy thông tin; dùng can/can't để nói khả năng hoặc xin phép.",
        formula: "Wh-word + auxiliary + S + V? · S + can/can't + V",
        examples: (u) => [u.pattern[0], "What can you see?", "I can answer in a complete sentence."],
        question: "Câu nào đúng?",
        answer: "What can you see?",
        options: ["What can you see?", "What you can see?", "Can what you see?", "What can see you are?"],
      },
    ],
    4: [
      {
        title: "Hiện tại đơn + tần suất",
        badge: "FOUNDATION",
        rule: "Trạng từ tần suất đứng trước động từ thường nhưng đứng sau động từ be.",
        formula: "S + always/usually/often/sometimes/never + V",
        examples: (u) => [`I often learn about ${u.title.toLowerCase()}.`, "She is usually on time.", "We never copy an answer."],
        question: "Chọn vị trí đúng của often.",
        answer: "I often read after school.",
        options: ["I often read after school.", "I read often after school always.", "Often I after school read.", "I am often read after school."],
      },
      {
        title: "So sánh hơn / nhất",
        badge: "COMPARE",
        rule: "Dùng -er/more để so sánh hai đối tượng; dùng the -est/most cho một đối tượng nổi bật nhất trong nhóm.",
        formula: "A + be + adjective-er/more adjective + than B",
        examples: () => ["This task is easier than the last one.", "A city is busier than a village.", "This is the most useful idea."],
        question: "A lion is ___ than a cat.",
        answer: "bigger",
        options: ["bigger", "biggest", "more big", "big"],
      },
      {
        title: "Quá khứ đơn",
        badge: "PAST",
        rule: "Dùng was/were và động từ quá khứ để kể việc đã kết thúc. Chú ý dấu hiệu yesterday, last, ago.",
        formula: "S + was/were · S + V-ed/V2",
        examples: (u) => [`Yesterday, we learned about ${u.title.toLowerCase()}.`, "Milo was excited.", "The children completed the mission."],
        question: "Yesterday, we ___ the project.",
        answer: "finished",
        options: ["finished", "finish", "finishing", "will finish"],
      },
      {
        title: "because / so / but / when",
        badge: "CONNECT",
        rule: "because nêu lý do, so nêu kết quả, but tạo tương phản và when nối với thời điểm.",
        formula: "idea + connector + idea",
        examples: () => ["I practise because I want to improve.", "It was rainy, so we stayed inside.", "The task was hard, but I finished it."],
        question: "I wore a coat ___ it was cold.",
        answer: "because",
        options: ["because", "so", "but", "when"],
      },
      {
        title: "should / must / have to",
        badge: "ADVICE",
        rule: "should đưa lời khuyên; must và have to diễn tả quy định hoặc sự cần thiết.",
        formula: "S + should/must/have to + base verb",
        examples: () => ["You should check your work.", "We must follow the safety rule.", "I have to finish my task."],
        question: "Em đưa lời khuyên bằng từ nào?",
        answer: "should",
        options: ["should", "yesterday", "more", "because"],
      },
    ],
    5: [
      {
        title: "Quá khứ ↔ hiện tại",
        badge: "TIME CONTROL",
        rule: "Chọn thì dựa vào mốc thời gian và ý nghĩa: hiện tại cho thói quen/sự thật, quá khứ cho việc đã kết thúc.",
        formula: "now/every day → present · yesterday/last → past",
        examples: (u) => [`Today we study ${u.title.toLowerCase()}.`, `Last week we studied a related topic.`, "I can explain how the two ideas are different."],
        question: "Last Sunday, we ___ the museum.",
        answer: "visited",
        options: ["visited", "visit", "visiting", "will visit"],
      },
      {
        title: "be going to / will",
        badge: "FUTURE",
        rule: "be going to diễn tả kế hoạch đã có; will diễn tả quyết định nhanh, lời hứa hoặc dự đoán.",
        formula: "S + be going to + V · S + will + V",
        examples: () => ["I am going to prepare a poster.", "I will help you.", "I think the project will be useful."],
        question: "I have a plan. I am ___ present it tomorrow.",
        answer: "going to",
        options: ["going to", "will to", "went to", "go to"],
      },
      {
        title: "may / might / should / must",
        badge: "MODALS",
        rule: "may/might nói khả năng; should đưa lời khuyên; must diễn tả yêu cầu mạnh.",
        formula: "modal + base verb",
        examples: () => ["It might rain later.", "We should compare the evidence.", "Students must follow the rule."],
        question: "Câu nào diễn tả khả năng chưa chắc chắn?",
        answer: "It might rain.",
        options: ["It might rain.", "It rained yesterday.", "It must raining.", "It should rained."],
      },
      {
        title: "If 0–1 · mệnh đề quan hệ",
        badge: "COMPLEX SENTENCE",
        rule: "If 0 nói sự thật; If 1 nói khả năng tương lai. who/which/that bổ sung thông tin cho danh từ.",
        formula: "If + present, present/will + V · noun + who/which/that + clause",
        examples: () => ["If water reaches 100°C, it boils.", "If I practise, I will improve.", "A guide is a person who helps visitors."],
        question: "If I study carefully, I ___ the test.",
        answer: "will pass",
        options: ["will pass", "passed yesterday", "will passed", "passing"],
      },
      {
        title: "although / however / therefore",
        badge: "ACADEMIC LINK",
        rule: "although và however tạo tương phản; therefore giới thiệu kết quả hoặc kết luận.",
        formula: "Although + clause, clause · sentence; however/therefore, sentence",
        examples: () => ["Although the task was difficult, we completed it.", "The idea is simple; however, it is useful.", "We found strong evidence; therefore, our answer is clear."],
        question: "The road was busy; ___, we waited.",
        answer: "therefore",
        options: ["therefore", "although", "because of", "who"],
      },
    ],
  };

  const academicExtensions = {
    3: [
      ["work in pairs", "làm việc theo cặp", "👥", "We work in pairs and practise the Unit dialogue.", "Work in pairs to talk about the lesson topic."],
      ["take turns", "lần lượt", "🔁", "We take turns to ask and answer.", "Take turns and use a complete sentence."],
      ["ask a question", "đặt câu hỏi", "❓", "I ask a question about the Unit.", "Ask a clear question before you answer."],
      ["give a complete answer", "trả lời trọn câu", "💬", "I give a complete answer.", "Give a complete answer with one detail."],
    ],
    4: [
      ["describe in detail", "miêu tả chi tiết", "🔎", "Describe the topic in detail.", "I use precise words to describe in detail."],
      ["compare two ideas", "so sánh hai ý", "⚖️", "We compare two ideas from the Unit.", "Compare two ideas and find one difference."],
      ["give a reason", "nêu lý do", "💡", "I give a reason using because.", "Give a reason for your choice."],
      ["find a clue", "tìm manh mối", "🕵️", "I find a clue in the reading text.", "Find a clue that supports your answer."],
      ["make an inference", "suy luận", "🧠", "I make an inference from two details.", "Use the clues to make an inference."],
    ],
    5: [
      ["state an opinion", "nêu quan điểm", "🗣️", "I state an opinion about the Unit topic.", "State an opinion clearly before giving evidence."],
      ["support with evidence", "dùng bằng chứng hỗ trợ", "🧾", "I support my answer with evidence.", "Support your idea with evidence from the text."],
      ["draw a conclusion", "rút ra kết luận", "🎯", "We draw a conclusion after comparing the sources.", "Draw a conclusion from the strongest details."],
      ["advantage", "ưu điểm", "➕", "One advantage is that the idea is practical.", "Explain one advantage of your choice."],
      ["disadvantage", "nhược điểm", "➖", "One disadvantage is the extra time it needs.", "Compare an advantage and a disadvantage."],
      ["from another point of view", "từ một góc nhìn khác", "🔄", "From another point of view, the result may be different.", "Use another point of view in the discussion."],
      ["evaluate", "đánh giá", "📊", "We evaluate the evidence before deciding.", "Evaluate which source is more convincing."],
    ],
  };

  function ensureWordBand(unit, grade) {
    const minimum = gradeStandards[grade].wordBand[0];
    const additions = academicExtensions[grade] || [];
    const seen = new Set(unit.words.map((word) => word[0].toLowerCase()));
    for (const word of additions) {
      if (unit.words.length >= minimum) break;
      if (!seen.has(word[0].toLowerCase())) {
        unit.words.push([...word]);
        seen.add(word[0].toLowerCase());
      }
    }
  }

  function pluralize(word) {
    if (/\s/.test(word)) return word;
    if (/(s|x|ch|sh)$/i.test(word)) return `${word}es`;
    if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
    return `${word}s`;
  }

  function vowelWord(unit) {
    const found = unit.words.find((word) => /^[aeiou]/i.test(word[0]));
    return found ? found[0] : "English word";
  }

  function articlePhrase(word) {
    if (/^(some|my|his|her|their|our)\b/i.test(word)) return word;
    return `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;
  }

  function sentenceList(unit, limit) {
    const seen = new Set();
    const result = [];
    const push = (value) => {
      const clean = String(value || "").trim();
      if (!clean || seen.has(clean.toLowerCase())) return;
      seen.add(clean.toLowerCase());
      result.push(/[.!?]$/.test(clean) ? clean : `${clean}.`);
    };
    push(unit.sample);
    unit.words.slice(0, Math.max(8, limit)).forEach((word) => {
      push(word[3]);
      push(word[4]);
    });
    push(`${unit.pattern[0]} ${unit.pattern[1]}`);
    return result;
  }

  function splitSentences(value) {
    return (
      String(value || "")
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
        ?.map((sentence) => sentence.trim())
        .filter(Boolean) || []
    );
  }

  function buildPassage(candidates, minimum, maximum) {
    const clean = candidates
      .map((sentence) => String(sentence || "").trim())
      .filter(Boolean);
    const parts = [];
    let index = 0;

    while (
      parts.join(" ").split(/\s+/).filter(Boolean).length < minimum &&
      index < clean.length
    ) {
      parts.push(clean[index]);
      index += 1;
    }

    return parts
      .join(" ")
      .trim()
      .split(/\s+/)
      .slice(0, maximum)
      .join(" ");
  }

  function buildReading(unit, grade) {
    const target = gradeStandards[grade].readingBand;

    const original = unit.originalReadings;
    const storySentences = original?.fiction
      ? [
          ...splitSentences(original.fiction),
          `The ending encourages learners to discuss the Big Question and the choices made by the characters.`,
        ]
      : [
          ...splitSentences(unit.sample),
          ...unit.words
            .filter((_, index) => index % 2 === 0)
            .map((word) => word[3]),
          `${unit.pattern[0]} ${unit.pattern[1]}`,
        ];
    const factSentences = original?.factual
      ? [
          ...splitSentences(original.factual),
          `These facts help learners compare evidence and explain the Big Question in their own words.`,
          `The Unit project applies this knowledge to a practical situation.`,
        ]
      : [
          `This fact file explores the Big Question: ${unit.title}`,
          ...unit.words.map((word) => word[4]),
          `Learners compare details and explain an answer about the Big Question.`,
        ];
    const sourceAMin = Math.ceil(target[0] / 2);
    const sourceBMin = target[0] - sourceAMin;
    const sourceAMax = Math.ceil(target[1] / 2);
    const sourceBMax = target[1] - sourceAMax;

    return {
      title: unit.title,
      sourceATitle:
        original?.fictionTitle || "Reading 1 · Fiction & Values",
      sourceBTitle:
        original?.factualTitle || "Reading 2 · Factual & CLIL",
      sourceA: buildPassage(
        storySentences,
        sourceAMin,
        sourceAMax,
      ),
      sourceB: buildPassage(
        factSentences,
        sourceBMin,
        sourceBMax,
      ),
    };
  }

  function buildListening(unit, grade) {
    if (Array.isArray(unit.lessonPack?.listening) && unit.lessonPack.listening.length) {
      return unit.lessonPack.listening.map((track) => ({ ...track }));
    }
    const topicWords = unit.words.slice(0, grade === 2 ? 5 : grade === 3 ? 8 : 10);
    const details = topicWords.map((word) => word[3] || `I can use the word ${word[0]}.`);
    const track1 = [
      `Milo: ${unit.pattern[0]}`,
      `Student: ${unit.pattern[1]}`,
      ...details.slice(0, grade === 2 ? 2 : grade === 3 ? 4 : 5),
    ].join(" ");
    const track2 = [
      `Teacher: Today our mission is ${unit.title}.`,
      ...details.slice(grade === 2 ? 2 : 3),
      grade >= 4 ? `Student: I can explain my answer because I found details in the lesson.` : `Student: I can listen, answer and use a complete sentence.`,
    ].join(" ");
    return [
      { id: "gist", title: "Track A · Main idea", script: track1 },
      { id: "detail", title: "Track B · Detail & note-taking", script: track2 },
    ];
  }

  function buildCollocations(unit, grade) {
    const count = { 2: 4, 3: 6, 4: 8, 5: 10 }[grade];
    const chunks = [];
    unit.words.forEach((word) => {
      const example = word[3] || word[4];
      if (example && chunks.length < count) chunks.push({ word: word[0], chunk: example.replace(/[.!?]$/, "") });
    });
    while (chunks.length < count) {
      const word = unit.words[chunks.length % unit.words.length];
      chunks.push({ word: word[0], chunk: `use ${word[0]} in a complete sentence` });
    }
    return chunks;
  }

  function buildTasks(unit, grade) {
    const word = unit.words[0];
    const second = unit.words[1] || word;
    return [
      { type: "diagnostic", prompt: `Em đã biết gì về “${unit.title}”?`, answer: "" },
      { type: "picture", prompt: `Nhìn hình và chọn “${word[0]}”.`, answer: word[0] },
      { type: "listen-gist", prompt: `Nghe và chọn ý chính của “${unit.title}”.`, answer: unit.vi },
      { type: "listen-detail", prompt: `Nghe và nhận ra “${second[0]}”.`, answer: second[0] },
      { type: "gap", prompt: (word[3] || `I can use ${word[0]}.`).replace(new RegExp(word[0], "i"), "_____"), answer: word[0] },
      { type: "order", prompt: `Sắp xếp câu: ${unit.pattern[1]}`, answer: unit.pattern[1] },
      { type: "pronunciation", prompt: `Thu giọng và luyện lại trọng tâm: ${unit.phonics}`, answer: unit.pattern[1] },
      { type: "speak", prompt: unit.pattern[0], answer: unit.pattern[1] },
      { type: "evidence", prompt: grade >= 4 ? "Tìm một chi tiết trong bài đọc để chứng minh câu trả lời." : "Tìm từ khóa trong bài đọc.", answer: word[0] },
      { type: "write", prompt: unit.writing, answer: "" },
      { type: "project", prompt: unit.project, answer: "" },
      { type: "assessment", prompt: "Làm bài kiểm tra cuối Unit và học lại đúng phần còn sai.", answer: "" },
    ];
  }

  Object.keys(curriculum).forEach((gradeKey) => {
    const grade = Number(gradeKey);
    const standard = gradeStandards[grade];
    const gradeData = curriculum[grade];
    gradeData.expertStandard = standard;
    gradeData.mode = `${standard.label} · ${standard.benchmark}`;
    gradeData.readingTarget = `${standard.readingBand[0]}–${standard.readingBand[1]} từ`;
    gradeData.writingTarget = `${standard.writingBand[0]}–${standard.writingBand[1]} từ`;

    gradeData.units.forEach((unit, unitIndex) => {
      ensureWordBand(unit, grade);
      const reading = buildReading(unit, grade);
      unit.expert = {
        programVersion: PROGRAM_VERSION,
        grade,
        unit: unitIndex + 1,
        standard,
        reference: unit.reference,
        scopeObjectives: unit.alignment?.objectives || {},
        scopeVocabularyGroups: unit.alignment?.vocabularyGroups || [],
        grammarFocus: unit.grammarFocus || [],
        skills: unit.skills || [],
        collocations: unit.expertCollocations || buildCollocations(unit, grade).map((item) => item.chunk),
        grammar: (unit.lessonPack?.grammar || grammarBlueprints[grade]).map((level) => ({
          ...level,
          examples:
            typeof level.examples === "function"
              ? level.examples(unit)
              : [...(level.examples || [])],
        })),
        listening: buildListening(unit, grade),
        reading,
        tasks: buildTasks(unit, grade),
        mastery: {
          vocabulary: 85,
          listening: grade === 2 ? 75 : 80,
          speakingTurns: standard.dialogueTurns,
          readingEvidence: grade >= 4 ? 2 : 1,
          writingMin: standard.writingBand[0],
          pass: grade === 2 ? 75 : 80,
        },
      };
    });
  });

  function grammarLevels(unit, grade) {
    return unit.expert?.grammar || (unit.lessonPack?.grammar || grammarBlueprints[grade]).map((level) => ({
      ...level,
      examples:
        typeof level.examples === "function"
          ? level.examples(unit)
          : [...(level.examples || [])],
    }));
  }

  function readingPassage(unit, grade) {
    const reading = unit.expert?.reading || buildReading(unit, grade);
    return `${reading.sourceATitle}\n${reading.sourceA}\n\n${reading.sourceBTitle}\n${reading.sourceB}`;
  }

  function readingBundle(unit, grade) {
    return unit.expert?.reading || buildReading(unit, grade);
  }

  function listeningTracks(unit, grade) {
    return unit.expert?.listening || buildListening(unit, grade);
  }

  window.MILO_EXPERT_PROGRAM = {
    version: PROGRAM_VERSION,
    gradeStandards,
    grammarLevels,
    readingPassage,
    readingBundle,
    listeningTracks,
  };
})();
