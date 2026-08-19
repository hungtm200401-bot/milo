import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const g2u3Vocab = [
  {
    order: 1,
    term: "windy",
    ipa: "/ˈwɪn.di/",
    syllables: "win·dy",
    phonicsTip: "Âm /w/ chu tròn môi, /ɪ/ ngắn và âm /di/ nhẹ nhàng.",
    meaning: "có gió",
    exampleSentence: "It is very windy today, so we can fly a kite in the park.",
    exampleVi: "Hôm nay trời rất nhiều gió, vì vậy chúng mình có thể thả diều ở công viên.",
    appliedSentence2: "Remember to wear your jacket when it is cold and windy outside.",
    appliedVi2: "Hãy nhớ mặc áo khoác khi ngoài trời lạnh và có gió nhé.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_windy.png",
    flashcard: "assets/flashcards/grade2/g2_u3_windy.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_windy.png"
  },
  {
    order: 2,
    term: "foggy",
    ipa: "/ˈfɒɡ.i/",
    syllables: "fog·gy",
    phonicsTip: "Âm /f/ đặt răng trên lên môi dưới, /ɒ/ mở khẩu hình tròn.",
    meaning: "có sương mù",
    exampleSentence: "The morning is foggy, so the cars are driving slowly.",
    exampleVi: "Buổi sáng trời có nhiều sương mù nên các xe ô tô đi rất chậm.",
    appliedSentence2: "Be careful when you walk on the road on a foggy morning.",
    appliedVi2: "Hãy cẩn thận khi con đi trên đường vào một buổi sáng nhiều sương mù.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_foggy.png",
    flashcard: "assets/flashcards/grade2/g2_u3_foggy.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_foggy.png"
  },
  {
    order: 3,
    term: "thunder",
    ipa: "/ˈθʌn.dər/",
    syllables: "thun·der",
    phonicsTip: "Âm /θ/ đặt đầu lưỡi giữa hai hàm răng, thổi nhẹ luồng hơi.",
    meaning: "tiếng sấm",
    exampleSentence: "We hear loud thunder in the sky during the storm.",
    exampleVi: "Chúng mình nghe thấy tiếng sấm rất to trên bầu trời khi có bão.",
    appliedSentence2: "Do not be scared of thunder, Milo is right here with you!",
    appliedVi2: "Đừng sợ tiếng sấm nhé, có cô Milo ở bên cạnh con đây!",
    flashcard3D: "assets/flashcards/grade2/g2_u3_thunder.png",
    flashcard: "assets/flashcards/grade2/g2_u3_thunder.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_thunder.png"
  },
  {
    order: 4,
    term: "lightning",
    ipa: "/ˈlaɪt.nɪŋ/",
    syllables: "light·ning",
    phonicsTip: "Âm /laɪt/ phát âm nguyên âm đôi /aɪ/, kết thúc bằng đuôi /nɪŋ/.",
    meaning: "tia chớp",
    exampleSentence: "Bright lightning flashes across the dark sky.",
    exampleVi: "Tia chớp sáng rực loé lên trên bầu trời đêm tối.",
    appliedSentence2: "Stay inside your home safely when you see lightning.",
    appliedVi2: "Hãy ở trong nhà an toàn khi con nhìn thấy tia chớp nhé.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_lightning.png",
    flashcard: "assets/flashcards/grade2/g2_u3_lightning.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_lightning.png"
  },
  {
    order: 5,
    term: "storm",
    ipa: "/stɔːm/",
    syllables: "storm",
    phonicsTip: "Âm /st/ lướt nhanh, nguyên âm /ɔː/ kéo dài tròn môi.",
    meaning: "cơn bão",
    exampleSentence: "The heavy rain and strong wind make a big storm.",
    exampleVi: "Mưa to và gió lớn tạo thành một cơn bão to.",
    appliedSentence2: "We stay warm inside with our family during the storm.",
    appliedVi2: "Chúng mình ở trong nhà ấm áp cùng gia đình khi bão về.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_storm.png",
    flashcard: "assets/flashcards/grade2/g2_u3_storm.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_storm.png"
  },
  {
    order: 6,
    term: "hail",
    ipa: "/heɪl/",
    syllables: "hail",
    phonicsTip: "Bắt đầu bằng âm /h/ bật hơi nhẹ, kết thúc bằng /eɪl/.",
    meaning: "mưa đá",
    exampleSentence: "Small ice balls fall from the sky during the hail.",
    exampleVi: "Những viên đá nhỏ rơi từ trên trời xuống trong cơn mưa đá.",
    appliedSentence2: "Everyone rushes indoors to stay safe from the hail.",
    appliedVi2: "Mọi người nhanh chóng chạy vào nhà để tránh mưa đá an toàn.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_hail.png",
    flashcard: "assets/flashcards/grade2/g2_u3_hail.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_hail.png"
  },
  {
    order: 7,
    term: "sleet",
    ipa: "/sliːt/",
    syllables: "sleet",
    phonicsTip: "Âm /sl/ lướt nhẹ, nguyên âm /iː/ kéo dài tươi cười.",
    meaning: "mưa tuyết",
    exampleSentence: "Sleet is a mix of cold rain and soft snow.",
    exampleVi: "Mưa tuyết là sự hòa trộn giữa mưa lạnh và tuyết mềm.",
    appliedSentence2: "Put on your warm boots and gloves when there is sleet.",
    appliedVi2: "Hãy đi ủng ấm và đeo găng tay khi ngoài trời có mưa tuyết nhé.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_sleet.png",
    flashcard: "assets/flashcards/grade2/g2_u3_sleet.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_sleet.png"
  },
  {
    order: 8,
    term: "tornado",
    ipa: "/tɔːˈneɪ.dəʊ/",
    syllables: "tor·na·do",
    phonicsTip: "Nhấn trọng âm vào âm tiết thứ 2: tor-NA-do.",
    meaning: "lốc xoáy",
    exampleSentence: "A tornado is a very strong spinning column of wind.",
    exampleVi: "Lốc xoáy là một cột gió xoáy chuyển động cực kỳ mạnh mẽ.",
    appliedSentence2: "The weather forecast warns people when a tornado comes.",
    appliedVi2: "Dự báo thời tiết cảnh báo mọi người khi có lốc xoáy đến.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_tornado.png",
    flashcard: "assets/flashcards/grade2/g2_u3_tornado.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_tornado.png"
  },
  {
    order: 9,
    term: "scarf",
    ipa: "/skɑːf/",
    syllables: "scarf",
    phonicsTip: "Bật tổ hợp âm /sk/, nguyên âm /ɑː/ trầm sâu.",
    meaning: "khăn quàng cổ",
    exampleSentence: "I wear a red wool scarf around my neck in winter.",
    exampleVi: "Tôi quàng một chiếc khăn len đỏ quanh cổ vào mùa đông.",
    appliedSentence2: "A warm scarf keeps you healthy on cold snowy days.",
    appliedVi2: "Một chiếc khăn ấm sẽ giúp con giữ gìn sức khỏe trong ngày tuyết lạnh.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_scarf.png",
    flashcard: "assets/flashcards/grade2/g2_u3_scarf.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_scarf.png"
  },
  {
    order: 10,
    term: "cap",
    ipa: "/kæp/",
    syllables: "cap",
    phonicsTip: "Bật âm /k/ mạnh ở đầu, /æ/ mở rộng khẩu hình miệng.",
    meaning: "mũ lưỡi trai",
    exampleSentence: "He wears a blue baseball cap to block the bright sunlight.",
    exampleVi: "Cậu ấy đội chiếc mũ lưỡi trai xanh để che ánh nắng chói chang.",
    appliedSentence2: "Always wear your cap when you go out to play sports.",
    appliedVi2: "Luôn đội mũ lưỡi trai khi con ra ngoài chơi thể thao nhé.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_cap.png",
    flashcard: "assets/flashcards/grade2/g2_u3_cap.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_cap.png"
  },
  {
    order: 11,
    term: "sunglasses",
    ipa: "/ˈsʌŋˌɡlɑː.sɪz/",
    syllables: "sun·glas·ses",
    phonicsTip: "Nhấn trọng âm 1: SUN-glas-ses. Đuôi /sɪz/ phát âm rõ.",
    meaning: "kính râm",
    exampleSentence: "Mom wears sunglasses to protect her eyes at the beach.",
    exampleVi: "Mẹ đeo kính râm để bảo vệ đôi mắt khi ở bãi biển.",
    appliedSentence2: "Cool sunglasses make you look smart on sunny summer days.",
    appliedVi2: "Kính râm sành điệu giúp con trông thật bảnh vào ngày hè đầy nắng.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_sunglasses.png",
    flashcard: "assets/flashcards/grade2/g2_u3_sunglasses.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_sunglasses.png"
  },
  {
    order: 12,
    term: "sweat suit",
    ipa: "/ˈswet ˌsuːt/",
    syllables: "sweat suit",
    phonicsTip: "Âm /sw/ lướt êm, /et/ dứt khoát; /suːt/ nguyên âm /uː/ dài.",
    meaning: "bộ đồ thể thao nỉ",
    exampleSentence: "I put on my comfortable sweat suit for morning exercise.",
    exampleVi: "Tôi mặc bộ đồ thể thao nỉ thoải mái để tập thể dục buổi sáng.",
    appliedSentence2: "A soft sweat suit is perfect for running around at recess.",
    appliedVi2: "Bộ đồ thể thao nỉ mềm mại rất tuyệt khi chạy nhảy trong giờ ra chơi.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_sweat_suit.png",
    flashcard: "assets/flashcards/grade2/g2_u3_sweat_suit.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_sweat_suit.png"
  },
  {
    order: 13,
    term: "sneakers",
    ipa: "/ˈsniː.kəz/",
    syllables: "snea·kers",
    phonicsTip: "Âm /sn/ nối liền, nguyên âm /iː/ kéo dài và đuôi /kəz/.",
    meaning: "giày thể thao",
    exampleSentence: "I lace up my new sneakers and run fast on the playground.",
    exampleVi: "Tôi buộc dây đôi giày thể thao mới và chạy thật nhanh trên sân chơi.",
    appliedSentence2: "Good sneakers protect your feet when you jump and play.",
    appliedVi2: "Một đôi giày thể thao tốt sẽ bảo vệ đôi chân khi con nhảy và chơi đùa.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_sneakers.png",
    flashcard: "assets/flashcards/grade2/g2_u3_sneakers.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_sneakers.png"
  },
  {
    order: 14,
    term: "flip flops",
    ipa: "/ˈflɪp.flɒps/",
    syllables: "flip-flops",
    phonicsTip: "Nhịp điệu vui tươi /flɪp/ rồi /flɒps/, bật rõ âm /p/ và /s/.",
    meaning: "dép tông",
    exampleSentence: "We wear colorful flip flops when walking on the warm sand.",
    exampleVi: "Chúng mình đi đôi dép tông rực rỡ khi đi dạo trên cát ấm.",
    appliedSentence2: "Flip flops are light, airy and easy to slip on at the pool.",
    appliedVi2: "Dép tông rất nhẹ, thoáng khí và dễ xỏ vào khi đi bể bơi.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_flip_flops.png",
    flashcard: "assets/flashcards/grade2/g2_u3_flip_flops.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_flip_flops.png"
  },
  {
    order: 15,
    term: "robe",
    ipa: "/rəʊb/",
    syllables: "robe",
    phonicsTip: "Âm /r/ uốn nhẹ đầu lưỡi, nguyên âm đôi /əʊ/ rồi khép môi /b/.",
    meaning: "áo choàng tắm",
    exampleSentence: "After taking a warm bath, she wears a cozy white robe.",
    exampleVi: "Sau khi tắm nước ấm, bạn ấy mặc chiếc áo choàng tắm màu trắng ấm áp.",
    appliedSentence2: "A soft robe keeps you cozy before getting dressed for bed.",
    appliedVi2: "Chiếc áo choàng mềm mại giúp con ấm áp trước khi đi ngủ.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_robe.png",
    flashcard: "assets/flashcards/grade2/g2_u3_robe.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_robe.png"
  },
  {
    order: 16,
    term: "slippers",
    ipa: "/ˈslɪp.əz/",
    syllables: "slip·pers",
    phonicsTip: "Âm /sl/ nhẹ nhàng, trọng âm rơi vào SLIP-pers.",
    meaning: "dép đi trong nhà",
    exampleSentence: "I keep my feet warm by wearing soft bunny slippers at home.",
    exampleVi: "Tôi giữ ấm đôi chân bằng cách đi đôi dép thỏ mềm mại trong nhà.",
    appliedSentence2: "Leave your outdoor shoes at the door and put on slippers.",
    appliedVi2: "Hãy để giày đi ngoài đường ở cửa và xỏ dép đi trong nhà nhé.",
    flashcard3D: "assets/flashcards/grade2/g2_u3_slippers.png",
    flashcard: "assets/flashcards/grade2/g2_u3_slippers.png",
    realCutPng: "assets/flashcards/grade2/g2_u3_slippers.png"
  }
];

