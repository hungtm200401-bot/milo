import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";

const root = process.cwd();
const srcDir = join(root, "assets", "anhmoi_extracted", "Lop_3_Dot_1_2_CAT_SIEU_NET_VIP_PRO_MAX_ALL", "Dot_1_Unit_1_6", "Lop_3_Unit_3_20_anh_CAT_SIEU_NET");
const destDir = join(root, "assets", "flashcards", "grade3");

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

const g3u3Data = [
  {
    file: "01_campsite.png",
    term: "campsite",
    meaning: "địa điểm cắm trại",
    ipa: "/ˈkæmp.saɪt/",
    phoneticTip: "Âm /æ/ mở rộng miệng, đọc dứt khoát /kæmp/, bật nhẹ đuôi /saɪt/.",
    exampleSentence: "We pitched our tent at a lovely campsite near the lake.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_campsite.png"
  },
  {
    file: "02_blanket.png",
    term: "blanket",
    meaning: "cái chăn ấm",
    ipa: "/ˈblæŋ.kɪt/",
    phoneticTip: "Nối âm /bl/ nhanh, âm /æŋ/ qua mũi và kết thúc nhẹ /kɪt/.",
    exampleSentence: "Wrap yourself in a warm blanket by the campfire.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_blanket.png"
  },
  {
    file: "03_sleeping_bag.png",
    term: "sleeping bag",
    meaning: "túi ngủ dã ngoại",
    ipa: "/ˈsliː.pɪŋ ˌbæɡ/",
    phoneticTip: "Kéo dài âm /iː/ trong 'sleeping', bật âm /bæɡ/ rõ ràng.",
    exampleSentence: "Unroll your sleeping bag inside the tent before dark.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_sleeping_bag.png"
  },
  {
    file: "04_camping_stove.png",
    term: "camping stove",
    meaning: "bếp nấu dã ngoại",
    ipa: "/ˈkæm.pɪŋ ˌstəʊv/",
    phoneticTip: "Đọc 'camping' nhẹ nhàng, 'stove' có nguyên âm đôi /əʊ/ rồi khép môi tạo /v/.",
    exampleSentence: "Dad is boiling water on the camping stove for hot cocoa.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_camping_stove.png"
  },
  {
    file: "05_flashlight.png",
    term: "flashlight",
    meaning: "đèn pin cầm tay",
    ipa: "/ˈflæʃ.laɪt/",
    phoneticTip: "Bật /fl/, âm /ʃ/ tròn môi xì nhẹ 'sh', kết thúc dứt khoát với /laɪt/.",
    exampleSentence: "Turn on your flashlight when walking outside at night.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_flashlight.png"
  },
  {
    file: "06_compass.png",
    term: "compass",
    meaning: "la bàn định hướng",
    ipa: "/ˈkʌm.pəs/",
    phoneticTip: "Âm đầu /kʌm/ ngắn, âm sau /pəs/ lướt nhẹ, không đọc thành 'com-pas'.",
    exampleSentence: "Use a compass to find the north when hiking in the forest.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_compass.png"
  },
  {
    file: "07_set_up_a_tent.png",
    term: "set up a tent",
    meaning: "dựng lều cắm trại",
    ipa: "/ˌset ʌp ə ˈtent/",
    phoneticTip: "Nối âm tự nhiên 'set-up-a', nhấn mạnh từ 'tent' với âm /t/ rõ ràng.",
    exampleSentence: "Let's work together to set up a tent before sunset.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_set_up_a_tent.png"
  },
  {
    file: "08_make_a_fire.png",
    term: "make a fire",
    meaning: "nhóm lửa trại",
    ipa: "/ˌmeɪk ə ˈfaɪər/",
    phoneticTip: "Nối âm 'make-a' /meɪkə/, từ 'fire' phát âm 2 âm tiết lướt /faɪ.ər/.",
    exampleSentence: "We gathered dry wood to make a fire and stay warm.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_make_a_fire.png"
  },
  {
    file: "09_clean_up.png",
    term: "clean up",
    meaning: "dọn dẹp sạch sẽ",
    ipa: "/ˌkliːn ˈʌp/",
    phoneticTip: "Nối âm 'clean-up' -> /kliː.nʌp/, âm /iː/ kéo dài nhẹ.",
    exampleSentence: "Always clean up the campsite before leaving for home.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_clean_up.png"
  },
  {
    file: "10_get_lost.png",
    term: "get lost",
    meaning: "bị lạc đường",
    ipa: "/ˌɡet ˈlɒst/",
    phoneticTip: "Bật âm /t/ trong 'get', âm /ɒst/ mở miệng vừa phải, bật nhẹ đuôi /st/.",
    exampleSentence: "Stay close to the group so you don't get lost in the woods.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_get_lost.png"
  },
  {
    file: "11_meet_new_people.png",
    term: "meet new people",
    meaning: "gặp gỡ bạn mới",
    ipa: "/ˌmiːt njuː ˈpiː.pəl/",
    phoneticTip: "Nhấn âm 'people', âm /iː/ trong 'meet' và 'people' ngân nhẹ vui tươi.",
    exampleSentence: "Traveling is a wonderful way to meet new people and make friends.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_meet_new_people.png"
  },
  {
    file: "12_go_zip_lining.png",
    term: "go zip lining",
    meaning: "chơi trượt zipline",
    ipa: "/ˌɡəʊ ˈzɪp ˌlaɪ.nɪŋ/",
    phoneticTip: "Âm /z/ rung nhẹ thanh quản, 'zip-lining' phát âm nhanh, dứt khoát.",
    exampleSentence: "The children were thrilled to go zip lining through the green canopy.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_go_zip_lining.png"
  },
  {
    file: "13_go_rock_climbing.png",
    term: "go rock climbing",
    meaning: "leo núi đá mạo hiểm",
    ipa: "/ˌɡəʊ ˈrɒk ˌklaɪ.mɪŋ/",
    phoneticTip: "Chữ 'b' trong 'climbing' là âm câm, đọc /klaɪ.mɪŋ/.",
    exampleSentence: "Wear a strong helmet when you go rock climbing on steep cliffs.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_go_rock_climbing.png"
  },
  {
    file: "14_beautiful.png",
    term: "beautiful",
    meaning: "xinh đẹp, tuyệt mỹ",
    ipa: "/ˈbjuː.tɪ.fəl/",
    phoneticTip: "Nhấn mạnh âm đầu /ˈbjuː/, hai âm sau /tɪ.fəl/ đọc lướt nhẹ nhàng.",
    exampleSentence: "The mountain view at sunrise is absolutely beautiful.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_beautiful.png"
  },
  {
    file: "15_go_kayaking.png",
    term: "go kayaking",
    meaning: "chèo thuyền kayak",
    ipa: "/ˌɡəʊ ˈkaɪ.æk.ɪŋ/",
    phoneticTip: "Âm /ˈkaɪ.æk/ chia làm 2 nhịp rõ ràng, nhấn trọng âm đầu.",
    exampleSentence: "We rented a yellow boat to go kayaking down the calm river.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_go_kayaking.png"
  },
  {
    file: "16_heavy.png",
    term: "heavy",
    meaning: "nặng nề",
    ipa: "/ˈhev.i/",
    phoneticTip: "Âm /h/ đẩy hơi nhẹ, âm /e/ mở tự nhiên, kết thúc với /i/ ngắn.",
    exampleSentence: "This big backpack is too heavy for a little child to carry.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_heavy.png"
  },
  {
    file: "17_light.png",
    term: "light",
    meaning: "nhẹ nhàng",
    ipa: "/laɪt/",
    phoneticTip: "Nguyên âm đôi /aɪ/, kết thúc bằng cách bật nhẹ âm /t/ dứt khoát.",
    exampleSentence: "Carry a light bag so you can walk comfortably for hours.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_light.png"
  },
  {
    file: "18_unsafe.png",
    term: "unsafe",
    meaning: "không an toàn, nguy hiểm",
    ipa: "/ʌnˈseɪf/",
    phoneticTip: "Nhấn mạnh vào âm tiết thứ hai /seɪf/, âm /s/ xì nhẹ, đuôi /f/ cắn nhẹ môi.",
    exampleSentence: "It is unsafe to swim in the river without a life jacket.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_unsafe.png"
  },
  {
    file: "19_waterfall.png",
    term: "waterfall",
    meaning: "thác nước hùng vĩ",
    ipa: "/ˈwɔː.tə.fɔːl/",
    phoneticTip: "Âm đầu /ˈwɔː/ tròn môi, âm sau /fɔːl/ cong lưỡi tạo âm /l/ ấm.",
    exampleSentence: "Cool water rushes down the tall waterfall into the clear pool.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_waterfall.png"
  },
  {
    file: "20_coast.png",
    term: "coast",
    meaning: "bờ biển dài",
    ipa: "/kəʊst/",
    phoneticTip: "Nguyên âm đôi /əʊ/, kết thúc bằng tổ hợp âm /st/ rõ ràng.",
    exampleSentence: "We enjoyed driving along the sunny coast during our vacation.",
    flashcard3D: "assets/flashcards/grade3/g3_u3_coast.png"
  }
];

