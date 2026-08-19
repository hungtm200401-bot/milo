(function () {
  const SOURCE_VERSION = "V60.12.0-GRADE2-SOURCE-2026-08-03";

  const sourceRanges = [
    ["4–19", "anh_tam(1).zip/anh_tam/frame_0014.png–frame_0025.png", "anh_tam(1).zip/anh_tam/frame_0004.png, frame_0006.png–frame_0007.png"],
    ["20–35", "anh_tam(1).zip/anh_tam/frame_0026.png–frame_0037.png", "anh_tam(1).zip/anh_tam/frame_0004.png, frame_0006.png–frame_0007.png"],
    ["36–51", "anh_tam(1).zip/anh_tam/frame_0038.png–frame_0049.png", "anh_tam(1).zip/anh_tam/frame_0004.png, frame_0006.png–frame_0007.png"],
    ["52–67", "anh_tam(1).zip/anh_tam/frame_0050.png–frame_0061.png", "anh_tam(1).zip/anh_tam/frame_0004.png–frame_0007.png"],
    ["68–83", "anh_tam(1).zip/anh_tam/frame_0062.png–frame_0073.png", "anh_tam(1).zip/anh_tam/frame_0004.png–frame_0007.png"],
    ["84–99", "anh_tam(1).zip/anh_tam/frame_0074.png–frame_0085.png", "anh_tam(1).zip/anh_tam/frame_0005.png–frame_0007.png"],
    ["100–115", "anh_tam(1).zip/anh_tam/frame_0086.png–frame_0097.png", "anh_tam(1).zip/anh_tam/frame_0008.png–frame_0013.png"],
    ["116–131", "anh_tam(2).zip/anh_tam/018.png–029.png", "anh_tam(1).zip/anh_tam/frame_0008.png–frame_0013.png"],
    ["132–147", "anh_tam(2).zip/anh_tam/030.png–041.png", "anh_tam(1).zip/anh_tam/frame_0008.png–frame_0013.png"],
    ["148–163", "anh_tam(2).zip/anh_tam/042.png–053.png", "anh_tam(1).zip/anh_tam/frame_0008.png–frame_0013.png"],
    ["164–179", "anh_tam(2).zip/anh_tam/054.png–065.png", "anh_tam(1).zip/anh_tam/frame_0008.png–frame_0013.png"],
    ["180–195", "anh_tam(2).zip/anh_tam/066.png–078.png", "anh_tam(1).zip/anh_tam/frame_0008.png–frame_0013.png"],
  ];

  const wordList = (groups) =>
    groups
      .flatMap((group) =>
        group.items.map(([word, meaning, icon, example]) =>
          [
            word,
            meaning,
            icon,
            example || group.example.replaceAll("{word}", word),
            `Listen and say: ${word}.`,
          ].join("|"),
        ),
      )
      .join(";");

  const grammarCard = ([title, formula, question, answer, options, rule, examples], index) => ({
    title,
    badge: ["SOURCE 1", "SOURCE 2", "PRACTICE"][index] || "MASTERY",
    rule,
    formula,
    examples,
    question,
    answer,
    options,
  });

  function makeUnit(spec, index) {
    const [sourcePages, selectedScreenshots, tocScreenshots] = sourceRanges[index];
    const [question, model] = spec.pattern;
    const grammar = spec.grammarChecks.map(grammarCard);
    grammar.push(
      {
        title: "Dùng mẫu câu của Unit",
        badge: "USE IT",
        rule: "Đọc câu hỏi, giữ đúng trật tự từ rồi trả lời bằng một câu đầy đủ.",
        formula: `${question} → ${model}`,
        examples: [question, model],
        question: "Chọn câu mẫu đúng của Unit.",
        answer: model,
        options: [model, "Words without a complete sentence.", "Is answer not complete.", "No verb this sentence."],
      },
      {
        title: "Kiểm tra cuối phần ngữ pháp",
        badge: "MASTERY",
        rule: "Câu tiếng Anh cần đúng chủ ngữ, động từ và dấu câu.",
        formula: "subject + verb + detail",
        examples: [model, spec.sample.split(/(?<=[.!?])\s+/)[0]],
        question: "Câu nào đầy đủ và đúng trật tự?",
        answer: model,
        options: [model, "Not complete words.", "The answer are wrong.", "Question no verb."],
      },
    );

    const sourceEvidence = {
      sourceBook: "Now I Know! 2 – Student Book",
      printedPages: sourcePages,
      selectedScreenshots,
      tocScreenshots,
      verified: [
        "Big Question và thứ tự Unit",
        "Hai nhóm từ vựng trọng tâm",
        "Hai trọng tâm ngữ pháp",
        "Tiêu đề hai bài đọc",
        "Chiến lược đọc, nói, viết, Value và Project",
      ],
      unverified: [
        "CHƯA XÁC MINH: tệp âm thanh gốc của sách không có trong hai ZIP",
        "CHƯA XÁC MINH: không nhập đáp án sách ở phần ảnh mờ, che hoặc thiếu",
      ],
    };

    return {
      ...spec,
      words: wordList(spec.vocabularyGroups),
      vocabularyGroups: spec.vocabularyGroups.map(({ label, items }) => ({
        label,
        terms: items.map((item) => item[0]),
      })),
      sourceEvidence,
      lessonPack: {
        sourceLabel: `Now I Know! Level 2 · Unit ${index + 1}`,
        sourcePages,
        sourceEvidence,
        coverage: [
          { icon: "🧭", title: "Big Question", goal: spec.vi },
          { icon: "📚", title: "Từ mới 1", goal: "8 từ trọng tâm" },
          { icon: "📖", title: `Đọc 1 · ${spec.readingTitles[0]}`, goal: spec.skills[0] },
          { icon: "🔑", title: "Ngữ pháp 1", goal: spec.grammarFocus[0] },
          { icon: "✨", title: "Từ mới 2", goal: `${spec.vocabularyGroups[1].items.length} từ trọng tâm` },
          { icon: "🔎", title: `Đọc 2 · ${spec.readingTitles[1]}`, goal: "Đọc tìm ý và bằng chứng" },
          { icon: "💬", title: "Ngữ pháp 2", goal: spec.grammarFocus[1] },
          { icon: "🎨", title: "Viết & Dự án", goal: spec.project },
        ],
        listening: [
          {
            id: "milo-gist",
            title: "Milo A · Nghe ý chính",
            script: `${question} ${model}`,
            sourceType: "milo-authored-speech-synthesis",
            bookAudioVerified: false,
          },
          {
            id: "milo-detail",
            title: "Milo B · Nghe chi tiết",
            script: spec.sample,
            sourceType: "milo-authored-speech-synthesis",
            bookAudioVerified: false,
          },
        ],
        grammar,
      },
    };
  }

  const units = [
    {
      title: "What do we do on school days?",
      vi: "Chúng ta làm gì vào những ngày đi học?",
      theme: "Trường học",
      icon: "🏫",
      phonics: "Âm /m/ trong math · /s/ trong science",
      pattern: ["What do you do on school days?", "I study and practise music on school days."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "I have {word} today.",
          items: [
            ["math", "môn Toán", "➗"], ["art", "môn Mỹ thuật", "🎨"],
            ["science", "môn Khoa học", "🔬"], ["P.E.", "môn Thể dục", "🏃"],
            ["computer science", "môn Tin học", "💻"], ["music", "môn Âm nhạc", "🎵"],
            ["violin practice", "buổi luyện vĩ cầm", "🎻"], ["piano practice", "buổi luyện piano", "🎹"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "Today we use the word {word}.",
          items: [
            ["tired", "mệt", "😴", "I feel tired after school."], ["bored", "chán", "🥱", "I feel bored."],
            ["worried", "lo lắng", "😟", "I am worried about the test."], ["difficult", "khó", "🧗", "Math is difficult."],
            ["easy", "dễ", "🟢", "This task is easy."], ["interesting", "thú vị", "💡", "Science is interesting."],
            ["busy", "bận rộn", "⏱️", "Monday is busy."], ["important", "quan trọng", "⭐", "Learning is important."],
          ],
        },
      ],
      grammarFocus: ["Hiện tại đơn khẳng định và phủ định", "Câu hỏi hiện tại đơn; on/in chỉ thời gian"],
      grammarChecks: [
        ["Hiện tại đơn", "S + V/V-s · S + do/does not + V", "She ___ music on Monday.", "studies", ["studies", "study", "studying", "is study"], "Dùng hiện tại đơn cho lịch học và thói quen.", ["I study math.", "She studies music."]],
        ["Do / Does", "Do/Does + S + V?", "___ he have P.E. today?", "Does", ["Does", "Do", "Is", "Has"], "Does đi với he, she, it; động từ sau does giữ nguyên mẫu.", ["Do you have art?", "Does she have science?"]],
        ["on / in", "on + day · in + part of day", "We have art ___ Monday.", "on", ["on", "in", "at", "to"], "Dùng on với ngày và in với buổi trong ngày.", ["on Monday", "in the morning"]],
      ],
      skills: ["Dùng tranh để đoán nội dung", "Giữ tay xa mặt khi nói", "Dùng in the morning, after và on"],
      readingTitles: ["Billy the Dragon", "After School"],
      value: "Learn new things · Học điều mới",
      sample: "An has math, science and music on Monday. Science is interesting, but math is difficult. After school, An has violin practice. It is a busy day, so An feels tired.",
      writing: "Viết câu ngắn về một ngày đi học, dùng in the morning, after hoặc on.",
      project: "Làm lịch My Week và giới thiệu một ngày của em.",
    },
    {
      title: "Where do wild animals live?",
      vi: "Động vật hoang dã sống ở đâu?",
      theme: "Động vật hoang dã",
      icon: "🐼",
      phonics: "Âm /k/ trong crocodile · /w/ trong whale",
      pattern: ["Where does a crocodile live?", "It lives near rivers."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "I can see a {word}.",
          items: [
            ["crocodile", "cá sấu", "🐊"], ["kangaroo", "chuột túi", "🦘"],
            ["panda", "gấu trúc", "🐼"], ["snake", "rắn", "🐍"],
            ["cheetah", "báo săn", "🐆"], ["seal", "hải cẩu", "🦭"],
            ["camel", "lạc đà", "🐪"], ["whale", "cá voi", "🐋"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "The animal is {word}.",
          items: [
            ["angry", "tức giận", "😠"], ["smart", "thông minh", "🧠"],
            ["fat", "béo, mập", "🦛"], ["thin", "gầy, mảnh", "🦎"],
            ["funny", "ngộ nghĩnh", "😄"], ["lazy", "lười biếng", "😴"],
            ["dangerous", "nguy hiểm", "⚠️"], ["strong", "khỏe, mạnh", "💪"],
          ],
        },
      ],
      grammarFocus: ["Tính từ sở hữu its, our, your, their", "How + tính từ; How many; and"],
      grammarChecks: [
        ["its / our / your / their", "possessive adjective + noun", "The whale is big. ___ body is strong.", "Its", ["Its", "Our", "Your", "Their"], "Dùng tính từ sở hữu trước danh từ.", ["Its body is big.", "Their tails are long."]],
        ["How + tính từ", "How + adjective + be + subject?", "___ dangerous is it?", "How", ["How", "Where", "What", "Who"], "Dùng How với tính từ để hỏi mức độ.", ["How big is it?", "How strong is it?"]],
        ["How many · and", "How many + plural noun · adjective + and + adjective", "The cheetah is thin ___ strong.", "and", ["and", "but", "or", "because"], "How many hỏi số lượng; and nối hai đặc điểm.", ["How many legs does it have?", "It is smart and strong."]],
      ],
      skills: ["Dùng điều đã biết để hiểu bài", "Không khoanh tay khi nói", "Dùng từ miêu tả làm bài viết rõ hơn"],
      readingTitles: ["Max and Mandy's Adventure", "In the Wild"],
      value: "Go exploring · Khám phá có trách nhiệm",
      sample: "Milo sees a crocodile near a river and a cheetah on the grass. The crocodile is strong and dangerous. The cheetah is thin and fast. Each animal needs a safe habitat.",
      writing: "Viết câu miêu tả nơi sống và đặc điểm của một con vật.",
      project: "Làm thẻ động vật và thuyết trình ngắn.",
    },
    {
      title: "How does the weather change?",
      vi: "Thời tiết thay đổi như thế nào?",
      theme: "Thời tiết",
      icon: "⛈️",
      phonics: "Âm /w/ trong windy · cụm /st/ trong storm",
      pattern: ["What's the weather like?", "It's windy, and I am wearing a scarf."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "The weather is {word}.",
          items: [
            ["windy", "có gió", "💨"], ["foggy", "có sương mù", "🌫️"],
            ["thunder", "sấm", "⚡", "I can hear thunder."], ["lightning", "chớp", "🌩️", "I can see lightning."],
            ["storm", "cơn bão", "⛈️", "A storm is coming."], ["hail", "mưa đá", "🧊", "Hail is falling."],
            ["sleet", "mưa tuyết", "🌨️", "Sleet is falling."], ["tornado", "lốc xoáy", "🌪️", "The tornado is dangerous."],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "I am wearing {word}.",
          items: [
            ["scarf", "khăn quàng", "🧣"], ["cap", "mũ lưỡi trai", "🧢"],
            ["sunglasses", "kính râm", "🕶️"], ["sweat suit", "bộ đồ thể thao", "🥋"],
            ["sneakers", "giày thể thao", "👟"], ["flip flops", "dép xỏ ngón", "🩴"],
            ["robe", "áo choàng", "🥼"], ["slippers", "dép đi trong nhà", "🥿"],
          ],
        },
      ],
      grammarFocus: ["What's the weather like?; It's…; too + tính từ", "Hiện tại tiếp diễn; love/hate + V-ing"],
      grammarChecks: [
        ["Thời tiết", "What's the weather like? · It's + adjective", "What's the weather like?", "It's windy.", ["It's windy.", "It windy.", "Windy it is are.", "It has windy."], "Dùng It's + tính từ để nói thời tiết.", ["It's foggy.", "It's windy."]],
        ["too + tính từ", "too + adjective", "The coat is ___ warm.", "too", ["too", "to", "two", "very is"], "too đứng trước tính từ để nói quá mức.", ["It's too cold.", "The scarf is too warm."]],
        ["Hiện tại tiếp diễn", "S + am/is/are + V-ing", "She ___ wearing a cap.", "is", ["is", "are", "do", "has"], "Dùng am/is/are + V-ing cho việc đang diễn ra.", ["I am wearing boots.", "She is wearing a scarf."]],
      ],
      skills: ["Nêu điều muốn biết trước khi đọc", "Nhìn người đang nói", "Đặt từ chỉ màu trước từ chỉ quần áo"],
      readingTitles: ["Water Cycle", "Our Favourite Weather"],
      value: "Wear the right clothes · Mặc đồ phù hợp",
      sample: "The morning is foggy and cold. Lan is wearing a scarf and sneakers. At noon, there is thunder and lightning. The children are staying inside until the storm ends.",
      writing: "Viết câu về thời tiết và quần áo; đặt màu trước tên quần áo.",
      project: "Làm bảng My Weekend Clothes hoặc bưu thiếp thời tiết.",
    },
    {
      title: "What can you find in big cities?",
      vi: "Em có thể tìm thấy gì ở thành phố lớn?",
      theme: "Thành phố",
      icon: "🏙️",
      phonics: "Âm /b/ trong bank · /tr/ trong traffic",
      pattern: ["Where is the library?", "It is across from the bank."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "There is a {word} in the city.",
          items: [
            ["bookstore", "hiệu sách", "📚"], ["library", "thư viện", "🏛️"],
            ["playground", "sân chơi", "🛝"], ["toy store", "cửa hàng đồ chơi", "🧸"],
            ["bank", "ngân hàng", "🏦"], ["computer store", "cửa hàng máy tính", "🖥️"],
            ["movie theater", "rạp chiếu phim", "🎬"], ["restaurant", "nhà hàng", "🍽️"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "We can find a {word} near the city.",
          items: [
            ["factory", "nhà máy", "🏭"], ["train station", "nhà ga", "🚉"],
            ["gas station", "trạm xăng", "⛽"], ["street", "đường phố", "🛣️"],
            ["traffic", "giao thông", "🚦", "There is a lot of traffic."], ["small town", "thị trấn nhỏ", "🏘️"],
            ["fields", "cánh đồng", "🌾", "There are fields near the town."], ["market", "chợ", "🧺"],
          ],
        },
      ],
      grammarFocus: ["Hiện tại tiếp diễn khẳng định và phủ định", "behind, in front of, between, across from; câu hỏi tiếp diễn"],
      grammarChecks: [
        ["Đang diễn ra", "S + am/is/are (not) + V-ing", "They ___ walking to the library.", "are", ["are", "is", "do", "has"], "Dùng hiện tại tiếp diễn cho hành động đang xảy ra.", ["He is shopping.", "They are not running."]],
        ["Vị trí", "behind · in front of · between · across from", "The bank is ___ from the library.", "across", ["across", "between", "behind", "inside"], "Dùng giới từ để chỉ vị trí giữa các địa điểm.", ["The bank is across from the library.", "The shop is between two banks."]],
        ["Câu hỏi tiếp diễn", "Is/Are + S + V-ing?", "___ they waiting at the station?", "Are", ["Are", "Is", "Do", "Does"], "Đưa am/is/are lên trước chủ ngữ để hỏi.", ["Is she shopping?", "Are they waiting?"]],
      ],
      skills: ["Tìm từ đã biết để hiểu bài", "Mỉm cười khi giao tiếp", "Dùng There is/There are mô tả thành phố"],
      readingTitles: ["Open and Closed", "Where I Live"],
      value: "Be polite · Cư xử lịch sự",
      sample: "Milo is visiting a city. The library is across from the bank. The restaurant is between a bookstore and a computer store. Cars are moving slowly because there is traffic.",
      writing: "Viết câu mô tả thành phố bằng There is hoặc There are.",
      project: "Làm quảng cáo nơi yêu thích hoặc mô hình city/small town.",
    },
    {
      title: "How do we celebrate?",
      vi: "Chúng ta tổ chức lễ kỷ niệm như thế nào?",
      theme: "Lễ kỷ niệm",
      icon: "🎂",
      phonics: "Âm /b/ trong balloon · /k/ trong cupcake",
      pattern: ["Would you like some fruit salad?", "Yes, please. Thank you."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "There is a {word} at the party.",
          items: [
            ["balloon", "bóng bay", "🎈"], ["card", "thiệp", "💌"],
            ["candle", "nến", "🕯️"], ["burger", "bánh burger", "🍔"],
            ["cupcake", "bánh nhỏ", "🧁"], ["milkshake", "sữa lắc", "🥤"],
            ["popcorn", "bỏng ngô", "🍿", "There is some popcorn."], ["fruit salad", "sa lát trái cây", "🥗", "There is some fruit salad."],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "We can celebrate at the {word}.",
          items: [
            ["ice rink", "sân trượt băng", "⛸️"], ["bowling alley", "sân bowling", "🎳"],
            ["aquarium", "thủy cung", "🐠"], ["theme park", "công viên chủ đề", "🎡"],
            ["adventure playground", "sân chơi phiêu lưu", "🛝"], ["arts center", "trung tâm nghệ thuật", "🎨"],
            ["swimming pool", "bể bơi", "🏊"], ["nature center", "trung tâm thiên nhiên", "🌿"],
          ],
        },
      ],
      grammarFocus: ["some và any", "Would you like…?; Can I have some… please?"],
      grammarChecks: [
        ["some / any", "some + affirmative · any + question/negative", "We have ___ cupcakes.", "some", ["some", "any", "a", "an"], "some thường dùng trong câu khẳng định; any thường dùng trong câu hỏi và phủ định.", ["We have some popcorn.", "We don't have any burgers."]],
        ["Would you like…?", "Would you like + some noun/to + verb?", "___ you like some fruit salad?", "Would", ["Would", "Do is", "Are", "Has"], "Dùng Would you like để mời lịch sự.", ["Would you like some popcorn?", "No, thanks."]],
        ["Can I have…?", "Can I have some + noun + please?", "Can I have some milkshake, ___?", "please", ["please", "too", "any", "would"], "Dùng please khi xin đồ ăn hoặc đồ uống.", ["Can I have some fruit salad, please?", "Here you go!"]],
      ],
      skills: ["Tìm ý chính của câu chuyện", "Giữ lưng thẳng khi nói", "Dùng too để thêm ý"],
      readingTitles: ["Surprise!", "Amazing Parties"],
      value: "Be good to friends · Đối xử tốt với bạn",
      sample: "Mai prepares a party with balloons and cards. There are some cupcakes and some fruit salad, but there isn't any popcorn. Her friends arrive and celebrate together.",
      writing: "Viết lời mời hoặc câu về bữa tiệc; dùng too để thêm ý.",
      project: "Làm thực đơn sinh nhật hoặc thiệp mời.",
    },
    {
      title: "What jobs can I do?",
      vi: "Em có thể làm nghề gì?",
      theme: "Nghề nghiệp",
      icon: "👩‍🚀",
      phonics: "Âm /d/ trong doctor · /f/ trong photographer",
      pattern: ["What do you want to be?", "I want to be a vet because I love helping animals."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "I want to be a {word}.",
          items: [
            ["police officer", "cảnh sát", "👮"], ["chef", "đầu bếp", "🧑‍🍳"],
            ["dentist", "nha sĩ", "🦷"], ["vet", "bác sĩ thú y", "🐾"],
            ["astronaut", "phi hành gia", "🧑‍🚀"], ["doctor", "bác sĩ", "🩺"],
            ["hairdresser", "thợ làm tóc", "💇"], ["photographer", "nhiếp ảnh gia", "📷"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "I can {word} at work.",
          items: [
            ["check", "kiểm tra", "✅"], ["help", "giúp đỡ", "🤝"],
            ["fix", "sửa chữa", "🔧"], ["cook", "nấu ăn", "🍳"],
            ["whistle", "huýt sáo", "🎵"], ["perform", "biểu diễn", "🎭"],
            ["clean", "làm sạch", "🧹"], ["study", "học tập", "📖"],
          ],
        },
      ],
      grammarFocus: ["want/don't want to be; Do you want to be…?", "love/like/don't like/hate + V-ing"],
      grammarChecks: [
        ["want to be", "S + want(s)/don't want + to be + job", "I want ___ be a doctor.", "to", ["to", "for", "at", "is"], "Dùng want to be để nói nghề mong muốn.", ["I want to be a vet.", "I don't want to be a chef."]],
        ["Câu hỏi nghề nghiệp", "Do/Does + S + want to be + job?", "___ you want to be a photographer?", "Do", ["Do", "Does", "Are", "Is"], "Dùng Do với I/you/we/they và Does với he/she/it.", ["Do you want to be a doctor?", "Yes, I do."]],
        ["love / like / hate + V-ing", "S + love/like/hate + V-ing", "She loves ___ animals.", "helping", ["helping", "help", "helps", "to helped"], "Sau love, like hoặc hate dùng động từ thêm -ing.", ["I love cooking.", "He likes helping people."]],
      ],
      skills: ["Dùng thông tin chính để dự đoán", "Thể hiện sự quan tâm khi nói", "Dùng like/love để nhấn mạnh điều quan trọng"],
      readingTitles: ["Sam's Job", "How Can I Be an Astronaut?"],
      value: "Do things for others · Làm điều có ích cho người khác",
      sample: "Nam wants to be a vet because he loves helping animals. His sister wants to be an astronaut. She likes studying science. They practise useful skills every day.",
      writing: "Viết câu về nghề em muốn làm và việc em thích làm.",
      project: "Làm thẻ nghề nghiệp và trình bày nghề em chọn.",
    },
    {
      title: "Why do we play sports?",
      vi: "Tại sao chúng ta chơi thể thao?",
      theme: "Thể thao",
      icon: "🏅",
      phonics: "Âm /b/ trong badminton · /p/ trong ping-pong",
      pattern: ["Are you good at badminton?", "Yes, I am, and I can hit the shuttlecock."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "I can play {word}.",
          items: [
            ["badminton", "cầu lông", "🏸"], ["baseball", "bóng chày", "⚾"],
            ["field hockey", "khúc côn cầu sân cỏ", "🏑"], ["horseback riding", "cưỡi ngựa", "🏇", "I can go horseback riding."],
            ["ping-pong", "bóng bàn", "🏓"], ["water polo", "bóng nước", "🤽"],
            ["skiing", "trượt tuyết", "🎿", "I can go skiing."], ["paddleboarding", "chèo ván", "🏄", "I can go paddleboarding."],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "I can {word} the ball.",
          items: [
            ["bounce", "làm nảy", "🏀"], ["catch", "bắt", "👐"],
            ["hit", "đánh", "🏓"], ["kick", "đá", "🦶"],
            ["throw", "ném", "🤾"], ["hold", "giữ", "✋"],
            ["push", "đẩy", "➡️"], ["pull", "kéo", "⬅️"],
          ],
        },
      ],
      grammarFocus: ["I'm good/not good at…; câu mệnh lệnh", "can/can't để nói khả năng, xin phép hoặc cấm"],
      grammarChecks: [
        ["good at", "S + be + good/not good at + noun/V-ing", "I am good ___ badminton.", "at", ["at", "in", "on", "to"], "Dùng good at để nói làm tốt một hoạt động.", ["I am good at skiing.", "I am not good at baseball."]],
        ["Mệnh lệnh", "base verb + detail", "___ the ball to your friend.", "Throw", ["Throw", "Throws", "Throwing", "To threw"], "Dùng động từ nguyên mẫu ở đầu câu mệnh lệnh.", ["Catch the ball.", "Hold the bat."]],
        ["can / can't", "S + can/can't + base verb", "She can ___ the ball.", "catch", ["catch", "catches", "caught", "catching"], "Sau can/can't dùng động từ nguyên mẫu.", ["I can swim.", "You can't push a player."]],
      ],
      skills: ["Dùng tiêu đề để hiểu bài", "Gật đầu để thể hiện đồng ý", "Dùng because giải thích lý do"],
      readingTitles: ["Thank You, Ella!", "Sports Rules"],
      value: "Be helpful · Biết giúp đỡ",
      sample: "Sports help us move and work as a team. Linh is good at badminton. She can hit and catch. Players listen to rules, take turns and help one another.",
      writing: "Viết câu giải thích vì sao em thích một môn thể thao, dùng because.",
      project: "Khảo sát môn thể thao và làm áp phích.",
    },
    {
      title: "What makes us feel good?",
      vi: "Điều gì giúp chúng ta cảm thấy khỏe và vui?",
      theme: "Răng và giác quan",
      icon: "😁",
      phonics: "Âm /t/ trong tooth · /br/ trong breathe",
      pattern: ["What should I do for healthy teeth?", "You should brush and rinse every day."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "I use {word} for my teeth.",
          items: [
            ["toothpaste", "kem đánh răng", "🪥"], ["toothbrush", "bàn chải đánh răng", "🪥"],
            ["mouthwash", "nước súc miệng", "💧"], ["rinse", "súc", "🚿", "I rinse my mouth."],
            ["chew", "nhai", "😋", "I chew my food."], ["toothache", "đau răng", "🦷", "I have a toothache."],
            ["dirty", "bẩn", "🟤", "My teeth are dirty."], ["braces", "niềng răng", "😁", "She has braces."],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "I can {word}.",
          items: [
            ["hear", "nghe", "👂"], ["smell", "ngửi", "👃"],
            ["taste", "nếm", "👅"], ["touch", "chạm", "✋"],
            ["hurt", "đau", "🤕", "My tooth can hurt."], ["feel", "cảm thấy", "🙂", "I feel good."],
            ["relax", "thư giãn", "🧘"], ["breathe", "thở", "🌬️"],
          ],
        },
      ],
      grammarFocus: ["should và shouldn't", "It smells nice/bad; It tastes good/bad; when"],
      grammarChecks: [
        ["should / shouldn't", "S + should/shouldn't + base verb", "You ___ brush your teeth.", "should", ["should", "shouldn't", "are", "did"], "Dùng should để khuyên nên làm và shouldn't để khuyên không nên làm.", ["You should rinse.", "You shouldn't eat too many sweets."]],
        ["smells / tastes", "It + smells/tastes + adjective", "The soup ___ good.", "tastes", ["tastes", "taste", "is taste", "tasting"], "Dùng smells và tastes để miêu tả bằng giác quan.", ["It smells nice.", "It tastes good."]],
        ["when", "when + situation, advice", "Tell an adult ___ your tooth hurts.", "when", ["when", "and", "but", "or"], "when nối lời khuyên với tình huống xảy ra.", ["Relax when you feel worried.", "Breathe slowly when you rest."]],
      ],
      skills: ["Đoán nghĩa từ chưa biết", "Nhìn người nói để thể hiện quan tâm", "Viết bài thơ có vần"],
      readingTitles: ["Lots of Teeth!", "What's That Noise?"],
      value: "Be brave · Dũng cảm",
      sample: "Healthy teeth help us chew and smile. We should use a toothbrush and toothpaste. We should rinse carefully. When a tooth hurts, we should tell an adult.",
      writing: "Viết lời khuyên hoặc bài thơ ngắn có từ cùng vần.",
      project: "Làm tờ thông tin hoặc áp phích chăm sóc răng.",
    },
    {
      title: "How are the seasons different?",
      vi: "Các mùa khác nhau như thế nào?",
      theme: "Mùa và tháng",
      icon: "🍂",
      phonics: "Âm /s/ trong spring · /w/ trong winter",
      pattern: ["How often does it rain in summer?", "It often rains in summer."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "{word} is a month.",
          items: [
            ["January", "tháng Một", "1️⃣"], ["February", "tháng Hai", "2️⃣"],
            ["March", "tháng Ba", "3️⃣"], ["April", "tháng Tư", "4️⃣"],
            ["May", "tháng Năm", "5️⃣"], ["June", "tháng Sáu", "6️⃣"],
            ["July", "tháng Bảy", "7️⃣"], ["August", "tháng Tám", "8️⃣"],
            ["September", "tháng Chín", "9️⃣"], ["October", "tháng Mười", "🔟"],
            ["November", "tháng Mười một", "🍁"], ["December", "tháng Mười hai", "🎄"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "We learn about {word}.",
          items: [
            ["spring", "mùa xuân", "🌸"], ["summer", "mùa hè", "☀️"],
            ["fall", "mùa thu", "🍂"], ["winter", "mùa đông", "❄️"],
            ["seasons", "các mùa", "🗓️"], ["world", "thế giới", "🌍"],
            ["North", "phía Bắc", "⬆️"], ["South", "phía Nam", "⬇️"],
          ],
        },
      ],
      grammarFocus: ["always, often, sometimes, never; hiện tại đơn", "How often does it…?"],
      grammarChecks: [
        ["Trạng từ tần suất", "S + always/often/sometimes/never + V", "It ___ rains in summer.", "often", ["often", "does", "is", "at"], "Đặt trạng từ tần suất trước động từ thường.", ["It always rains.", "It never snows here."]],
        ["How often", "How often + does + S + V?", "How often ___ it rain?", "does", ["does", "do", "is", "has"], "Dùng How often để hỏi tần suất.", ["How often does it rain?", "It sometimes rains."]],
        ["Hiện tại đơn", "S + V/V-s", "Winter ___ in December in many places.", "starts", ["starts", "start", "starting", "is start"], "Với chủ ngữ số ít, động từ thường thêm -s hoặc -es.", ["Spring starts in March.", "Seasons change."]],
      ],
      skills: ["Hình dung câu chuyện", "Đặt câu hỏi để biết thêm", "Dùng It hoặc It's nói về thời tiết"],
      readingTitles: ["Larry the Lemur", "North and South"],
      value: "Look after yourself · Biết chăm sóc bản thân",
      sample: "Seasons are different around the world. It is often hot in summer and cold in winter. When it is summer in the North, it can be winter in the South.",
      writing: "Viết câu về thời tiết, dùng It hoặc It's.",
      project: "Làm biểu đồ thời tiết hoặc trò chơi tô màu theo mùa.",
    },
    {
      title: "How are we all different?",
      vi: "Mỗi người chúng ta khác nhau thế nào?",
      theme: "Con người",
      icon: "🧑‍🤝‍🧑",
      phonics: "Âm /k/ trong kind · /ʃ/ trong shy",
      pattern: ["What is your friend like?", "She is kind, creative and helpful."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "My friend is {word}.",
          items: [
            ["hardworking", "chăm chỉ", "📚"], ["shy", "nhút nhát", "🙈"],
            ["kind", "tốt bụng", "💚"], ["helpful", "hay giúp đỡ", "🤝"],
            ["creative", "sáng tạo", "🎨"], ["chatty", "hay nói chuyện", "💬"],
            ["active", "năng động", "⚡"], ["grumpy", "cáu kỉnh", "😠"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "The person has {word} hair.",
          items: [
            ["beard", "râu", "🧔", "He has a beard."], ["bald", "hói", "👨‍🦲", "He is bald."],
            ["blonde", "vàng hoe", "👱", "She has blonde hair."], ["straight", "thẳng", "📏", "He has straight hair."],
            ["curly", "xoăn", "🌀", "She has curly hair."], ["wavy", "gợn sóng", "〰️", "She has wavy hair."],
            ["eyebrows", "lông mày", "👀", "He has thick eyebrows."], ["mustache", "ria mép", "🥸", "He has a mustache."],
          ],
        },
      ],
      grammarFocus: ["So sánh hơn với -er than", "Quá khứ đơn của be: was/were"],
      grammarChecks: [
        ["So sánh hơn", "adjective-er + than", "My brother is old___ than me.", "er", ["er", "est", "ing", "ly"], "Thêm -er với nhiều tính từ ngắn rồi dùng than.", ["She is younger than me.", "He is older than his sister."]],
        ["was / were", "I/he/she/it + was · you/we/they + were", "They ___ shy when they were young.", "were", ["were", "was", "are", "is"], "Dùng was/were để nói trạng thái trong quá khứ.", ["He was active.", "They were kind."]],
        ["Miêu tả ngoại hình", "color/shape + physical feature", "She has ___ hair.", "curly", ["curly", "kindly", "help", "chat"], "Dùng từ chỉ màu hoặc hình dạng trước hair và các đặc điểm ngoại hình.", ["She has curly hair.", "He has thick eyebrows."]],
      ],
      skills: ["Đọc to có biểu cảm", "Không đồng ý một cách lịch sự", "Dùng hai từ miêu tả ngoại hình"],
      readingTitles: ["Mr. Blake and the Ball", "How to Make a Family Album"],
      value: "Be kind to others · Tử tế với mọi người",
      sample: "Bao is chatty and active, while Linh is shy and creative. Both children are kind and helpful. People can look different and still work well together.",
      writing: "Viết câu miêu tả ngoại hình; đặt từ màu hoặc hình dạng trước đặc điểm.",
      project: "Làm trò chơi Guess Who hoặc cây gia đình.",
    },
    {
      title: "How do we solve problems?",
      vi: "Chúng ta giải quyết vấn đề như thế nào?",
      theme: "Toán và tư duy",
      icon: "🧩",
      phonics: "Âm /s/ trong solve · /m/ trong measure",
      pattern: ["Can you help us solve the problem?", "Yes. Let's read the clues and find the answer."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "We use {word} in math.",
          items: [
            ["add", "cộng", "➕"], ["subtract", "trừ", "➖"],
            ["sum", "tổng", "🧮"], ["plus", "dấu cộng", "➕"],
            ["minus", "dấu trừ", "➖"], ["equals", "bằng", "🟰"],
            ["measure", "đo", "📏"], ["problem", "bài toán/vấn đề", "❓"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "We can {word} in this puzzle.",
          items: [
            ["hide", "giấu", "🙈"], ["lost", "bị lạc/mất", "🧭", "The map is lost."],
            ["solve", "giải", "💡"], ["clue", "manh mối", "🔎", "We found a clue."],
            ["treasure hunt", "cuộc săn kho báu", "🗺️", "We play a treasure hunt."], ["maze", "mê cung", "🌀", "We solve a maze."],
            ["entrance", "lối vào", "🚪", "This is the entrance."], ["exit", "lối ra", "🚶", "This is the exit."],
          ],
        },
      ],
      grammarFocus: ["Đại từ tân ngữ us và them", "can cho khả năng; them/us/it/her"],
      grammarChecks: [
        ["us / them", "verb + us/them", "The teacher helps ___.", "us", ["us", "we", "our", "ours"], "Dùng us và them sau động từ.", ["Help us, please.", "I can see them."]],
        ["can cho khả năng", "S + can/can't + base verb", "We can ___ the problem.", "solve", ["solve", "solves", "solved", "solving"], "Sau can dùng động từ nguyên mẫu.", ["I can measure it.", "They can find the exit."]],
        ["Đại từ tân ngữ", "verb + it/her/us/them", "The clue is here. I can see ___.", "it", ["it", "its", "they", "we"], "Dùng it thay cho một vật đã nhắc đến.", ["I can help her.", "We can find it."]],
      ],
      skills: ["Kiểm tra cùng bạn", "Lần lượt hỏi ý kiến", "Dùng for example và dấu phẩy để thêm thông tin"],
      readingTitles: ["Math Problems!", "Escape the Classroom!"],
      value: "Problem solving is fun · Giải quyết vấn đề thật vui",
      sample: "Milo and Luna enter a maze. They read a clue, measure a path and add two numbers. The answer helps them find the exit. They check each step together.",
      writing: "Viết một câu có for example và đặt dấu phẩy đúng chỗ.",
      project: "Nhờ bạn giúp giải câu đố hoặc vẽ bản đồ kho báu.",
    },
    {
      title: "Why is it good to be outdoors?",
      vi: "Tại sao hoạt động ngoài trời lại tốt?",
      theme: "Thiên nhiên",
      icon: "🏞️",
      phonics: "Âm /gr/ trong grass · /sn/ trong snorkel",
      pattern: ["What did you do outdoors?", "I walked by the lake and watched wildlife."],
      vocabularyGroups: [
        {
          label: "Key vocabulary 1",
          example: "We can see {word} outdoors.",
          items: [
            ["grass", "cỏ", "🌱"], ["lake", "hồ", "🏞️", "We can see a lake outdoors."],
            ["hills", "đồi", "⛰️"], ["pond", "ao", "🪷", "We can see a pond outdoors."],
            ["wildlife", "động vật hoang dã", "🦋"], ["meadow", "đồng cỏ", "🌼", "We can see a meadow outdoors."],
            ["rocks", "đá", "🪨"], ["sand", "cát", "🏖️"],
          ],
        },
        {
          label: "Key vocabulary 2",
          example: "We pack {word} for the beach.",
          items: [
            ["fins", "chân nhái", "🩴"], ["snorkel", "ống thở", "🤿"],
            ["water wings", "phao tay", "🛟"], ["air mattress", "đệm hơi", "🛏️"],
            ["hotel", "khách sạn", "🏨", "We stay at a hotel."], ["shell", "vỏ sò", "🐚", "I found a shell."],
            ["seaweed", "rong biển", "🌿", "There is seaweed in the water."], ["sandcastle", "lâu đài cát", "🏰", "We made a sandcastle."],
          ],
        },
      ],
      grammarFocus: ["Quá khứ đơn thường khẳng định và phủ định", "Câu hỏi và trả lời với did"],
      grammarChecks: [
        ["Quá khứ đơn", "S + V-ed · S + didn't + V", "Yesterday, we ___ by the lake.", "walked", ["walked", "walk", "walking", "walks"], "Thêm -ed với động từ thường trong câu khẳng định quá khứ.", ["We walked outside.", "We didn't collect shells."]],
        ["Did…?", "Did + S + base verb?", "___ you visit the pond?", "Did", ["Did", "Do", "Were", "Are"], "Dùng Did ở đầu câu hỏi; động từ chính giữ nguyên mẫu.", ["Did you swim?", "Yes, I did."]],
        ["like / are like", "A is like B · A and B are like…", "The two shells ___ alike.", "are", ["are", "is", "did", "does"], "Dùng is like/are like để nói điểm giống nhau.", ["This rock is like a shell.", "The two ponds are like mirrors."]],
      ],
      skills: ["Đọc tiếp để hiểu từ lạ", "Lần lượt tóm tắt", "Dùng is like/are like nói điểm giống"],
      readingTitles: ["Great Outings", "Samira's Sea Glass Collection"],
      value: "Make memories with your family · Tạo kỷ niệm cùng gia đình",
      sample: "Last weekend, Minh walked by a lake with his family. They watched wildlife and played on the sand. They did not leave rubbish. Minh made happy outdoor memories.",
      writing: "Viết câu so sánh bằng is like hoặc are like.",
      project: "Trình bày nơi ngoài trời yêu thích hoặc viết bưu thiếp kỳ nghỉ.",
    },
  ].map(makeUnit);

  window.MILO_GRADE2_SOURCE = {
    version: SOURCE_VERSION,
    sourceAudit: {
      inputImages: 181,
      inputPart1: 100,
      inputPart2: 81,
      excludedKinds: ["ảnh trắng", "trang tải lỗi", "giao diện trình duyệt/Scribd", "quảng cáo", "ảnh trùng kém rõ"],
      bookAudioAvailable: false,
      answerKeyPolicy: "Chỉ dùng đáp án bài Milo tự biên soạn và kiểm tra theo quy tắc; không đoán đáp án sách.",
    },
    meta: {
      mode: "Now I Know Level 2 · GSE 27–34",
      periods: 120,
      focus: "Phản xạ nghe–nói, đọc hiểu có tranh và viết câu ngắn theo 12 Big Questions.",
      readingTarget: "25–50 từ · tìm ý chính bằng tranh và từ khóa",
      writingTarget: "5–20 từ · câu ngắn có mẫu",
      sourceVersion: SOURCE_VERSION,
    },
    units,
  };
})();
