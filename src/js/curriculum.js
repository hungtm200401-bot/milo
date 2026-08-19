(function () {
  const parseWords = (value) =>
    value.split(";").map((item) => item.split("|").map((part) => part.trim()));

  const unit = (grade, index, spec) => ({
    ...spec,
    words: parseWords(spec.words),
    reference: `Tham chiếu khung Now I Know! Level ${grade} · Unit ${index + 1}`,
    contentPolicy:
      "Chủ đề và mục tiêu năng lực được đối chiếu từ khung chương trình; bài đọc, hội thoại, câu hỏi và dự án do Milo biên soạn mới.",
  });

  const grade = (level, meta, specs) => ({
    ...meta,
    sourceCourse: `Pearson Now I Know! Level ${level}`,
    units: specs.map((spec, index) => unit(level, index, spec)),
  });

  window.MILO_CURRICULUM = {
    2: grade(
      2,
      window.MILO_GRADE2_SOURCE.meta,
      window.MILO_GRADE2_SOURCE.units
    ),
    3: grade(
      3,
      {
        mode: "Now I Know Level 3 · GSE 33–39",
        periods: 140,
        focus:
          "Bốn kỹ năng theo 12 Big Questions; đọc truyện và văn bản thông tin, nói–viết có lý do.",
        readingTarget: "60–100 từ · ý chính, trình tự và chi tiết",
        writingTarget: "35–60 từ · có mở–thân–kết và từ nối",
      },
      [
        {
          title: "How do we find our way?",
          vi: "Chúng ta tìm đường như thế nào?",
          theme: "Bản đồ và chỉ đường",
          icon: "🗺️",
          phonics: "Âm /br/ trong bridge · /m/ trong map",
          pattern: ["How do I get to the museum?", "Cross the square, then turn left at the bridge."],
          words:
            "below|ở dưới|⬇️;above|ở trên|⬆️;beside|bên cạnh|↔️;close to|gần|📍;square|quảng trường|🏙️;downtown|trung tâm thành phố|🏢;building|tòa nhà|🏬;map|bản đồ|🗺️;sign|biển chỉ dẫn|🚏;cross|băng qua|🚶;bridge|cây cầu|🌉;harbor|bến cảng|⚓;museum|bảo tàng|🏛️;theater|nhà hát|🎭",
          grammarFocus: ["Câu mệnh lệnh và please", "Hiện tại đơn với thời gian", "Hiện tại tiếp diễn với now/today"],
          skills: ["Dùng tranh dự đoán truyện", "Dùng tiêu đề đoán văn bản", "Nói hướng về người nghe"],
          sample:
            "Milo needs to take a music book to Luna. He looks at a map and follows the signs downtown. First, he crosses the square. Next, he walks beside a tall building and turns left at the bridge. The school is close to the museum.",
          writing: "Viết chỉ dẫn từ nhà đến một địa điểm bằng First, Next, Then và Finally.",
          project: "Vẽ bản đồ khu phố và thu âm hướng dẫn đường đi qua bốn mốc.",
        },
        {
          title: "How do we know about the past?",
          vi: "Chúng ta biết về quá khứ bằng cách nào?",
          theme: "Khủng long và khảo cổ",
          icon: "🏺",
          phonics: "Âm /d/ trong dinosaur · /tr/ trong treasure",
          pattern: ["What did the archaeologist find?", "She found gold and bones inside the tomb."],
          words:
            "herbivore|động vật ăn cỏ|🌿;carnivore|động vật ăn thịt|🦖;dinosaur|khủng long|🦕;horn|sừng|📯;tail|đuôi|🦎;extinct|tuyệt chủng|⌛;fossil|hóa thạch|🪨;bones|xương|🦴;pharaoh|pha-ra-ông|👑;archaeologist|nhà khảo cổ|⛏️;treasure|kho báu|💎;tomb|lăng mộ|⚱️;gold|vàng|🥇;dig|đào|⛏️",
          grammarFocus: ["Tính từ và trạng từ chỉ cách thức", "have to", "Quá khứ đơn kể phát hiện"],
          skills: ["Dùng thời gian và địa điểm hiểu truyện", "Đọc câu đầu mỗi đoạn", "Tập trung vào người nói"],
          sample:
            "An archaeologist carefully digs near an ancient tomb. She finds bones, a gold bowl and writing on a wall. Each object is a clue about people in the past. Fossils also tell scientists how dinosaurs lived and why some animals became extinct.",
          writing: "Viết bản tin ngắn về một phát hiện khảo cổ và giải thích nó cho ta biết điều gì.",
          project: "Tạo bảo tàng mini có bốn hiện vật, nhãn và lời giới thiệu.",
        },
        {
          title: "Why do we go on vacation?",
          vi: "Tại sao chúng ta đi nghỉ?",
          theme: "Kỳ nghỉ và cắm trại",
          icon: "🏕️",
          phonics: "Âm /k/ trong camp · /fl/ trong flashlight",
          pattern: ["What did you do on vacation?", "I went camping and learned to use a compass."],
          words:
            "campsite|khu cắm trại|🏕️;blanket|chăn|🛌;sleeping bag|túi ngủ|🛏️;camping stove|bếp cắm trại|🔥;flashlight|đèn pin|🔦;compass|la bàn|🧭;set up a tent|dựng lều|⛺;make a fire|nhóm lửa|🔥;clean up|dọn sạch|🧹;get lost|bị lạc|🆘;waterfall|thác nước|💦;coast|bờ biển|🏖️;kayaking|chèo kayak|🛶;life jacket|áo phao|🦺",
          grammarFocus: ["Quá khứ đơn động từ thường/bất quy tắc", "Câu hỏi Wh- ở quá khứ", "Time phrases"],
          skills: ["Nhận ra mở–thân–kết", "Đọc lại phần cần tìm", "Nói rõ ràng"],
          sample:
            "Last summer, Mai went camping near the coast. Her family set up a tent and cooked on a camping stove. The next day, they wore life jackets and went kayaking. They cleaned up the campsite before they left because they wanted to protect nature.",
          writing: "Viết 40–60 từ kể một kỳ nghỉ bằng First, Next, After that và Finally.",
          project: "Thiết kế trại hè an toàn gồm lịch hoạt động, đồ dùng và quy tắc.",
        },
        {
          title: "Why do we tell stories?",
          vi: "Tại sao chúng ta kể chuyện?",
          theme: "Truyện cổ, thần thoại và truyền thuyết",
          icon: "📖",
          phonics: "Âm /k/ trong king · /pr/ trong prince",
          pattern: ["Who was the hero in the story?", "The princess was the hero because she saved the village."],
          words:
            "giant|người khổng lồ|🧌;castle|lâu đài|🏰;bowl|cái bát|🥣;coin|đồng xu|🪙;silver|bạc|⚪;enormous|khổng lồ|🐘;furious|giận dữ|😡;prince|hoàng tử|🤴;princess|công chúa|👸;fairy tale|truyện cổ tích|🧚;king|nhà vua|👑;queen|nữ hoàng|👑;myth|thần thoại|⚡;legend|truyền thuyết|🐉",
          grammarFocus: ["Quá khứ đơn bất quy tắc", "Wh- questions ở quá khứ", "Once upon a time/In the end"],
          skills: ["Nhớ thứ tự sự kiện", "Dùng hình ảnh hỗ trợ hiểu", "Nêu lý do cho ý kiến"],
          sample:
            "Once upon a time, a furious giant took a silver bell from a village. A brave princess followed his footprints to a castle. She did not fight him. She listened, learned that he was lonely and invited him to the spring festival. In the end, he returned the bell.",
          writing: "Viết một truyện 50–60 từ có nhân vật, vấn đề, giải pháp và kết thúc.",
          project: "Kể lại một truyền thuyết Việt Nam bằng tranh sáu khung.",
        },
        {
          title: "Why take care of the environment?",
          vi: "Tại sao phải bảo vệ môi trường?",
          theme: "Môi trường",
          icon: "🌱",
          phonics: "Âm /pl/ trong plant · /br/ trong breathe",
          pattern: ["How can we protect the environment?", "We can plant trees, save electricity and throw away less."],
          words:
            "fresh air|không khí trong lành|🍃;plant|cây|🌱;insect|côn trùng|🐞;habitat|môi trường sống|🏞️;wildlife|động vật hoang dã|🦋;empty|rỗng|⚪;full|đầy|🔵;rescue|giải cứu|🛟;throw away|vứt bỏ|🗑️;breathe|hít thở|🫁;lungs|phổi|🫁;pollution|ô nhiễm|🏭;electricity|điện|⚡;protect|bảo vệ|🛡️",
          grammarFocus: ["So sánh hơn", "So sánh nhất", "can/could đưa giải pháp"],
          skills: ["Dự đoán khi đọc", "Đọc lại phần khó", "Viết mở–thân–kết"],
          sample:
            "A clean park is safer for people and wildlife than a dirty park. Trees give us fresh air and habitats for insects. We can protect the environment by planting trees, saving electricity and using fewer plastic bags. Small actions can make the biggest difference.",
          writing: "Viết đoạn đề xuất ba việc trường em có thể làm để giảm ô nhiễm.",
          project: "Tổ chức thử thách xanh bảy ngày và báo cáo kết quả bằng biểu đồ.",
        },
        {
          title: "Why do we use numbers every day?",
          vi: "Tại sao chúng ta dùng số hằng ngày?",
          theme: "Mua sắm, thời gian và đo lường",
          icon: "🛍️",
          phonics: "Âm /tʃ/ trong choose · trọng âm expensive",
          pattern: ["How much is this pack of cookies?", "It is twenty thousand dong."],
          words:
            "go shopping|đi mua sắm|🛍️;gift|món quà|🎁;stall|quầy hàng|🏪;money|tiền|💵;expensive|đắt|💎;cheap|rẻ|🏷️;useful|hữu ích|🧰;colorful|nhiều màu sắc|🌈;choose|lựa chọn|👉;pay|thanh toán|💳;quarter|một phần tư|◔;half|một nửa|◐;hour|giờ|🕐;minute|phút|⌛",
          grammarFocus: ["a pack/pair/piece/box/bag/bar of", "Cách nói giờ", "How much/How many"],
          skills: ["So sánh cuộc sống với nhân vật", "Dùng sơ đồ hiểu văn bản", "Dùng then/after để chỉ trình tự"],
          sample:
            "Mai goes shopping at half past nine. She chooses a colorful gift at a small stall. It is cheap but useful, so she pays for it. At a clock shop, the owner explains that a quarter of an hour is fifteen minutes.",
          writing: "Viết 40–60 từ về một lần mua sắm, dùng cụm đơn vị và một cách nói giờ.",
          project: "Thiết kế quầy hàng mini, đặt giá và đóng vai mua–bán tám lượt.",
        },
        {
          title: "What do we do for entertainment?",
          vi: "Chúng ta làm gì để giải trí?",
          theme: "Âm nhạc và giải trí",
          icon: "🎺",
          phonics: "Âm /tʃ/ trong chess · /dr/ trong drum",
          pattern: ["What do you do for entertainment?", "I listen to a band and play chess with my friends."],
          words:
            "chess|cờ vua|♟️;band|ban nhạc|🎸;musician|nhạc công|🎼;magazine|tạp chí|📰;headphones|tai nghe|🎧;hang out|đi chơi cùng bạn|👥;famous|nổi tiếng|⭐;traditional|truyền thống|🏮;modern|hiện đại|✨;orchestra|dàn nhạc|🎻;cello|đàn cello|🎻;drum|trống|🥁;trumpet|kèn trumpet|🎺;exciting|hào hứng|🤩",
          grammarFocus: ["interested in/afraid of/tired of", "So sánh hơn và nhất", "Dùng est/most tạo điểm nhấn"],
          skills: ["Nhận biết nguyên nhân–kết quả", "Dùng KWL khi đọc", "Thể hiện đồng ý"],
          sample:
            "Luna enjoys both traditional and modern music. She plays the drum in a school band and sometimes listens to an orchestra with headphones. Her friend prefers chess because it is quiet but exciting. They agree that entertainment helps people relax and connect.",
          writing: "Viết đoạn so sánh hai hình thức giải trí và nêu lựa chọn của em.",
          project: "Tạo bản tin giải trí của lớp gồm phỏng vấn, bảng xếp hạng và giới thiệu.",
        },
        {
          title: "Why is space interesting?",
          vi: "Tại sao không gian thú vị?",
          theme: "Không gian",
          icon: "🚀",
          phonics: "Âm /sp/ trong space · /pl/ trong planet",
          pattern: ["What do scientists do on a space station?", "They do experiments and observe our planet."],
          words:
            "Moon|Mặt Trăng|🌙;bright|sáng|✨;worried|lo lắng|😟;frightened|sợ hãi|😨;space station|trạm vũ trụ|🛰️;rocket|tên lửa|🚀;scientist|nhà khoa học|🧑‍🔬;float|lơ lửng|🫧;laboratory|phòng thí nghiệm|🧪;launch|phóng|🔥;orbit|quỹ đạo|🔄;telescope|kính thiên văn|🔭;planet|hành tinh|🪐;spacesuit|bộ đồ vũ trụ|👨‍🚀",
          grammarFocus: ["will cho dự đoán", "can/can't trong điều kiện không gian", "So sánh kích thước và khoảng cách"],
          skills: ["Dùng số liệu và hình minh họa", "Hỏi câu tiếp nối", "Tóm tắt ý chính"],
          sample:
            "A space station travels in orbit around Earth. Scientists float because there is very little gravity. They wear spacesuits outside and work in a laboratory inside. Their experiments help us understand the human body, materials and our bright planet.",
          writing: "Viết đoạn giải thích một ngày của nhà khoa học trên trạm vũ trụ.",
          project: "Thiết kế trạm vũ trụ có phòng, nhiệm vụ và năm quy tắc an toàn.",
        },
        {
          title: "How are homes different?",
          vi: "Nhà ở khác nhau như thế nào?",
          theme: "Nhà ở và cộng đồng",
          icon: "🏠",
          phonics: "Âm /h/ trong home · /r/ trong roof",
          pattern: ["What is special about this home?", "It is a houseboat, so it floats on a canal."],
          words:
            "apartment|căn hộ|🏢;cottage|nhà nhỏ miền quê|🏡;houseboat|nhà thuyền|🛶;farmhouse|nhà nông trại|🚜;village|làng|🌾;city|thành phố|🏙️;stairs|cầu thang|🪜;balcony|ban công|🌿;roof|mái nhà|🏠;canal|kênh đào|🌊;neighborhood|khu phố|📍;traditional|truyền thống|🏮;modern|hiện đại|✨;comfortable|thoải mái|🛋️",
          grammarFocus: ["There is/are ôn tập", "because/so nêu lý do–kết quả", "So sánh nhà ở"],
          skills: ["Quét văn bản tìm chi tiết", "So sánh hai nơi", "Miêu tả từ ngoài vào trong"],
          sample:
            "Homes look different because people live in different places. A city apartment may have a balcony but no garden. A farmhouse has space for animals and tools. In a canal city, a houseboat can be both a home and a way to travel.",
          writing: "Viết hai đoạn ngắn so sánh nhà em với một kiểu nhà khác.",
          project: "Thiết kế ngôi nhà phù hợp một môi trường và bảo vệ lựa chọn trước lớp.",
        },
        {
          title: "How do we take care of our body?",
          vi: "Chúng ta chăm sóc cơ thể thế nào?",
          theme: "Sức khỏe",
          icon: "🧼",
          phonics: "Âm /d/ trong doctor · /dʒ/ trong germs",
          pattern: ["How can we stop germs from spreading?", "We should wash our hands and cover a cough."],
          words:
            "doctor|bác sĩ|🩺;patient|bệnh nhân|🛏️;germs|vi trùng|🦠;cough|ho|😷;sneeze|hắt hơi|🤧;fever|sốt|🌡️;medicine|thuốc|💊;healthy|khỏe mạnh|💚;wash hands|rửa tay|🧼;soap|xà phòng|🫧;rest|nghỉ ngơi|🛌;exercise|tập thể dục|🏃;cover|che lại|🤲;spread|lây lan|↔️",
          grammarFocus: ["should/shouldn't", "must/mustn't", "because giải thích quy tắc"],
          skills: ["Phân biệt vấn đề–giải pháp", "Nghe lời khuyên chính", "Viết hướng dẫn theo bước"],
          sample:
            "Germs are tiny, but they can spread quickly. We should wash our hands with soap before eating and after using the bathroom. We should cover a cough or sneeze. Rest, exercise and healthy food also help our bodies stay strong.",
          writing: "Viết hướng dẫn 5 bước bảo vệ sức khỏe ở trường.",
          project: "Làm chiến dịch Say No to Germs bằng poster và phần trình bày một phút.",
        },
        {
          title: "Why is Antarctica special?",
          vi: "Tại sao Nam Cực đặc biệt?",
          theme: "Nam Cực và thích nghi",
          icon: "🐧",
          phonics: "Âm /gl/ trong glacier · /p/ trong penguin",
          pattern: ["How do animals survive in Antarctica?", "They adapt with thick feathers, fat and group behavior."],
          words:
            "Antarctica|Nam Cực|🧊;expedition|cuộc thám hiểm|🧭;explorer|nhà thám hiểm|🥾;ice|băng|🧊;glacier|sông băng|🏔️;penguin|chim cánh cụt|🐧;seal|hải cẩu|🦭;adapt|thích nghi|🔄;survive|sống sót|💪;freezing|lạnh cóng|🥶;equipment|thiết bị|🎒;research station|trạm nghiên cứu|🔬;climate|khí hậu|🌡️;protect|bảo vệ|🛡️",
          grammarFocus: ["have to/must trong điều kiện khắc nghiệt", "So sánh nhất", "can để nói cách thích nghi"],
          skills: ["Đọc bản đồ và sơ đồ", "Tìm bằng chứng", "Giải thích nguyên nhân–kết quả"],
          sample:
            "Antarctica is the coldest continent. Explorers need special equipment, while scientists live at research stations. Penguins and seals adapt to freezing conditions with thick body covering and fat. Protecting this climate is important for the whole planet.",
          writing: "Viết đoạn giải thích vì sao Nam Cực đặc biệt và cần được bảo vệ.",
          project: "Lập kế hoạch thám hiểm gồm thiết bị, thời tiết, động vật và quy tắc.",
        },
        {
          title: "Why do we have festivals?",
          vi: "Tại sao chúng ta có lễ hội?",
          theme: "Lễ hội và văn hóa",
          icon: "🏮",
          phonics: "Âm /f/ trong festival · /sp/ trong spring",
          pattern: ["Why do people celebrate this festival?", "They celebrate to remember a tradition and bring the community together."],
          words:
            "lantern|đèn lồng|🏮;parade|diễu hành|🎊;costume|trang phục|👘;celebration|lễ kỷ niệm|🎉;decorate|trang trí|✨;traditional|truyền thống|🏯;spring|mùa xuân|🌸;fireworks|pháo hoa|🎆;music|âm nhạc|🎵;dance|nhảy múa|💃;feast|bữa tiệc lớn|🍱;invite|mời|✉️;culture|văn hóa|🌏;community|cộng đồng|👨‍👩‍👧‍👦",
          grammarFocus: ["Hiện tại đơn mô tả truyền thống", "to + verb nói mục đích", "Time phrases trong lễ hội"],
          skills: ["So sánh các nền văn hóa", "Tìm ý nghĩa biểu tượng", "Nêu điểm giống và khác"],
          sample:
            "Festivals help communities remember stories, seasons and important people. During a lantern festival, families decorate streets, share a feast and watch a parade. Music, costumes and dance may look different around the world, but celebrations often bring people together.",
          writing: "Viết đoạn giới thiệu một lễ hội Việt Nam cho một người bạn quốc tế.",
          project: "Làm triển lãm Spring Festivals Around the World có bảng so sánh ba nước.",
        },
      ]
    ),

    4: grade(
      4,
      {
        mode: "Now I Know Level 4 · GSE 38–46",
        periods: 150,
        focus:
          "Học thuật thiếu nhi: đọc suy luận, ghi chú, tranh luận có lý do và viết hai đoạn.",
        readingTarget: "120–180 từ · suy luận và dẫn chứng",
        writingTarget: "80–120 từ · hai đoạn có lý do",
      },
      [
        {
          title: "How can we eat well?",
          vi: "Làm thế nào để ăn uống tốt?",
          theme: "Dinh dưỡng",
          icon: "🥗",
          phonics: "Trọng âm carbohydrates · âm /f/ trong fiber",
          pattern: ["What makes a balanced meal?", "It has vegetables, protein, fiber and healthy carbohydrates."],
          words:
            "calcium|canxi|🥛;carbohydrates|chất bột đường|🍞;dairy|sản phẩm từ sữa|🧀;fat|chất béo|🥑;fiber|chất xơ|🌾;iron|sắt|🥬;minerals|khoáng chất|💎;protein|chất đạm|🥚;vegetables|rau|🥦;vitamins|vitamin|🍊;boiled|luộc|🥚;fried|chiên|🍳;grilled|nướng|🔥;nutritious|bổ dưỡng|💚;balanced|cân bằng|⚖️;energy|năng lượng|⚡",
          grammarFocus: ["smell/taste/look + adjective", "will cho quyết định", "Hiện tại tiếp diễn cho kế hoạch"],
          skills: ["Dự đoán trước khi nghe", "Kiểm tra hiểu khi đọc", "Dùng should/shouldn't cho lời khuyên"],
          sample:
            "A balanced meal gives the body energy and nutrients. Vegetables provide vitamins, minerals and fiber, while eggs or fish provide protein. Fried food can contain too much fat, so we should choose boiled or grilled food more often. A healthy plate can still be colorful and tasty.",
          writing: "Viết hai đoạn phân tích một bữa ăn và đề xuất cách làm cân bằng hơn.",
          project: "Thiết kế thực đơn ba bữa, tính nhóm dinh dưỡng và thuyết trình lựa chọn.",
        },
        {
          title: "Why are some buildings famous?",
          vi: "Tại sao một số công trình nổi tiếng?",
          theme: "Kiến trúc",
          icon: "🗼",
          phonics: "Trọng âm architect · âm /str/ trong structure",
          pattern: ["Why is this building famous?", "It is famous for its design, height and history."],
          words:
            "architect|kiến trúc sư|📐;bridge|cây cầu|🌉;concrete|bê tông|🏗️;construction|xây dựng|🚧;massive|đồ sộ|🏛️;meters|mét|📏;modern|hiện đại|✨;monument|đài tưởng niệm|🗿;statue|tượng|🗽;structure|kết cấu|🏢;tower|tòa tháp|🗼;arches|vòm|🌈;landmark|địa danh|📍;medieval|thời trung cổ|🏰;staircase|cầu thang|🪜;mural|tranh tường|🎨",
          grammarFocus: ["How tall...? It's ... meters tall", "be going to cho kế hoạch", "Số liệu mô tả chi tiết"],
          skills: ["Quét văn bản tìm thông tin", "Suy luận từ manh mối", "Dùng số, tên và sự kiện"],
          sample:
            "A famous building is more than a large structure. Its design may solve a difficult problem or show an important moment in history. Architects choose materials such as concrete, glass or stone. Visitors remember clear details: a massive tower, unusual arches or a colorful mural.",
          writing: "Viết hai đoạn giới thiệu một công trình Việt Nam bằng số liệu và lý do.",
          project: "Xây mô hình công trình, ghi kích thước và thuyết trình kế hoạch thiết kế.",
        },
        {
          title: "How can we protect wild animals?",
          vi: "Làm sao bảo vệ động vật hoang dã?",
          theme: "Bảo tồn",
          icon: "🐢",
          phonics: "Âm /sp/ trong species · /pr/ trong protect",
          pattern: ["Why is this species endangered?", "Its habitat is disappearing because of pollution and hunting."],
          words:
            "endangered|có nguy cơ tuyệt chủng|⚠️;extinct|tuyệt chủng|⌛;gorilla|khỉ đột|🦍;habitat|môi trường sống|🏞️;poacher|kẻ săn trộm|🚫;prevent|ngăn chặn|🛡️;rainforest|rừng mưa|🌴;species|loài|🐾;coral|san hô|🪸;predator|động vật săn mồi|🐆;survive|sống sót|💪;pollution|ô nhiễm|🏭;sanctuary|khu bảo tồn|🌿;volunteer|tình nguyện viên|🙋;donation|khoản quyên góp|💝;responsible|có trách nhiệm|✅",
          grammarFocus: ["How many/How much", "Danh từ đếm được/không đếm được", "could nói khả năng"],
          skills: ["Nghe lý do và ví dụ", "Tìm thông điệp tổng thể", "Kết nối ý bằng so"],
          sample:
            "Many wild animals become endangered when their habitats disappear. Pollution can damage coral and plastic can enter the ocean. Poachers also threaten some species. Governments, sanctuaries and responsible visitors can protect animals by creating safe areas, reducing waste and supporting local communities.",
          writing: "Viết bài kêu gọi bảo vệ một loài, dùng nguyên nhân, bằng chứng và giải pháp.",
          project: "Thiết kế chiến dịch bảo tồn có khẩu hiệu, số liệu và hành động cụ thể.",
        },
        {
          title: "What can we do with our trash?",
          vi: "Chúng ta có thể làm gì với rác?",
          theme: "Tái chế và nâng cấp đồ cũ",
          icon: "♻️",
          phonics: "Âm /tr/ trong trash · /pl/ trong plastic",
          pattern: ["What could we do with this bottle?", "We could reuse it as a plant pot."],
          words:
            "can|lon kim loại|🥫;glass jar|lọ thủy tinh|🫙;landfill|bãi chôn lấp|🗑️;metal|kim loại|🔩;natural resources|tài nguyên thiên nhiên|🌍;packaging|bao bì|📦;plastic|nhựa|🧴;toxic|độc hại|☠️;cardboard|bìa cứng|📦;recycling plant|nhà máy tái chế|🏭;throw out|vứt bỏ|🚮;upcycle|tái chế nâng cấp|🛠️;reduce|giảm|➖;reuse|tái sử dụng|🔁;waste|rác thải|🗑️;environment|môi trường|🌱",
          grammarFocus: ["need/don't need to", "could đưa gợi ý", "too much/too many/enough"],
          skills: ["Ghi chú khi nghe", "Liên hệ văn bản với cuộc sống", "Dùng ví dụ hỗ trợ ý"],
          sample:
            "Trash does not always belong in a landfill. We can reuse a glass jar, recycle metal and cardboard, or upcycle packaging into useful objects. We need to reduce plastic because producing and burning it can use natural resources and create toxic fumes.",
          writing: "Viết hai đoạn giải thích vấn đề rác và một sản phẩm upcycle.",
          project: "Tạo sản phẩm từ vật liệu cũ và trình bày quy trình, lợi ích, hạn chế.",
        },
        {
          title: "How can we choose our jobs?",
          vi: "Chúng ta chọn nghề như thế nào?",
          theme: "Nghề nghiệp và năng lực",
          icon: "🔬",
          phonics: "Trọng âm musician · scientist",
          pattern: ["What skills does this job need?", "It needs creativity, training and careful teamwork."],
          words:
            "athlete|vận động viên|🏅;compete|thi đấu|🏁;compose|sáng tác|🎼;discover|khám phá|🔎;laboratory|phòng thí nghiệm|🧪;musician|nhạc sĩ|🎵;painter|họa sĩ|🎨;scientist|nhà khoa học|🧑‍🔬;studio|xưởng sáng tạo|🏠;train|luyện tập|🏋️;barber|thợ cắt tóc|💈;crew|đội ngũ|👥;explorer|nhà thám hiểm|🧭;surgeon|bác sĩ phẫu thuật|🩺;journey|hành trình|🗺️;resourceful|tháo vát|💡",
          grammarFocus: ["So sánh trạng từ", "So sánh hơn/nhất tính từ", "more/the most"],
          skills: ["Nghe lý do", "So sánh chi tiết từ hai văn bản", "Nêu ý kiến có lý do"],
          sample:
            "Choosing a job begins with knowing your interests and strengths. A scientist must investigate carefully, while a musician needs to practise and perform confidently. Training matters, but curiosity and teamwork matter too. People can also change careers as they discover new abilities.",
          writing: "Viết bài so sánh hai nghề và giải thích nghề phù hợp với em hơn.",
          project: "Tạo hồ sơ nghề nghiệp gồm kỹ năng, môi trường làm việc và lộ trình học.",
        },
        {
          title: "What happens in extreme conditions?",
          vi: "Điều gì xảy ra trong điều kiện khắc nghiệt?",
          theme: "Cơ thể và thiên tai",
          icon: "🌋",
          phonics: "Trọng âm extreme · âm /v/ trong volcano",
          pattern: ["What must people do in extreme heat?", "They must drink water and avoid heatstroke."],
          words:
            "adapt to|thích nghi với|🔄;dehydrated|mất nước|💧;extreme|khắc nghiệt|⚠️;heart rate|nhịp tim|❤️;heatstroke|sốc nhiệt|🥵;hypothermia|hạ thân nhiệt|🥶;mild|ôn hòa|🙂;numb|tê cóng|🧊;perspire|toát mồ hôi|💦;shiver|run rẩy|🥶;eruption|sự phun trào|🌋;explosion|vụ nổ|💥;lava|dung nham|🔥;tremor|rung chấn|📳;volcano|núi lửa|🌋;safe|an toàn|🛡️",
          grammarFocus: ["must/have to", "mustn't/don't have to", "Quy định và không bắt buộc"],
          skills: ["Nghe tên, số và địa điểm", "Nhận diện vấn đề–giải pháp", "Nghiên cứu trước khi viết"],
          sample:
            "Extreme heat makes the body perspire and lose water. Without enough water, a person can become dehydrated or suffer heatstroke. In extreme cold, shivering helps create warmth, but long exposure may cause hypothermia. During a volcanic eruption, people must follow official safety instructions.",
          writing: "Viết hướng dẫn ứng phó một điều kiện khắc nghiệt bằng must/mustn't.",
          project: "Làm bộ thẻ khẩn cấp cho nóng, lạnh và núi lửa.",
        },
        {
          title: "How and why do fashions change?",
          vi: "Thời trang thay đổi thế nào và tại sao?",
          theme: "Quần áo và lịch sử",
          icon: "👗",
          phonics: "Âm /f/ trong fashion · /k/ trong cotton",
          pattern: ["Why did this fashion change?", "It changed when new materials and ideas became popular."],
          words:
            "artificial fibers|sợi nhân tạo|🧵;cardigan|áo cardigan|🧥;collar|cổ áo|👔;cotton|vải bông|☁️;denim|vải bò|👖;leather|da|👜;silk|lụa|🧣;suit|com-lê|🤵;wool|len|🐑;belt|thắt lưng|👖;bracelet|vòng tay|📿;design|thiết kế|✏️;jewelry|trang sức|💎;necklace|vòng cổ|📿;ribbon|ruy băng|🎀;fashionable|hợp thời trang|✨",
          grammarFocus: ["Mệnh đề thời gian when/after/before", "Lời đề nghị và gợi ý", "Why don't we...?"],
          skills: ["Nghe chi tiết và gợi ý", "Kể lại câu chuyện", "Viết email thân mật"],
          sample:
            "Fashion changes when technology, culture and daily life change. Cotton and wool have been used for a long time, while artificial fibers created new choices. Music and films can make a style popular. Good design should also be comfortable, useful and less harmful to the environment.",
          writing: "Viết email kể về một xu hướng thời trang và lý do nó thay đổi.",
          project: "Thiết kế trang phục bền vững, ghi vật liệu và bảo vệ lựa chọn.",
        },
        {
          title: "How has entertainment developed?",
          vi: "Giải trí đã phát triển như thế nào?",
          theme: "Biểu diễn và truyền thông",
          icon: "🎬",
          phonics: "Trọng âm entertainment · performance",
          pattern: ["How has entertainment changed?", "Technology has changed how people create and watch performances."],
          words:
            "audience|khán giả|👥;ballet|múa ba lê|🩰;ballroom dancing|khiêu vũ|💃;hip-hop|hip-hop|🎧;performance|buổi biểu diễn|🎭;rhythm|nhịp điệu|🥁;tango|điệu tango|🌹;action|hành động|💥;animation|hoạt hình|🎨;applause|tràng pháo tay|👏;comedy|hài kịch|😂;director|đạo diễn|🎬;drama|chính kịch|🎭;edited|đã biên tập|✂️;make-up|hóa trang|💄;reality TV|truyền hình thực tế|📺",
          grammarFocus: ["How about/What about...?", "Hiện tại tiếp diễn chỉ tương lai", "will cho quyết định"],
          skills: ["Tóm tắt thông tin quan trọng", "Nêu lý do thích/không thích", "Viết bài đánh giá"],
          sample:
            "Entertainment has developed from live performances to films, television and online video. Technology lets directors edit pictures, add animation and reach a larger audience. However, live ballet, drama and music remain special because performers and the audience share the same moment.",
          writing: "Viết bài đánh giá một hình thức giải trí, có mô tả và quan điểm.",
          project: "Sản xuất chương trình giải trí ba phút gồm kịch bản, vai trò và phản hồi.",
        },
        {
          title: "Why are adventure stories popular?",
          vi: "Tại sao truyện phiêu lưu được yêu thích?",
          theme: "Phiêu lưu",
          icon: "⛵",
          phonics: "Trọng âm adventure · âm /tr/ trong treasure",
          pattern: ["What was the hero doing when the storm began?", "She was navigating when the waves became dangerous."],
          words:
            "battle|trận chiến|⚔️;challenge|thử thách|🏁;endurance|sức bền|💪;exhaustion|kiệt sức|😫;loneliness|cô đơn|🌊;navigate|định hướng|🧭;nonstop|không ngừng|⏱️;sink|chìm|⬇️;solo|một mình|⛵;treacherous|nguy hiểm khó lường|⚠️;waves|sóng|🌊;yachtsman|người lái du thuyền|⛵;eye patch|miếng che mắt|🏴‍☠️;mystery|bí ẩn|❓;sword|kiếm|🗡️;treasure|kho báu|💎",
          grammarFocus: ["Quá khứ tiếp diễn khẳng định/phủ định", "Câu hỏi quá khứ tiếp diễn", "when + quá khứ đơn"],
          skills: ["Tìm thông tin theo tiêu đề", "Miêu tả nhân vật", "Mở truyện bằng bối cảnh"],
          sample:
            "Adventure stories place ordinary people in difficult situations. A sailor may be navigating through treacherous waves when a storm begins. Readers continue because they want to know whether the hero will solve the mystery, survive the challenge and return home.",
          writing: "Viết mở đầu truyện phiêu lưu có bối cảnh, nhân vật và biến cố.",
          project: "Tạo bản đồ kho báu và kể truyện dựa trên năm địa điểm.",
        },
        {
          title: "Why do we raise money for charity?",
          vi: "Tại sao chúng ta gây quỹ từ thiện?",
          theme: "Cộng đồng",
          icon: "💝",
          phonics: "Âm /tʃ/ trong charity · /v/ trong volunteer",
          pattern: ["How can our class support the charity?", "We can organize an event and collect donations."],
          words:
            "charity|tổ chức từ thiện|💝;donate|quyên góp|🎁;email|thư điện tử|📧;raise money|gây quỹ|💰;regularly|thường xuyên|🔁;sponsor|tài trợ|🤝;support|hỗ trợ|🛟;text message|tin nhắn|💬;volunteer|tình nguyện|🙋;website|trang web|🌐;care for|chăm sóc|💚;collect|thu gom|📦;generous|hào phóng|✨;improve|cải thiện|📈;organization|tổ chức|🏢;well|giếng nước|🪣",
          grammarFocus: ["know/understand how to", "Quá khứ tiếp diễn và quá khứ đơn", "Trạng từ tần suất"],
          skills: ["Nghe ai đang nói", "Hiểu từ/cụm trong ngữ cảnh", "Viết văn bản thông tin"],
          sample:
            "A charity uses money, time or materials to support a need. Students can raise money with a book sale, collect useful supplies or volunteer at an event. Before choosing, they should learn how the organization works and how donations will improve people's lives.",
          writing: "Viết kế hoạch gây quỹ gồm mục tiêu, hoạt động, trách nhiệm và cách báo cáo.",
          project: "Mô phỏng chiến dịch thiện nguyện minh bạch có ngân sách và bảng theo dõi.",
        },
        {
          title: "How are we similar but different?",
          vi: "Chúng ta giống và khác nhau thế nào?",
          theme: "Tính cách và di truyền",
          icon: "🧬",
          phonics: "Âm /s/ trong similar · /j/ trong unique",
          pattern: ["How are the two friends similar?", "They are both creative, but they respond differently to problems."],
          words:
            "creative|sáng tạo|🎨;feel|cảm thấy|❤️;funny|vui tính|😄;have in common|có điểm chung|🤝;honest|trung thực|✅;mean|xấu tính|😠;open|cởi mở|🌤️;stubborn|bướng bỉnh|🐂;talkative|hay nói|💬;thoughtful|chu đáo|💭;behave|cư xử|🧍;character|tính cách|🪪;determine|quyết định/ảnh hưởng|🔎;respond|phản ứng|↩️;similar|tương tự|🟰;unique|độc đáo|⭐",
          grammarFocus: ["someone/anything/nobody...", "look like/be like", "both/but/while"],
          skills: ["Tìm tính từ hiểu nhân vật", "Hiểu ý tưởng khoa học", "Bày tỏ quan điểm mạnh"],
          sample:
            "People can look similar but have different personalities. Genes influence some physical features, while experiences can influence how we think and respond. Two friends may have hobbies in common, yet one is talkative and the other is quiet. Each person remains unique.",
          writing: "Viết bài miêu tả hai người, dùng điểm giống, khác và dẫn chứng.",
          project: "Tạo sơ đồ Venn về hai nhân vật rồi thuyết trình nhận xét.",
        },
        {
          title: "How did people live in the past?",
          vi: "Con người sống trong quá khứ thế nào?",
          theme: "Lịch sử đời sống",
          icon: "🚂",
          phonics: "Âm /b/ trong baker · /tr/ trong train",
          pattern: ["How did people travel in the past?", "They used to travel by horse, cart and steam train."],
          words:
            "baker|thợ làm bánh|🥖;butcher|người bán thịt|🥩;commute|đi làm hằng ngày|🚉;cotton mill|nhà máy bông|🏭;horse and cart|xe ngựa|🐎;locomotive|đầu máy xe lửa|🚂;railway|đường sắt|🛤️;suburb|ngoại ô|🏘️;subway|tàu điện ngầm|🚇;village|làng|🌾;chimney sweep|thợ quét ống khói|🧹;coal mine|mỏ than|⛏️;housemaid|người giúp việc|🧽;pickpocket|kẻ móc túi|🕵️;soot|bồ hóng|⚫;workhouse|nhà lao động xưa|🏚️",
          grammarFocus: ["used to", "who/that/which/where", "So sánh quá khứ và hiện tại"],
          skills: ["Nghe điểm khác biệt", "So sánh trải nghiệm", "Giải thích tác động của phát minh"],
          sample:
            "In the past, many people lived near farms or factories. Workers used to travel by horse and cart, then locomotives changed how towns grew. Some jobs, such as chimney sweep, were dangerous. Modern transport and safety laws have improved daily life, although new problems have appeared.",
          writing: "Viết hai đoạn so sánh một mặt đời sống xưa và nay.",
          project: "Làm bảo tàng Before and Now có hiện vật, mốc thời gian và thuyết minh.",
        },
      ]
    ),

    5: grade(
      5,
      {
        mode: "Now I Know Level 5 · GSE 43–54",
        periods: 160,
        focus:
          "Đọc hai nguồn, phân biệt sự thật–quan điểm, thảo luận có bằng chứng và viết học thuật.",
        readingTarget: "180–260 từ · hai nguồn và suy luận",
        writingTarget: "130–180 từ · lập luận, sửa và trích dẫn chi tiết",
      },
      [
        {
          title: "Why are inventions made?",
          vi: "Tại sao con người tạo ra phát minh?",
          theme: "Phát minh và máy móc",
          icon: "💡",
          phonics: "Trọng âm invention · mechanical · electronic",
          pattern: ["Why was this invention made?", "It was made to solve a problem and make a task safer."],
          words:
            "robot|rô-bốt|🤖;dishwasher|máy rửa bát|🍽️;washing machine|máy giặt|🧺;light bulb|bóng đèn|💡;plumbing|hệ thống ống nước|🚰;combustion engine|động cơ đốt trong|⚙️;screen|màn hình|🖥️;wheel|bánh xe|🛞;wing|cánh|🪽;battery|pin|🔋;engine|động cơ|⚙️;complicated|phức tạp|🧩;mechanical|thuộc cơ khí|🔧;electronic|thuộc điện tử|💻;rotate|xoay|🔄;manufacture|sản xuất|🏭;accurate|chính xác|🎯;develop|phát triển|📈",
          grammarFocus: ["Ôn các thì quá khứ", "had to/didn't have to", "could/couldn't"],
          skills: ["Nghe từ chỉ quy trình", "Suy luận từ chi tiết", "Tóm tắt văn bản kỹ thuật"],
          sample:
            "Inventions are usually made because people face a problem. Early washing machines reduced hard physical work, while electric light made homes safer after dark. Inventors test mechanical and electronic parts, record failures and develop better versions. A useful invention should solve a real need rather than simply look impressive.",
          writing: "Viết bài giải thích một phát minh: vấn đề, quy trình phát triển và tác động.",
          project: "Thiết kế phát minh giải quyết vấn đề trong trường và trình bày nguyên mẫu.",
        },
        {
          title: "How can we learn from history?",
          vi: "Chúng ta học được gì từ lịch sử?",
          theme: "Nguồn lịch sử",
          icon: "🏺",
          phonics: "Trọng âm civilization · archaeologist",
          pattern: ["What can this source tell us?", "It can show how people lived, worked and recorded events."],
          words:
            "source|nguồn tư liệu|📜;document|tài liệu|📄;diary|nhật ký|📔;site|di chỉ|📍;ruins|tàn tích|🏛️;records|hồ sơ|🗂️;artefact|hiện vật|🏺;gold|vàng|🥇;silver|bạc|⚪;clay|đất sét|🏺;precious|quý giá|💎;valuable|có giá trị|⭐;civilization|nền văn minh|🏙️;excavate|khai quật|⛏️;ancestor|tổ tiên|👥;chamber|căn phòng kín|🚪;century|thế kỷ|💯;analyze|phân tích|🔎",
          grammarFocus: ["Quá khứ tiếp diễn tạo bối cảnh", "Quá khứ tiếp diễn bị gián đoạn", "when/while"],
          skills: ["Nghe nguyên nhân–kết quả", "So sánh góc nhìn", "Kết hợp lịch sử và quan điểm"],
          sample:
            "History is built from many sources, not one perfect story. A diary gives a personal view, while an official document may record dates and decisions. Artefacts and ruins show daily life but need careful interpretation. Historians compare evidence because every source has a purpose and a limitation.",
          writing: "So sánh hai nguồn lịch sử và đánh giá nguồn nào trả lời câu hỏi tốt hơn.",
          project: "Tạo hồ sơ điều tra lịch sử gồm hai nguồn, bằng chứng và kết luận.",
        },
        {
          title: "Why do we move to new places?",
          vi: "Tại sao con người chuyển đến nơi ở mới?",
          theme: "Di cư và cộng đồng",
          icon: "🧳",
          phonics: "Trọng âm immigrant · environmental",
          pattern: ["Why did the family move abroad?", "They moved to find safety, work and a place where they could reunite."],
          words:
            "immigrant|người nhập cư|🧳;refugee|người tị nạn|🛟;move abroad|chuyển ra nước ngoài|✈️;belongings|đồ đạc cá nhân|📦;transfer|chuyển giao|🔄;economic|thuộc kinh tế|💼;social|thuộc xã hội|👥;political|thuộc chính trị|🏛️;environmental|thuộc môi trường|🌍;settle|định cư|🏠;reunite|đoàn tụ|🤗;border|biên giới|🛂;passport|hộ chiếu|📕;luggage|hành lý|🧳;citizen|công dân|🪪;essential|thiết yếu|⭐;benefit|lợi ích|➕;disaster|thảm họa|⚠️",
          grammarFocus: ["Mệnh đề where", "Mạo từ a/an/the", "Trích dẫn lời nói trực tiếp"],
          skills: ["Phân biệt ý chính và chi tiết", "Tìm số liệu", "Miêu tả bối cảnh và nhân vật"],
          sample:
            "People move for economic, social, political or environmental reasons. Some choose a new city for work, while refugees may cross a border to find safety. Moving can bring benefits, but leaving a familiar community is difficult. A fair account should respect each person's experience and avoid simple assumptions.",
          writing: "Viết bài giải thích nhiều nguyên nhân di chuyển và tác động lên con người.",
          project: "Xây bản đồ hành trình hư cấu, kèm quyết định, khó khăn và sự hỗ trợ.",
        },
        {
          title: "How do we stay safe?",
          vi: "Làm thế nào để giữ an toàn?",
          theme: "Sơ cứu và khẩn cấp",
          icon: "🩹",
          phonics: "Trọng âm emergency · paramedic",
          pattern: ["What should you do before helping?", "Protect yourself, check the danger and call an adult."],
          words:
            "elbow|khuỷu tay|💪;chin|cằm|🙂;ankle|mắt cá chân|🦶;myself|bản thân tôi|🧍;yourself|bản thân bạn|🧍;burn|vết bỏng|🔥;fall over|ngã|🤕;medicine|thuốc|💊;emergency|tình huống khẩn cấp|🚨;paramedic|nhân viên cấp cứu|🚑;teamwork|làm việc nhóm|🤝;first aid kit|túi sơ cứu|🩹;distress|tình trạng nguy cấp|🆘;attentive|chú ý|👀;survive|sống sót|💪;severe|nghiêm trọng|⚠️;heroic|dũng cảm|🏅;protect|bảo vệ|🛡️",
          grammarFocus: ["Đại từ phản thân", "before/after + V-ing", "Câu mệnh lệnh an toàn"],
          skills: ["Nhận diện vấn đề–giải pháp", "Dẫn chi tiết rõ ràng", "Dùng từ nối trình tự"],
          sample:
            "In an emergency, the first rule is to avoid creating another victim. Check for danger before helping and call an adult or emergency service. A trained paramedic uses equipment and teamwork, but children can still act responsibly by staying calm, giving accurate information and following instructions.",
          writing: "Viết quy trình phản ứng một tình huống khẩn cấp, nêu điều nên và không nên làm.",
          project: "Tạo mô phỏng gọi cấp cứu với vai, dữ kiện và bảng đánh giá độ chính xác.",
        },
        {
          title: "Why do we protect animals?",
          vi: "Tại sao chúng ta bảo vệ động vật?",
          theme: "Đa dạng sinh học",
          icon: "🦏",
          phonics: "Trọng âm biodiversity · captivity",
          pattern: ["How long has the species been threatened?", "It has been threatened for many years because its habitat has changed."],
          words:
            "Galapagos penguin|chim cánh cụt Galapagos|🐧;African wild dog|chó hoang châu Phi|🐕;Amur leopard|báo Amur|🐆;black rhino|tê giác đen|🦏;pangolin|tê tê|🦔;sea lion|sư tử biển|🦭;sanctuary|khu bảo tồn|🌿;species|loài|🐾;biodiversity|đa dạng sinh học|🌍;balance|sự cân bằng|⚖️;ecosystem|hệ sinh thái|🔄;extinct|tuyệt chủng|⌛;rare|quý hiếm|💎;captivity|tình trạng nuôi nhốt|🔒;release|thả về tự nhiên|🕊️;threat|mối đe dọa|⚠️;habitat|môi trường sống|🏞️;conservation|sự bảo tồn|🛡️",
          grammarFocus: ["Hiện tại hoàn thành với since/for", "such/such a", "Định lượng dữ liệu"],
          skills: ["Dự đoán dựa kiến thức", "Hiểu từ trong ngữ cảnh", "Viết thư theo đoạn"],
          sample:
            "Protecting one species can protect an entire ecosystem. A pangolin, penguin or rhino has a role in the balance of nature. Sanctuaries may care for animals in captivity, but release is only safe when habitats and threats are managed. Conservation also requires local knowledge and long-term measurement.",
          writing: "Viết thư kêu gọi hành động cho một loài, dùng dữ liệu và giải pháp.",
          project: "Xây kế hoạch bảo tồn gồm mục tiêu, chỉ số theo dõi và vai trò cộng đồng.",
        },
        {
          title: "What's literature?",
          vi: "Văn học là gì?",
          theme: "Thể loại và phân tích văn học",
          icon: "📚",
          phonics: "Trọng âm literature · metaphor",
          pattern: ["What makes this text literature?", "It uses character, plot and language to explore an idea."],
          words:
            "writer|người viết|✍️;blogger|người viết blog|💻;critic|nhà phê bình|📝;author|tác giả|📚;magazine|tạp chí|📰;article|bài báo|📄;blog|nhật ký mạng|🌐;novel|tiểu thuyết|📕;poetry|thơ ca|🪶;prose|văn xuôi|📖;short story|truyện ngắn|📘;fiction|hư cấu|🧚;publish|xuất bản|🖨️;character|nhân vật|🧍;plot|cốt truyện|🧩;narrator|người kể chuyện|🗣️;metaphor|ẩn dụ|🌉;simile|so sánh tu từ|⚖️",
          grammarFocus: ["feel like + V-ing", "V-ing làm chủ ngữ", "a little/a few"],
          skills: ["Suy luận quan điểm người nói", "Phân tích nhân vật bằng chi tiết", "Bảo vệ quan điểm"],
          sample:
            "Literature includes poetry, prose, novels and short stories, but the label is not only about length or format. Authors shape characters, plot and a narrator's voice to explore ideas. Metaphors and similes create connections. Readers and critics may disagree because interpretation requires both evidence and personal thought.",
          writing: "Viết bài nêu quan điểm: một văn bản có phải văn học hay không, dùng bằng chứng.",
          project: "Biên tập tạp chí văn học của lớp gồm truyện, thơ và bài phê bình.",
        },
        {
          title: "How do we communicate?",
          vi: "Chúng ta giao tiếp như thế nào?",
          theme: "Ngôn ngữ và biểu đạt",
          icon: "💬",
          phonics: "Trọng âm communicate · non-verbal",
          pattern: ["How might the message be misunderstood?", "The gesture might mean something different in another culture."],
          words:
            "friendly|thân thiện|😊;unfriendly|không thân thiện|😠;non-verbal|phi ngôn ngữ|🤟;verbal|bằng lời nói|🗣️;written|bằng chữ viết|✍️;face to face|trực tiếp|👥;imitate|bắt chước|🪞;convince|thuyết phục|✅;persuade|thuyết phục hành động|📣;collaborate|hợp tác|🤝;express|biểu đạt|🎭;conversation|cuộc trò chuyện|💬;gesture|cử chỉ|👋;behavior|hành vi|🧍;emotion|cảm xúc|❤️;misunderstanding|sự hiểu lầm|❓;awkward|ngượng ngùng|😳;represent|đại diện|🪧",
          grammarFocus: ["may/might", "Hiện tại hoàn thành already/yet", "Sequencers và chronology"],
          skills: ["Quét văn bản tìm tin", "Miêu tả bối cảnh chi tiết", "Tổ chức chuỗi sự kiện"],
          sample:
            "Communication can be verbal, written or non-verbal. A friendly gesture may support a message, but the same gesture might represent something different elsewhere. Good communicators watch for misunderstanding, ask respectful questions and change their explanation. Collaboration depends on listening as well as expressing ideas.",
          writing: "Viết câu chuyện về một hiểu lầm giao tiếp và cách nhân vật giải quyết.",
          project: "Thiết kế hướng dẫn giao tiếp liên văn hóa bằng ví dụ và cảnh báo.",
        },
        {
          title: "How are things made by hand?",
          vi: "Đồ vật được làm thủ công như thế nào?",
          theme: "Thủ công và quy trình",
          icon: "🛠️",
          phonics: "Âm /h/ trong hammer · /n/ trong needle",
          pattern: ["What is the object made of?", "It is made of wood and made by a local craftsperson."],
          words:
            "key|chìa khóa|🔑;pillow|gối|🛏️;vase|bình hoa|🏺;bookmark|thẻ đánh dấu sách|🔖;homemade|làm tại nhà|🏠;tidy|gọn gàng|✨;untidy|bừa bộn|🧹;screwdriver|tua vít|🪛;knife|dao|🔪;needle|kim|🪡;knitting needle|kim đan|🧶;hammer|búa|🔨;chisel|đục|🛠️;file|giũa|🔧;join|ghép|🔗;connect|kết nối|🔌;polish|đánh bóng|✨;craft|đồ thủ công|🎨",
          grammarFocus: ["be made of/made by", "Hiện tại đơn chỉ lịch tương lai", "also/as well/too"],
          skills: ["Nghe từ chỉ trình tự", "Đọc hướng dẫn minh họa", "So sánh cách xử lý chủ đề"],
          sample:
            "A handmade object carries evidence of its material, tools and maker. A wooden box may be cut with a saw, joined carefully and polished by hand. Machines can make many identical products quickly, while craft allows small differences. Neither method is automatically better; purpose and quality matter.",
          writing: "Viết hướng dẫn chi tiết làm một đồ vật an toàn, nêu vật liệu và công cụ.",
          project: "Tạo hoặc mô phỏng một sản phẩm thủ công rồi quay phần hướng dẫn.",
        },
        {
          title: "Why do we play sports?",
          vi: "Tại sao chúng ta chơi thể thao?",
          theme: "Thể thao và lợi ích",
          icon: "🏊",
          phonics: "Trọng âm triathlon · energizing",
          pattern: ["Have you ever tried an individual sport?", "Yes, I have tried yoga, but I have never tried hang gliding."],
          words:
            "climbing|leo núi|🧗;mountain biking|đạp xe địa hình|🚵;hang gliding|dù lượn|🪂;yoga|yoga|🧘;triathlon|ba môn phối hợp|🏊;scuba diving|lặn có bình khí|🤿;race|đua|🏁;fetch|nhặt/mang về|🎾;compete|thi đấu|🏆;relaxing|thư giãn|🌿;energizing|tiếp năng lượng|⚡;player|người chơi|🏅;partner|đồng đội|🤝;match|trận đấu|🎯;member|thành viên|🪪;benefit|lợi ích|➕;ascend|đi lên|⬆️;reduce|giảm|➖",
          grammarFocus: ["Hiện tại hoàn thành ever/never", "Hiện tại hoàn thành và quá khứ đơn", "Fact vs opinion"],
          skills: ["Tóm tắt phỏng vấn", "Phân biệt sự thật–quan điểm", "Dùng simile khi viết"],
          sample:
            "People play sports for health, challenge, friendship and enjoyment. Yoga can be relaxing, while a triathlon is physically demanding. News reports may describe a sport as the best exercise, but that is an opinion unless evidence supports it. The right activity depends on goals, safety and access.",
          writing: "Viết bài phân biệt sự thật và quan điểm về lợi ích của một môn thể thao.",
          project: "Thực hiện khảo sát thể thao, phân tích dữ liệu và trình bày kết luận.",
        },
        {
          title: "What's causing extreme weather?",
          vi: "Điều gì gây ra thời tiết cực đoan?",
          theme: "Khí hậu và thiên tai",
          icon: "🌪️",
          phonics: "Trọng âm hurricane · temperature",
          pattern: ["What happens when ocean water gets warmer?", "When water gets warmer, some storms can gain more energy."],
          words:
            "global warming|nóng lên toàn cầu|🌡️;hurricane|bão lớn|🌀;flood|lũ lụt|🌊;emergency|khẩn cấp|🚨;disaster|thảm họa|⚠️;drought|hạn hán|🏜️;tsunami|sóng thần|🌊;typhoon|bão nhiệt đới|🌀;blizzard|bão tuyết|🌨️;earthquake|động đất|📳;heatwave|đợt nắng nóng|🥵;power lines|đường dây điện|⚡;collapse|sụp đổ|🏚️;victim|nạn nhân|🆘;melt|tan chảy|🧊;annual|hằng năm|📅;typical|điển hình|📊;calculate|tính toán|🧮",
          grammarFocus: ["Câu điều kiện loại 0 với if/when", "Question tags", "Nguyên nhân và hậu quả"],
          skills: ["Nghe dự báo và định nghĩa", "Đoán từ qua ngữ cảnh", "Đồng ý/không đồng ý"],
          sample:
            "Extreme weather has several causes. Hurricanes form naturally, but warmer ocean water can provide more energy. Global warming also raises the risk of heatwaves and can change rainfall patterns, increasing drought or flood in some regions. Scientists calculate long-term trends instead of using one event as proof.",
          writing: "Viết bài nguyên nhân–hậu quả về một hiện tượng thời tiết cực đoan.",
          project: "Xây bản tin dự báo có dữ liệu, cảnh báo và hướng dẫn chuẩn bị.",
        },
        {
          title: "Why do we cook?",
          vi: "Tại sao chúng ta nấu ăn?",
          theme: "Nấu ăn và khoa học thực phẩm",
          icon: "🍳",
          phonics: "Âm /tʃ/ trong chop · /fr/ trong freeze",
          pattern: ["Why does the food need to be heated?", "It needs to be heated to change its texture and reduce harmful bacteria."],
          words:
            "frying pan|chảo rán|🍳;saucepan|nồi nhỏ|🥘;chopping board|thớt|🔪;chop|băm/cắt nhỏ|🔪;mix|trộn|🥣;boil|luộc/đun sôi|♨️;fry|rán|🍳;steam|hấp|💨;raw|sống/chưa nấu|🥩;bake|nướng lò|🥧;freeze|đông lạnh|🧊;taste|vị|👅;meal|bữa ăn|🍽️;harmful|có hại|⚠️;digest|tiêu hóa|🫃;edible|ăn được|✅;texture|kết cấu thức ăn|🧇;temperature|nhiệt độ|🌡️",
          grammarFocus: ["Tường thuật mệnh lệnh với tell/ask", "Động từ + to-infinitive", "Mô tả quy trình chi tiết"],
          skills: ["Nghe độc thoại dài", "So sánh truyện hai văn hóa", "Thể hiện quan tâm khi trao đổi"],
          sample:
            "Cooking can make food safer, easier to digest and more enjoyable. Heat changes texture and flavor, but each method has a different effect. Boiling vegetables for too long may reduce some nutrients, while steaming can protect them. Safe cooks also separate raw food and control temperature.",
          writing: "Viết hướng dẫn công thức có lý giải khoa học và cảnh báo an toàn.",
          project: "Thiết kế video nấu ăn không cần bếp thật, tập trung vào ngôn ngữ quy trình.",
        },
        {
          title: "How do we learn?",
          vi: "Chúng ta học như thế nào?",
          theme: "Kỹ năng học tập",
          icon: "🧠",
          phonics: "Trọng âm memorize · repetition · confident",
          pattern: ["What will happen if you practise regularly?", "If I practise regularly, I will remember more and become confident."],
          words:
            "keep trying|tiếp tục cố gắng|💪;prepare|chuẩn bị|🗂️;memorize|ghi nhớ|🧠;memory|trí nhớ|💭;stimulus|tác nhân kích thích|⚡;repetition|sự lặp lại|🔁;skill|kỹ năng|🛠️;ideas|ý tưởng|💡;summarize|tóm tắt|📝;present|trình bày|🎤;set goals|đặt mục tiêu|🎯;make a list|lập danh sách|📋;once|một lần|1️⃣;twice|hai lần|2️⃣;research|nghiên cứu|🔎;practice|luyện tập|🏋️;challenge|thử thách|🏁;confident|tự tin|⭐",
          grammarFocus: ["know that + mệnh đề", "Câu điều kiện loại 1", "Trích dẫn trực tiếp"],
          skills: ["Nhận ra người nghe kiểm tra hiểu", "Suy luận từ chi tiết", "Viết hồ sơ một người"],
          sample:
            "Learning is not the same as reading something once. Memory becomes stronger when learners retrieve information, practise over time and connect new ideas to old knowledge. Clear goals help students choose a strategy. If one method does not work, a confident learner changes the plan and keeps trying.",
          writing: "Viết hồ sơ học tập cá nhân gồm mục tiêu, chiến lược, bằng chứng và bước tiếp theo.",
          project: "Tạo kế hoạch học 14 ngày, theo dõi dữ liệu và trình bày điều chỉnh.",
        },
      ]
    ),
  };
})();