const g3u10Vocab = [
  {
    order: 1,
    term: "stomach",
    ipa: "/ˈstʌm.ək/",
    syllables: "stom·ach",
    phonicsTip: "Đuôi 'ch' phát âm là /k/, trọng âm rơi vào âm 1: STOM-ach.",
    meaning: "dạ dày, bụng",
    exampleSentence: "Food goes down into your stomach where it is digested.",
    exampleVi: "Thức ăn đi xuống dạ dày của bạn, nơi nó được tiêu hóa.",
    appliedSentence2: "Eat slowly and chew well to keep your stomach healthy.",
    appliedVi2: "Hãy ăn chậm và nhai kỹ để giữ cho dạ dày luôn khỏe mạnh nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_stomach.png",
    flashcard: "assets/flashcards/grade3/g3_u10_stomach.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_stomach.png"
  },
  {
    order: 2,
    term: "back",
    ipa: "/bæk/",
    syllables: "back",
    phonicsTip: "Âm /b/ bật nhẹ, /æ/ mở rộng khẩu hình, kết thúc /k/.",
    meaning: "lưng",
    exampleSentence: "Sit up straight to keep your back strong and healthy.",
    exampleVi: "Hãy ngồi thẳng lưng để giữ cho tấm lưng luôn chắc khỏe.",
    appliedSentence2: "Do not carry a schoolbag that is too heavy for your back.",
    appliedVi2: "Đừng mang chiếc cặp sách quá nặng đè lên lưng con nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_back.png",
    flashcard: "assets/flashcards/grade3/g3_u10_back.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_back.png"
  },
  {
    order: 3,
    term: "neck",
    ipa: "/nek/",
    syllables: "neck",
    phonicsTip: "Âm /e/ ngắn dứt khoát, kết thúc bằng âm bật /k/.",
    meaning: "cổ",
    exampleSentence: "Giraffes have a very long neck to reach tall tree leaves.",
    exampleVi: "Hươu cao cổ có chiếc cổ rất dài để vươn tới lá cây trên cao.",
    appliedSentence2: "Gently stretch your neck when doing morning exercises.",
    appliedVi2: "Hãy nhẹ nhàng xoay cổ khi tập thể dục buổi sáng nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_neck.png",
    flashcard: "assets/flashcards/grade3/g3_u10_neck.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_neck.png"
  },
  {
    order: 4,
    term: "shoulder",
    ipa: "/ˈʃəʊl.dər/",
    syllables: "shoul·der",
    phonicsTip: "Âm /ʃ/ tròn môi bật hơi, nhấn trọng âm 1: SHOUL-der.",
    meaning: "vai",
    exampleSentence: "He carried his little brother on his strong shoulders.",
    exampleVi: "Anh ấy cõng em trai nhỏ trên đôi vai vững chắc của mình.",
    appliedSentence2: "Roll your shoulders backward to relax after studying.",
    appliedVi2: "Hãy xoay vai ra sau để thư giãn sau giờ học tập nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_shoulder.png",
    flashcard: "assets/flashcards/grade3/g3_u10_shoulder.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_shoulder.png"
  },
  {
    order: 5,
    term: "fever",
    ipa: "/ˈfiː.vər/",
    syllables: "fe·ver",
    phonicsTip: "Nguyên âm /iː/ kéo dài, âm /v/ rung răng môi, nhấn FEE-ver.",
    meaning: "sốt",
    exampleSentence: "When you have a fever, your forehead feels very hot.",
    exampleVi: "Khi con bị sốt, trán của con sẽ cảm thấy rất nóng.",
    appliedSentence2: "Drink plenty of warm water and rest well if you get a fever.",
    appliedVi2: "Hãy uống nhiều nước ấm và nghỉ ngơi thật tốt nếu bị sốt nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_fever.png",
    flashcard: "assets/flashcards/grade3/g3_u10_fever.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_fever.png"
  },
  {
    order: 6,
    term: "bandage",
    ipa: "/ˈbæn.dɪdʒ/",
    syllables: "ban·dage",
    phonicsTip: "Trọng âm 1: BAN-dage, âm cuối là /dʒ/ bật rung.",
    meaning: "băng gạc",
    exampleSentence: "The doctor put a clean bandage on the small scrape on my knee.",
    exampleVi: "Bác sĩ dán một miếng băng gạc sạch lên vết trầy nhỏ ở đầu gối tôi.",
    appliedSentence2: "Keep a bandage in your first-aid kit for small cuts.",
    appliedVi2: "Hãy luôn để sẵn băng gạc trong hộp sơ cứu cho các vết xước nhỏ.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_bandage.png",
    flashcard: "assets/flashcards/grade3/g3_u10_bandage.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_bandage.png"
  },
  {
    order: 7,
    term: "take medicine",
    ipa: "/teɪk ˈmed.sən/",
    syllables: "take med·i·cine",
    phonicsTip: "Âm /teɪk/ rõ ràng, 'medicine' đọc nhẹ 2 hoặc 3 âm: MED-sən.",
    meaning: "uống thuốc",
    exampleSentence: "You should take medicine on time as the doctor instructed.",
    exampleVi: "Con nên uống thuốc đúng giờ theo đúng hướng dẫn của bác sĩ.",
    appliedSentence2: "Always ask an adult to help you take the right medicine.",
    appliedVi2: "Luôn nhờ người lớn giúp con uống đúng liều lượng thuốc nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_take_medicine.png",
    flashcard: "assets/flashcards/grade3/g3_u10_take_medicine.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_take_medicine.png"
  },
  {
    order: 8,
    term: "rest",
    ipa: "/rest/",
    syllables: "rest",
    phonicsTip: "Âm /r/ uốn lưỡi, /e/ ngắn, kết thúc bằng cụm /st/.",
    meaning: "nghỉ ngơi",
    exampleSentence: "Our body needs a good night's rest to grow big and strong.",
    exampleVi: "Cơ thể chúng ta cần nghỉ ngơi đủ giấc vào ban đêm để lớn nhanh và khỏe mạnh.",
    appliedSentence2: "Take a short rest after running around under the warm sun.",
    appliedVi2: "Hãy nghỉ ngơi một chút sau khi chạy nhảy dưới trời nắng ấm nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_rest.png",
    flashcard: "assets/flashcards/grade3/g3_u10_rest.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_rest.png"
  },
  {
    order: 9,
    term: "pale",
    ipa: "/peɪl/",
    syllables: "pale",
    phonicsTip: "Bật âm /p/ rõ ràng, nguyên âm đôi /eɪ/ trượt sang /l/.",
    meaning: "tái nhợt, xanh xao",
    exampleSentence: "His face looked a little pale when he felt sick this morning.",
    exampleVi: "Khuôn mặt cậu ấy trông hơi tái nhợt khi cảm thấy không khỏe sáng nay.",
    appliedSentence2: "Eating fresh fruits and vegetables gives your cheeks a healthy pink color.",
    appliedVi2: "Ăn trái cây tươi và rau xanh giúp má con luôn hồng hào rạng rỡ.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_pale.png",
    flashcard: "assets/flashcards/grade3/g3_u10_pale.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_pale.png"
  },
  {
    order: 10,
    term: "sick",
    ipa: "/sɪk/",
    syllables: "sick",
    phonicsTip: "Âm /s/ xì nhẹ, /ɪ/ ngắn và bật /k/ dứt khoát.",
    meaning: "bị ốm, bệnh",
    exampleSentence: "I stayed home from school today because I felt sick.",
    exampleVi: "Hôm nay tôi ở nhà nghỉ học vì cảm thấy bị ốm.",
    appliedSentence2: "Wash your hands with soap before eating so you do not get sick.",
    appliedVi2: "Rửa tay bằng xà phòng trước khi ăn để không bị ốm nhé con.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_sick.png",
    flashcard: "assets/flashcards/grade3/g3_u10_sick.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_sick.png"
  },
  {
    order: 11,
    term: "muscles",
    ipa: "/ˈmʌs.əlz/",
    syllables: "mus·cles",
    phonicsTip: "Chữ 'c' câm, phát âm là /ˈmʌs.əlz/, nhấn trọng âm 1.",
    meaning: "cơ bắp",
    exampleSentence: "Strong muscles help you run, jump and lift heavy objects.",
    exampleVi: "Cơ bắp khỏe mạnh giúp con chạy, nhảy và nâng các vật nặng.",
    appliedSentence2: "Exercising every day makes your arm and leg muscles stronger.",
    appliedVi2: "Tập thể dục mỗi ngày giúp cơ tay và cơ chân của con săn chắc hơn.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_muscles.png",
    flashcard: "assets/flashcards/grade3/g3_u10_muscles.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_muscles.png"
  },
  {
    order: 12,
    term: "skin",
    ipa: "/skɪn/",
    syllables: "skin",
    phonicsTip: "Tổ hợp âm /sk/ mượt mà, nguyên âm /ɪ/ ngắn và âm mũi /n/.",
    meaning: "làn da",
    exampleSentence: "Our skin covers and protects our whole body from germs.",
    exampleVi: "Làn da bao bọc và bảo vệ toàn bộ cơ thể chúng ta khỏi vi khuẩn.",
    appliedSentence2: "Keep your skin clean and apply sunscreen when going to the beach.",
    appliedVi2: "Giữ da luôn sạch sẽ và thoa kem chống nắng khi đi biển nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_skin.png",
    flashcard: "assets/flashcards/grade3/g3_u10_skin.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_skin.png"
  },
  {
    order: 13,
    term: "brain",
    ipa: "/breɪn/",
    syllables: "brain",
    phonicsTip: "Âm /br/ nối liền, nguyên âm đôi /eɪ/ vang và âm cuối /n/.",
    meaning: "bộ não",
    exampleSentence: "The human brain controls everything we think, feel and do.",
    exampleVi: "Bộ não con người điều khiển mọi suy nghĩ, cảm xúc và hành động của chúng ta.",
    appliedSentence2: "Reading books and solving fun puzzles help exercise your brain.",
    appliedVi2: "Đọc sách và giải câu đố vui giúp rèn luyện bộ não thông minh.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_brain.png",
    flashcard: "assets/flashcards/grade3/g3_u10_brain.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_brain.png"
  },
  {
    order: 14,
    term: "heart",
    ipa: "/hɑːt/",
    syllables: "heart",
    phonicsTip: "Âm /h/ thở nhẹ, nguyên âm dài /ɑː/ trầm sâu và kết thúc /t/.",
    meaning: "trái tim",
    exampleSentence: "Your heart beats fast when you run a race with friends.",
    exampleVi: "Trái tim của con đập nhanh khi con chạy thi cùng các bạn.",
    appliedSentence2: "Eating healthy food and playing sports keep your heart strong.",
    appliedVi2: "Ăn thực phẩm lành mạnh và chơi thể thao giúp trái tim luôn khỏe mạnh.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_heart.png",
    flashcard: "assets/flashcards/grade3/g3_u10_heart.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_heart.png"
  },
  {
    order: 15,
    term: "cold",
    ipa: "/kəʊld/",
    syllables: "cold",
    phonicsTip: "Bắt đầu bằng /k/, nguyên âm đôi /əʊ/ rồi /ld/.",
    meaning: "cảm lạnh",
    exampleSentence: "He caught a common cold and needed a warm cup of tea.",
    exampleVi: "Cậu ấy bị cảm lạnh thông thường và cần uống một tách trà ấm.",
    appliedSentence2: "Cover your mouth with a tissue when you have a cold.",
    appliedVi2: "Hãy che miệng bằng khăn giấy khi con bị cảm lạnh nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_cold.png",
    flashcard: "assets/flashcards/grade3/g3_u10_cold.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_cold.png"
  },
  {
    order: 16,
    term: "cough",
    ipa: "/kɒf/",
    syllables: "cough",
    phonicsTip: "Đuôi 'gh' phát âm là /f/, nguyên âm /ɒ/ ngắn.",
    meaning: "ho",
    exampleSentence: "She had a dry cough, so mom gave her some honey water.",
    exampleVi: "Bạn ấy bị ho khan nên mẹ đã cho bạn ấy uống một chút nước mật ong.",
    appliedSentence2: "Cough into your elbow so you do not spread germs to friends.",
    appliedVi2: "Hãy ho vào khuỷu tay để không làm lây lan vi khuẩn cho bạn bè nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_cough.png",
    flashcard: "assets/flashcards/grade3/g3_u10_cough.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_cough.png"
  },
  {
    order: 17,
    term: "sneeze",
    ipa: "/sniːz/",
    syllables: "sneeze",
    phonicsTip: "Âm /sn/ mượt, nguyên âm /iː/ kéo dài và âm cuối /z/ rung nhẹ.",
    meaning: "hắt hơi",
    exampleSentence: "Pepper and dust can make you sneeze suddenly: Achoo!",
    exampleVi: "Hạt tiêu và bụi bẩn có thể khiến con hắt hơi bất ngờ: Hắt xì!",
    appliedSentence2: "Say 'Bless you!' politely when someone around you sneezes.",
    appliedVi2: "Hãy nói 'Bless you!' thật lịch sự khi ai đó xung quanh hắt hơi nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_sneeze.png",
    flashcard: "assets/flashcards/grade3/g3_u10_sneeze.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_sneeze.png"
  },
  {
    order: 18,
    term: "vaccination",
    ipa: "/ˌvæk.sɪˈneɪ.ʃən/",
    syllables: "vac·ci·na·tion",
    phonicsTip: "Từ 4 âm tiết, trọng âm chính rơi vào /neɪ/: vac-ci-NA-tion.",
    meaning: "tiêm phòng, tiêm vắc-xin",
    exampleSentence: "A vaccination helps your body fight off dangerous diseases.",
    exampleVi: "Tiêm phòng giúp cơ thể con chống lại các căn bệnh nguy hiểm.",
    appliedSentence2: "Be brave when getting a vaccination, it protects your health!",
    appliedVi2: "Hãy dũng cảm khi đi tiêm phòng nhé, mũi tiêm sẽ bảo vệ sức khỏe của con!",
    flashcard3D: "assets/flashcards/grade3/g3_u10_vaccination.png",
    flashcard: "assets/flashcards/grade3/g3_u10_vaccination.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_vaccination.png"
  },
  {
    order: 19,
    term: "spread",
    ipa: "/spred/",
    syllables: "spread",
    phonicsTip: "Tổ hợp âm /spr/ liền mạch, nguyên âm /e/ ngắn dứt khoát.",
    meaning: "lây lan, truyền lan",
    exampleSentence: "Washing hands stops viruses from being able to spread.",
    exampleVi: "Rửa tay sạch sẽ giúp ngăn chặn virus không thể lây lan.",
    appliedSentence2: "Always cover your nose and mouth so germs do not spread.",
    appliedVi2: "Luôn che mũi và miệng để vi khuẩn không lây lan ra xung quanh nhé.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_spread.png",
    flashcard: "assets/flashcards/grade3/g3_u10_spread.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_spread.png"
  },
  {
    order: 20,
    term: "save your life",
    ipa: "/seɪv jɔːr laɪf/",
    syllables: "save your life",
    phonicsTip: "Âm /seɪv/ kết thúc /v/, /jɔːr/ êm ái, /laɪf/ bật /f/.",
    meaning: "cứu sống bạn",
    exampleSentence: "Doctors and nurses work hard every day to save your life.",
    exampleVi: "Các bác sĩ và y tá làm việc chăm chỉ mỗi ngày để cứu sống mọi người.",
    appliedSentence2: "Wearing a bicycle helmet can protect your head and save your life.",
    appliedVi2: "Đội mũ bảo hiểm khi đi xe đạp có thể bảo vệ đầu và cứu mạng con đấy.",
    flashcard3D: "assets/flashcards/grade3/g3_u10_save_your_life.png",
    flashcard: "assets/flashcards/grade3/g3_u10_save_your_life.png",
    realCutPng: "assets/flashcards/grade3/g3_u10_save_your_life.png"
  }
];

