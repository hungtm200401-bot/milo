import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const weatherSourceDir = "assets/anhmoi_extracted/16_anh_thoi_tiet_cat_lai_v3";
const bodySourceDir = "assets/anhmoi_extracted/20_anh_body_health_khong_de_khung_v3";

const g2FlashcardsDir = "assets/flashcards/grade2";
const g3FlashcardsDir = "assets/flashcards/grade3";

const weatherMapping = [
  { file: "01_windy.png", term: "windy", ipa: "/ˈwɪn.di/", meaning: "có gió" },
  { file: "02_foggy.png", term: "foggy", ipa: "/ˈfɒɡ.i/", meaning: "có sương mù" },
  { file: "03_thunder.png", term: "thunder", ipa: "/ˈθʌn.dər/", meaning: "sấm sét" },
  { file: "04_lightning.png", term: "lightning", ipa: "/ˈlaɪt.nɪŋ/", meaning: "chớp" },
  { file: "05_storm.png", term: "storm", ipa: "/stɔːm/", meaning: "cơn bão" },
  { file: "06_hail.png", term: "hail", ipa: "/heɪl/", meaning: "mưa đá" },
  { file: "07_sleet.png", term: "sleet", ipa: "/sliːt/", meaning: "mưa tuyết" },
  { file: "08_tornado.png", term: "tornado", ipa: "/tɔːˈneɪ.dəʊ/", meaning: "lốc xoáy" },
  { file: "09_scarf.png", term: "scarf", ipa: "/skɑːf/", meaning: "khăn quàng cổ" },
  { file: "10_cap.png", term: "cap", ipa: "/kæp/", meaning: "mũ lưỡi trai" },
  { file: "11_sunglasses.png", term: "sunglasses", ipa: "/ˈsʌŋˌɡlɑː.sɪz/", meaning: "kính râm" },
  { file: "12_sweat_suit.png", term: "sweat suit", ipa: "/ˈswet ˌsuːt/", meaning: "bộ đồ thể thao nỉ" },
  { file: "13_sneakers.png", term: "sneakers", ipa: "/ˈsniː.kəz/", meaning: "giày thể thao" },
  { file: "14_flip_flops.png", term: "flip flops", ipa: "/ˈflɪp.flɒps/", meaning: "dép tông" },
  { file: "15_robe.png", term: "robe", ipa: "/rəʊb/", meaning: "áo choàng tắm" },
  { file: "16_slippers.png", term: "slippers", ipa: "/ˈslɪp.əz/", meaning: "dép đi trong nhà" }
];

const bodyMapping = [
  { file: "01_stomach.png", term: "stomach", ipa: "/ˈstʌm.ək/", meaning: "dạ dày / bụng" },
  { file: "02_back.png", term: "back", ipa: "/bæk/", meaning: "lưng" },
  { file: "03_neck.png", term: "neck", ipa: "/nek/", meaning: "cổ" },
  { file: "04_shoulder.png", term: "shoulder", ipa: "/ˈʃəʊl.dər/", meaning: "vai" },
  { file: "05_fever.png", term: "fever", ipa: "/ˈfiː.vər/", meaning: "sốt" },
  { file: "06_bandage.png", term: "bandage", ipa: "/ˈbæn.dɪdʒ/", meaning: "băng gạc" },
  { file: "07_take_medicine.png", term: "take medicine", ipa: "/teɪk ˈmed.sən/", meaning: "uống thuốc" },
  { file: "08_rest.png", term: "rest", ipa: "/rest/", meaning: "nghỉ ngơi" },
  { file: "09_pale.png", term: "pale", ipa: "/peɪl/", meaning: "tái nhợt" },
  { file: "10_sick.png", term: "sick", ipa: "/sɪk/", meaning: "ốm / bệnh" },
  { file: "11_muscles.png", term: "muscles", ipa: "/ˈmʌs.əlz/", meaning: "cơ bắp" },
  { file: "12_skin.png", term: "skin", ipa: "/skɪn/", meaning: "làn da" },
  { file: "13_brain.png", term: "brain", ipa: "/breɪn/", meaning: "bộ não" },
  { file: "14_heart.png", term: "heart", ipa: "/hɑːt/", meaning: "trái tim" },
  { file: "15_cold.png", term: "cold", ipa: "/kəʊld/", meaning: "cảm lạnh" },
  { file: "16_cough.png", term: "cough", ipa: "/kɒf/", meaning: "ho" },
  { file: "17_sneeze.png", term: "sneeze", ipa: "/sniːz/", meaning: "hắt hơi" },
  { file: "18_vaccination.png", term: "vaccination", ipa: "/ˌvæk.sɪˈneɪ.ʃən/", meaning: "tiêm phòng" },
  { file: "19_spread.png", term: "spread", ipa: "/spred/", meaning: "lây lan" },
  { file: "20_save_your_life.png", term: "save your life", ipa: "/seɪv jɔːr laɪf/", meaning: "cứu sống bạn" }
];