// Step 1: Copy images
let copiedCount = 0;
for (const item of g3u3Data) {
  const srcPath = join(srcDir, item.file);
  const destPath = join(destDir, `g3_u3_${item.term.replace(/\s+/g, "_")}.png`);
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
    copiedCount++;
  } else {
    console.warn(`Source image not found: ${srcPath}`);
  }
}
console.log(`Copied ${copiedCount}/20 PNG images to ${destDir}`);

// Step 2: Update CHUONG_TRINH_TOAN_DIEN_24_UNIT_LOP_2_VA_LOP_3.json
const json1Path = join(root, "src", "data", "CHUONG_TRINH_TOAN_DIEN_24_UNIT_LOP_2_VA_LOP_3.json");
const d1 = JSON.parse(readFileSync(json1Path, "utf8"));
d1.grade3[2].vocabulary = g3u3Data.map(v => ({
  term: v.term,
  meaning: v.meaning,
  ipa: v.ipa,
  phoneticTip: v.phoneticTip,
  exampleSentence: v.exampleSentence,
  flashcard3D: v.flashcard3D
}));
writeFileSync(json1Path, JSON.stringify(d1, null, 2), "utf8");
console.log(`Updated ${json1Path}`);

// Step 3: Update GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json
const json2Path = join(root, "src", "data", "GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json");
if (existsSync(json2Path)) {
  const d2 = JSON.parse(readFileSync(json2Path, "utf8"));
  d2.grade3[2].vocabulary = g3u3Data.map(v => ({
    term: v.term,
    meaning: v.meaning,
    ipa: v.ipa,
    phoneticTip: v.phoneticTip,
    exampleSentence: v.exampleSentence,
    flashcard3D: v.flashcard3D
  }));
  writeFileSync(json2Path, JSON.stringify(d2, null, 2), "utf8");
  console.log(`Updated ${json2Path}`);
}

// Step 4: Update TONG_HOP_TAT_CA_TU_MOI_LOP_2_VA_LOP_3_436_TU.json
const json3Path = join(root, "src", "data", "TONG_HOP_TAT_CA_TU_MOI_LOP_2_VA_LOP_3_436_TU.json");
if (existsSync(json3Path)) {
  const d3 = JSON.parse(readFileSync(json3Path, "utf8"));
  if (d3.grade3 && d3.grade3[2]) {
    d3.grade3[2].vocabulary = g3u3Data.map(v => ({
      term: v.term,
      meaning: v.meaning,
      ipa: v.ipa,
      phoneticTip: v.phoneticTip,
      exampleSentence: v.exampleSentence,
      flashcard3D: v.flashcard3D
    }));
    writeFileSync(json3Path, JSON.stringify(d3, null, 2), "utf8");
    console.log(`Updated ${json3Path}`);
  }
}

console.log("All Grade 3 Unit 3 data standardized successfully!");