const filesToUpdate = [
  "src/data/CHUONG_TRINH_TOAN_DIEN_24_UNIT_LOP_2_VA_LOP_3.json",
  "src/data/GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json"
];

for (const filePath of filesToUpdate) {
  if (!existsSync(filePath)) continue;
  console.log(`Updating ${filePath}...`);
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  
  if (Array.isArray(data.grade2) && data.grade2[2]) {
    data.grade2[2].vocabulary = g2u3Vocab;
  }
  if (Array.isArray(data.grade3) && data.grade3[9]) {
    data.grade3[9].vocabulary = g3u10Vocab;
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✓ Saved ${filePath}`);
}

// Update TONG_HOP_TAT_CA_TU_MOI_LOP_2_VA_LOP_3_436_TU.json if needed
const tongHopPath = "src/data/TONG_HOP_TAT_CA_TU_MOI_LOP_2_VA_LOP_3_436_TU.json";
if (existsSync(tongHopPath)) {
  console.log(`Updating ${tongHopPath}...`);
  const data = JSON.parse(readFileSync(tongHopPath, "utf8"));
  if (Array.isArray(data.units)) {
    const u3 = data.units.find(u => Number(u.grade) === 2 && Number(u.unit) === 3);
    if (u3 && Array.isArray(u3.vocabulary)) {
      u3.vocabulary = g2u3Vocab;
    }
    const u10 = data.units.find(u => Number(u.grade) === 3 && Number(u.unit) === 10);
    if (u10 && Array.isArray(u10.vocabulary)) {
      u10.vocabulary = g3u10Vocab;
    }
  }
  if (Array.isArray(data.allWords)) {
    for (const w of data.allWords) {
      if (Number(w.grade) === 2 && Number(w.unit) === 3) {
        const match = g2u3Vocab.find(item => item.term.toLowerCase() === w.term.toLowerCase());
        if (match) Object.assign(w, match);
      } else if (Number(w.grade) === 3 && Number(w.unit) === 10) {
        const match = g3u10Vocab.find(item => item.term.toLowerCase() === w.term.toLowerCase());
        if (match) Object.assign(w, match);
      }
    }
  }
  writeFileSync(tongHopPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✓ Saved ${tongHopPath}`);
}

console.log("ALL FILES UPDATED SUCCESSFULLY!");