function sanitizeTerm(term) {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function generate3DCardSvg(grade, unit, unitTitle, term, ipa, meaning, pngBuffer, cardId, themeColors) {
  const base64 = pngBuffer.toString("base64");
  const { skyStart, skyEnd, glowColor, themeBorder, themeText } = themeColors;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 520" width="100%" height="100%">
  <defs>
    <style>
      @keyframes vipFloat {
        0%, 100% {
          transform: translateY(0px) rotate(0deg) scale(1);
        }
        50% {
          transform: translateY(-16px) rotate(2.5deg) scale(1.05);
        }
      }
      @keyframes vipShadow {
        0%, 100% {
          transform: scale(1);
          opacity: 0.35;
        }
        50% {
          transform: scale(0.7);
          opacity: 0.15;
        }
      }
      @keyframes vipAuraSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes vipPrismBeam {
        0% { transform: translateX(-420px) skewX(-25deg); opacity: 0; }
        25% { opacity: 0.75; }
        100% { transform: translateX(520px) skewX(-25deg); opacity: 0; }
      }

      .${cardId}-char {
        transform-origin: 230px 215px;
        animation: vipFloat 3.2s ease-in-out infinite;
      }
      .${cardId}-shadow {
        transform-origin: 230px 315px;
        animation: vipShadow 3.2s ease-in-out infinite;
      }
      .${cardId}-aura {
        transform-origin: 230px 215px;
        animation: vipAuraSpin 14s linear infinite;
      }
      .${cardId}-prism {
        animation: vipPrismBeam 4.5s ease-in-out infinite;
      }
    </style>

    <linearGradient id="${cardId}-sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${skyStart}" />
      <stop offset="100%" stop-color="${skyEnd}" />
    </linearGradient>

    <radialGradient id="${cardId}-glowSphere" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="40%" stop-color="#FEF08A" stop-opacity="0.9" />
      <stop offset="85%" stop-color="${glowColor}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${skyStart}" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="${cardId}-cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#FEF3C7" />
    </linearGradient>

    <linearGradient id="${cardId}-prismGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <filter id="${cardId}-cardShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0F172A" flood-opacity="0.25" />
    </filter>

    <filter id="${cardId}-charGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.3" />
    </filter>

    <clipPath id="${cardId}-clip">
      <rect x="18" y="18" width="424" height="484" rx="34" />
    </clipPath>
  </defs>

  <!-- Outer 3D Container -->
  <rect width="460" height="520" rx="42" fill="url(#${cardId}-sky)" />

  <!-- Main Card Body -->
  <g clip-path="url(#${cardId}-clip)">
    <rect x="18" y="18" width="424" height="484" rx="34" fill="url(#${cardId}-cardBg)" filter="url(#${cardId}-cardShadow)" />

    <!-- Top Scene Horizon Arc -->
    <path d="M 18 18 L 442 18 L 442 120 Q 230 155 18 120 Z" fill="url(#${cardId}-sky)" opacity="0.25" />

    <!-- Light Sweep Shimmer Animation -->
    <rect class="${cardId}-prism" x="-50" y="18" width="140" height="484" fill="url(#${cardId}-prismGrad)" />

    <!-- Top Badge -->
    <g>
      <rect x="32" y="30" width="396" height="38" rx="19" fill="#FFFFFF" stroke="${themeBorder}" stroke-width="2.5" />
      <text x="230" y="54" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="900" fill="${themeText}">
        🌟 LỚP ${grade} · UNIT ${unit}: ${unitTitle.toUpperCase()}
      </text>
    </g>

    <!-- 3D Glow Sphere & Rotating Star Ring -->
    <g>
      <circle cx="230" cy="215" r="96" fill="url(#${cardId}-glowSphere)" />
      <circle cx="230" cy="215" r="84" fill="#FFFFFF" stroke="${themeBorder}" stroke-width="3" stroke-dasharray="12 6" opacity="0.85" />
    </g>

    <!-- Rotating Sparkle Stars -->
    <g class="${cardId}-aura">
      <path d="M 230 110 L 235 120 L 245 123 L 235 126 L 230 136 L 225 126 L 215 123 L 225 120 Z" fill="#FBBF24" />
      <path d="M 330 215 L 335 223 L 343 226 L 335 229 L 330 237 L 325 229 L 317 226 L 325 223 Z" fill="#F472B6" />
      <path d="M 230 310 L 235 318 L 243 321 L 235 324 L 230 332 L 225 324 L 217 321 L 225 318 Z" fill="#38BDF8" />
      <path d="M 130 215 L 135 223 L 143 226 L 135 229 L 130 237 L 125 229 L 117 226 L 125 223 Z" fill="#34D399" />
    </g>

    <!-- 3D Ground Shadow -->
    <ellipse class="${cardId}-shadow" cx="230" cy="315" rx="75" ry="16" fill="#0F172A" />

    <!-- REAL 3D CUT IMAGE EMBEDDED WITH SHADOW & GLOW -->
    <g class="${cardId}-char" filter="url(#${cardId}-charGlow)">
      <image href="data:image/png;base64,${base64}" x="115" y="100" width="230" height="230" preserveAspectRatio="xMidYMid meet" />
    </g>

    <!-- Vocabulary Term (Large Bold Font) -->
    <text x="230" y="358" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="900" fill="#0F172A">
      ${term}
    </text>

    <!-- Vietnamese Meaning Pill -->
    <g>
      <rect x="70" y="378" width="320" height="42" rx="21" fill="${themeText}" />
      <text x="230" y="405" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="17" font-weight="800" fill="#FFFFFF">
        ${meaning}
      </text>
    </g>

    <!-- Phonics IPA Badge -->
    <g>
      <rect x="130" y="432" width="200" height="30" rx="15" fill="#EEF2F6" stroke="#CBD5E1" stroke-width="1.5" />
      <text x="230" y="452" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="700" fill="#475569">
        🗣️ ${ipa}
      </text>
    </g>

    <!-- Bottom VIP Pro Max Branding -->
    <text x="230" y="488" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="11" font-weight="900" fill="#94A3B8" letter-spacing="1.5">
      MILO ENGLISH ADVENTURE · 3D FLASHCARD
    </text>
  </g>
</svg>`;
}

console.log("=== BẮT ĐẦU CẬP NHẬT ẢNH CHO LỚP 2 UNIT 3 & LỚP 3 UNIT 10 ===");

// 1. Process Grade 2 Unit 3 (Weather)
console.log("\n1. Đang xử lý Lớp 2 Unit 3 (16 ảnh thời tiết)...");
for (let i = 0; i < weatherMapping.length; i++) {
  const item = weatherMapping[i];
  const srcPath = join(weatherSourceDir, item.file);
  const safeTerm = sanitizeTerm(item.term);
  const pngDest = join(g2FlashcardsDir, `g2_u3_${safeTerm}.png`);
  const svgDest = join(g2FlashcardsDir, `g2_u3_${safeTerm}.svg`);

  if (existsSync(srcPath)) {
    const buf = readFileSync(srcPath);
    writeFileSync(pngDest, buf);

    const cardId = `vip3d_g2_u3_${i + 1}`;
    const theme = {
      skyStart: "#0284C7",
      skyEnd: "#38BDF8",
      glowColor: "#0EA5E9",
      themeBorder: "#0284C7",
      themeText: "#0369A1"
    };
    const svgContent = generate3DCardSvg(
      2,
      3,
      "How does the weather change?",
      item.term,
      item.ipa,
      item.meaning,
      buf,
      cardId,
      theme
    );
    writeFileSync(svgDest, svgContent, "utf8");
    console.log(`  [G2U3] Đã nạp ảnh & tạo thẻ 3D: ${item.term} -> ${svgDest}`);
  } else {
    console.warn(`  [Cảnh báo] Không tìm thấy file: ${srcPath}`);
  }
}

// 2. Process Grade 3 Unit 10 (Body & Health)
console.log("\n2. Đang xử lý Lớp 3 Unit 10 (20 ảnh cơ thể & sức khỏe)...");
for (let i = 0; i < bodyMapping.length; i++) {
  const item = bodyMapping[i];
  const srcPath = join(bodySourceDir, item.file);
  const safeTerm = sanitizeTerm(item.term);
  const pngDest = join(g3FlashcardsDir, `g3_u10_${safeTerm}.png`);
  const svgDest = join(g3FlashcardsDir, `g3_u10_${safeTerm}.svg`);

  if (existsSync(srcPath)) {
    const buf = readFileSync(srcPath);
    writeFileSync(pngDest, buf);

    const cardId = `vip3d_g3_u10_${i + 1}`;
    const theme = {
      skyStart: "#10B981",
      skyEnd: "#06B6D4",
      glowColor: "#34D399",
      themeBorder: "#059669",
      themeText: "#047857"
    };
    const svgContent = generate3DCardSvg(
      3,
      10,
      "How does our body work?",
      item.term,
      item.ipa,
      item.meaning,
      buf,
      cardId,
      theme
    );
    writeFileSync(svgDest, svgContent, "utf8");
    console.log(`  [G3U10] Đã nạp ảnh & tạo thẻ 3D: ${item.term} -> ${svgDest}`);
  } else {
    console.warn(`  [Cảnh báo] Không tìm thấy file: ${srcPath}`);
  }
}

// 3. Update Curriculum JSON files
console.log("\n3. Đang cập nhật JSON giáo trình toàn diện 24 Unit...");
const masterPath = "src/data/GRADE2_GRADE3_MASTER_VISUAL_CURRICULUM.json";
const chuongTrinhPath = "src/data/CHUONG_TRINH_TOAN_DIEN_24_UNIT_LOP_2_VA_LOP_3.json";

function updateCurriculum(path) {
  if (!existsSync(path)) return;
  const data = JSON.parse(readFileSync(path, "utf8"));

  // Update Grade 2 Unit 3
  const g2u3 = data.grade2.find((u) => u.unit === 3);
  if (g2u3) {
    g2u3.vocabulary = g2u3.vocabulary.map((v) => {
      const safe = sanitizeTerm(v.term);
      return {
        ...v,
        flashcard3D: `assets/flashcards/grade2/g2_u3_${safe}.svg`,
        realCutPng: `assets/flashcards/grade2/g2_u3_${safe}.png`
      };
    });
  }

  // Update Grade 3 Unit 10
  const g3u10 = data.grade3.find((u) => u.unit === 10);
  if (g3u10) {
    g3u10.vocabulary = g3u10.vocabulary.map((v) => {
      const safe = sanitizeTerm(v.term);
      return {
        ...v,
        flashcard3D: `assets/flashcards/grade3/g3_u10_${safe}.svg`,
        realCutPng: `assets/flashcards/grade3/g3_u10_${safe}.png`
      };
    });
  }

  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`  Đã lưu cập nhật vào ${path}`);
}

updateCurriculum(masterPath);
updateCurriculum(chuongTrinhPath);

// 4. Update vocab_image_manifest.json
const manifestPath = "assets/flashcards/vocab_image_manifest.json";
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.grade2 && manifest.grade2.unit3) {
    manifest.grade2.unit3.vocab = weatherMapping.map((item) => {
      const safe = sanitizeTerm(item.term);
      return {
        term: item.term,
        image: `assets/flashcards/grade2/g2_u3_${safe}.png`,
        svg: `assets/flashcards/grade2/g2_u3_${safe}.svg`
      };
    });
  }
  if (manifest.grade3 && manifest.grade3.unit10) {
    manifest.grade3.unit10.vocab = bodyMapping.map((item) => {
      const safe = sanitizeTerm(item.term);
      return {
        term: item.term,
        image: `assets/flashcards/grade3/g3_u10_${safe}.png`,
        svg: `assets/flashcards/grade3/g3_u10_${safe}.svg`
      };
    });
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`  Đã cập nhật ${manifestPath}`);
}

console.log("\n✅ HOÀN TẤT CẬP NHẬT ẢNH CHO LỚP 2 UNIT 3 VÀ LỚP 3 UNIT 10!");
