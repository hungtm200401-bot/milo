(function () {
  const pools = {
    2: [
      ["listen","lắng nghe","👂","Listen to Milo.","Listen and point."],
      ["repeat","nhắc lại","🔁","Listen and repeat.","Repeat the word, please."],
      ["point","chỉ vào","👉","Point to the picture.","Point and say the word."],
      ["choose","lựa chọn","🎯","Choose the correct answer.","Choose one picture."],
      ["look","nhìn","👀","Look at the board.","Look at this picture."],
      ["say","nói","💬","Say the word clearly.","Listen, point and say."],
      ["ask","hỏi","❓","Ask Milo a question.","Ask your friend."],
      ["answer","trả lời","💡","Answer the question.","I can answer in English."],
      ["draw","vẽ","🎨","Draw a small picture.","Draw and colour it."],
      ["match","nối/ghép","🧩","Match the word and picture.","Match the two cards."],
      ["read","đọc","📖","Read the sentence.","Read with Milo."],
      ["write","viết","✍️","Write the new word.","Write one short sentence."],
      ["please","vui lòng","🌷","Please open your book.","Sit down, please."],
      ["thank you","cảm ơn","💝","Thank you, Milo.","Thank you for your help."],
      ["together","cùng nhau","🫶","Let us learn together.","We play together."],
      ["again","lại/lần nữa","🌟","Say it again, please.","Let us try again."]
    ],
    3: [
      ["describe","miêu tả","🖼️","Describe the picture.","I can describe my friend."],
      ["compare","so sánh","⚖️","Compare the two pictures.","Let us compare the answers."],
      ["because","bởi vì","🔗","I smile because I am happy.","I practise because English is fun."],
      ["favourite","yêu thích","⭐","Blue is my favourite colour.","What is your favourite game?"],
      ["first","đầu tiên","1️⃣","First, listen to Milo.","First, read the question."],
      ["next","tiếp theo","2️⃣","Next, choose a card.","What happens next?"],
      ["then","sau đó","➡️","Then, say the sentence.","Read and then answer."],
      ["finally","cuối cùng","🏁","Finally, check your work.","Finally, we play a game."],
      ["different","khác nhau","🔀","The two pictures are different.","We have different hobbies."],
      ["same","giống nhau","🟰","We are in the same class.","Choose the same picture."],
      ["usually","thường","📅","I usually read after school.","We usually learn together."],
      ["sometimes","thỉnh thoảng","🎲","I sometimes play chess.","Sometimes I study with Milo."],
      ["carefully","cẩn thận","🔎","Listen carefully.","Read the question carefully."],
      ["clearly","rõ ràng","📣","Speak clearly, please.","Say the word clearly."],
      ["example","ví dụ","💡","Read the example.","Give one example."],
      ["practise","luyện tập","🎯","Practise every day.","I practise speaking English."]
    ],
    4: [
      ["explain","giải thích","🧠","Explain your answer.","Can you explain the rule?"],
      ["information","thông tin","🗂️","Find the information in the text.","This chart gives useful information."],
      ["opinion","ý kiến","💭","Tell me your opinion.","In my opinion, the game is fun."],
      ["reason","lý do","🔍","Give one reason.","What is the reason?"],
      ["before","trước khi","⏮️","Wash your hands before lunch.","Read the title before listening."],
      ["after","sau khi","⏭️","I play after school.","Check your work after writing."],
      ["often","thường xuyên","🔄","I often practise English.","How often do you read?"],
      ["never","không bao giờ","🚫","I never go to school late.","Never cross a red light."],
      ["important","quan trọng","❗","Sleep is important for children.","Underline the important words."],
      ["useful","hữu ích","🧰","This dictionary is useful.","English is useful for travel."],
      ["similar","tương tự","🔁","The two answers are similar.","Find a similar word."],
      ["correct","đúng/chính xác","✅","Choose the correct sentence.","Your answer is correct."],
      ["sentence","câu","📝","Write a complete sentence.","Read the sentence aloud."],
      ["paragraph","đoạn văn","📄","Read the short paragraph.","My paragraph has four sentences."],
      ["question","câu hỏi","❓","Answer the question.","Write one question for Milo."],
      ["review","ôn tập","🔄","Review the new words.","I review English every evening."]
    ],
    5: [
      ["although","mặc dù","🌦️","Although it is rainy, we are happy.","Although the task is hard, I will try."],
      ["therefore","vì vậy","➡️","It is late; therefore, we should go home.","I practised; therefore, I felt confident."],
      ["however","tuy nhiên","↔️","The test is hard; however, I can do it.","It is small; however, it is useful."],
      ["instead","thay vào đó","🔄","Walk instead of taking the car.","I read a book instead."],
      ["environment","môi trường","🌍","We should protect the environment.","A clean environment is healthy."],
      ["future","tương lai","🚀","What will you do in the future?","I want a green future."],
      ["solution","giải pháp","🧩","We need a good solution.","Discuss the best solution."],
      ["result","kết quả","🏆","Check your test result.","Hard work brings a good result."],
      ["advantage","lợi ích/ưu điểm","📈","One advantage is saving time.","What is the main advantage?"],
      ["challenge","thử thách","⛰️","This game is a fun challenge.","I am ready for the challenge."],
      ["confident","tự tin","🦸","I feel confident when I speak.","Practise to become more confident."],
      ["responsible","có trách nhiệm","🛡️","We are responsible for our work.","A responsible student checks carefully."],
      ["summarise","tóm tắt","📌","Summarise the paragraph.","Can you summarise the story?"],
      ["predict","dự đoán","🔮","Predict what happens next.","Look at the picture and predict."],
      ["evidence","bằng chứng","🔎","Find evidence in the text.","Use one sentence as evidence."],
      ["improve","cải thiện","📈","Practice helps me improve.","How can we improve our school?"]
    ]
  };

  Object.keys(pools).forEach(function (gradeKey) {
    const grade = Number(gradeKey);
    const targets = { 2: 12, 3: 18, 4: 22, 5: 26 };
    const units = window.MILO_CURRICULUM && window.MILO_CURRICULUM[grade]
      ? window.MILO_CURRICULUM[grade].units
      : [];
    units.forEach(function (unit, unitIndex) {
      const known = new Set(unit.words.map(function (word) { return word[0].toLowerCase(); }));
      const pool = [
        ...(pools[grade] || pools[3]),
        ...(pools[Math.max(2, grade - 1)] || [])
      ];
      let cursor = (unitIndex * 4) % pool.length;
      const stop = cursor + pool.length;
      while (unit.words.length < targets[grade] && cursor < stop) {
        const candidate = pool[cursor % pool.length];
        if (!known.has(candidate[0].toLowerCase())) {
          unit.words.push(candidate.slice());
          known.add(candidate[0].toLowerCase());
        }
        cursor += 1;
      }
    });
  });
})();
