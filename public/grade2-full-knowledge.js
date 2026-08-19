/* V60.12.0 — lớp 2: dữ liệu đọc rõ và đối chiếu được từ hai ZIP ảnh người dùng cung cấp.
 * Không chứa ảnh/trang sách hoặc audio gốc. Ví dụ mang nhãn Milo là câu luyện do Milo biên soạn.
 */
(function () {
  const units = window.MILO_CURRICULUM?.[2]?.units || [];
  if (units.length !== 12) return;

  const groupLabels = {
    "Key vocabulary 1": "Từ mới 1",
    "Key vocabulary 2": "Từ mới 2",
  };

  const translationRows = [
    `math::môn Toán
art::môn Mỹ thuật
science::môn Khoa học
P.E.::môn Thể dục
computer science::môn Tin học
music::môn Âm nhạc
violin practice::buổi luyện vĩ cầm
piano practice::buổi luyện piano
tired::mệt
bored::chán
worried::lo lắng
difficult::khó
easy::dễ
interesting::thú vị
busy::bận rộn
important::quan trọng`,
    `crocodile::cá sấu
kangaroo::chuột túi
panda::gấu trúc
snake::rắn
cheetah::báo săn
seal::hải cẩu
camel::lạc đà
whale::cá voi
angry::tức giận
smart::thông minh
fat::béo, mập
thin::gầy, mảnh
funny::ngộ nghĩnh
lazy::lười biếng
dangerous::nguy hiểm
strong::khỏe, mạnh`,
    `windy::có gió
foggy::có sương mù
thunder::sấm
lightning::chớp
storm::cơn bão
hail::mưa đá
sleet::mưa tuyết
tornado::lốc xoáy
scarf::khăn quàng
cap::mũ lưỡi trai
sunglasses::kính râm
sweat suit::bộ đồ thể thao
sneakers::giày thể thao
flip flops::dép xỏ ngón
robe::áo choàng
slippers::dép đi trong nhà`,
    `bookstore::hiệu sách
library::thư viện
playground::sân chơi
toy store::cửa hàng đồ chơi
bank::ngân hàng
computer store::cửa hàng máy tính
movie theater::rạp chiếu phim
restaurant::nhà hàng
factory::nhà máy
train station::nhà ga
gas station::trạm xăng
street::đường phố
traffic::giao thông
small town::thị trấn nhỏ
fields::cánh đồng
market::chợ`,
    `balloon::bóng bay
card::thiệp
candle::nến
burger::bánh burger
cupcake::bánh nhỏ
milkshake::sữa lắc
popcorn::bỏng ngô
fruit salad::sa lát trái cây
ice rink::sân trượt băng
bowling alley::sân bowling
aquarium::thủy cung
theme park::công viên chủ đề
adventure playground::sân chơi phiêu lưu
arts center::trung tâm nghệ thuật
swimming pool::bể bơi
nature center::trung tâm thiên nhiên`,
    `police officer::cảnh sát
chef::đầu bếp
dentist::nha sĩ
vet::bác sĩ thú y
astronaut::phi hành gia
doctor::bác sĩ
hairdresser::thợ làm tóc
photographer::nhiếp ảnh gia
check::kiểm tra
help::giúp đỡ
fix::sửa chữa
cook::nấu ăn
whistle::huýt sáo
perform::biểu diễn
clean::làm sạch
study::học tập`,
    `badminton::cầu lông
baseball::bóng chày
field hockey::khúc côn cầu sân cỏ
horseback riding::cưỡi ngựa
ping-pong::bóng bàn
water polo::bóng nước
skiing::trượt tuyết
paddleboarding::chèo ván
bounce::làm nảy
catch::bắt
hit::đánh
kick::đá
throw::ném
hold::giữ
push::đẩy
pull::kéo`,
    `toothpaste::kem đánh răng
toothbrush::bàn chải đánh răng
mouthwash::nước súc miệng
rinse::súc
chew::nhai
toothache::đau răng
dirty::bẩn
braces::niềng răng
hear::nghe
smell::ngửi
taste::nếm
touch::chạm
hurt::đau
feel::cảm thấy
relax::thư giãn
breathe::thở`,
    `January::tháng Một
February::tháng Hai
March::tháng Ba
April::tháng Tư
May::tháng Năm
June::tháng Sáu
July::tháng Bảy
August::tháng Tám
September::tháng Chín
October::tháng Mười
November::tháng Mười một
December::tháng Mười hai
spring::mùa xuân
summer::mùa hè
fall::mùa thu
winter::mùa đông
seasons::các mùa
world::thế giới
North::phía Bắc
South::phía Nam`,
    `hardworking::chăm chỉ
shy::nhút nhát
kind::tốt bụng
helpful::hay giúp đỡ
creative::sáng tạo
chatty::hay nói chuyện
active::năng động
grumpy::cáu kỉnh
beard::râu
bald::hói
blonde::vàng hoe
straight::thẳng
curly::xoăn
wavy::gợn sóng
eyebrows::lông mày
mustache::ria mép`,
    `add::cộng
subtract::trừ
sum::tổng
plus::dấu cộng
minus::dấu trừ
equals::bằng
measure::đo
problem::bài toán/vấn đề
hide::giấu
lost::bị lạc/mất
solve::giải
clue::manh mối
treasure hunt::cuộc săn kho báu
maze::mê cung
entrance::lối vào
exit::lối ra`,
    `grass::cỏ
lake::hồ
hills::đồi
pond::ao
wildlife::động vật hoang dã
meadow::đồng cỏ
rocks::đá
sand::cát
fins::chân nhái
snorkel::ống thở
water wings::phao tay
air mattress::đệm hơi
hotel::khách sạn
shell::vỏ sò
seaweed::rong biển
sandcastle::lâu đài cát`
  ];

  const readingEvidence = [
    [["Billy the Dragon", "Câu chuyện về mong muốn được đến trường, học môn học mới và tham gia hoạt động ở trường."], ["After School", "Bài đọc về hoạt động sau giờ học, cách cư xử lịch sự và luân phiên khi chơi."]],
    [["Max and Mandy's Adventure", "Hành trình khám phá động vật, nơi sống và các khu vực trên thế giới."], ["In the Wild", "Bài đọc thông tin về đặc điểm, âm thanh và hành vi của động vật hoang dã."]],
    [["Water Cycle", "Bài đọc thông tin về nước, hơi nước, mây, mưa và chu trình nước."], ["Our Favourite Weather", "Bài đọc về các kiểu thời tiết, quần áo và cảm nhận của nhân vật."]],
    [["Open and Closed", "Bài đọc về nơi công cộng, máy móc mở/đóng hoặc bị hỏng và cách ứng xử."], ["Where I Live", "Bài đọc so sánh thành phố, khu phố, thị trấn và vùng quê."]],
    [["Surprise!", "Câu chuyện chuẩn bị một bữa tiệc sinh nhật bất ngờ."], ["Amazing Parties", "Bài đọc về nhiều địa điểm, kiểu tiệc và cách tổ chức lễ kỷ niệm."]],
    [["Sam's Job", "Câu chuyện khám phá công việc, trong đó có việc dắt chó đi dạo."], ["How Can I Be an Astronaut?", "Bài đọc thông tin về công việc, thiết bị và điều kiện làm việc của phi hành gia."]],
    [["Thank You, Ella!", "Câu chuyện thể thao nhấn mạnh làm việc theo đội và giúp đỡ nhau."], ["Sports Rules", "Bài đọc về quy tắc, thiết bị và cách giữ an toàn khi chơi thể thao."]],
    [["Lots of Teeth!", "Bài đọc thông tin về các loại răng và chức năng của chúng."], ["What's That Noise?", "Câu chuyện dùng các giác quan để tìm nguồn tiếng động và vượt qua sợ hãi."]],
    [["Larry the Lemur", "Câu chuyện theo chân một chú vượn cáo qua các mùa và thay đổi thời tiết."], ["North and South", "Bài đọc thông tin về xích đạo, Bắc/Nam bán cầu và sự khác nhau của các mùa."]],
    [["Mr. Blake and the Ball", "Câu chuyện về sự khác biệt, khiếm thính, lòng dũng cảm và giúp đỡ nhau."], ["How to Make a Family Album", "Bài hướng dẫn làm an-bum gia đình và miêu tả người thân."]],
    [["Math Problems!", "Bài đọc về dùng phép cộng, trừ và đo lường để giải quyết vấn đề thường ngày."], ["Escape the Classroom!", "Câu chuyện giải manh mối, đọc ký hiệu và tìm lối thoát trong lớp học."]],
    [["Great Outings", "Bài đọc về địa điểm ngoài trời, động vật hoang dã và cách chụp ảnh."], ["Samira's Sea Glass Collection", "Câu chuyện sưu tầm thủy tinh biển, làm bộ sưu tập và lưu giữ kỷ niệm."]],
  ];

  const sourcePages = ["4–19", "20–35", "36–51", "52–67", "68–83", "84–99", "100–115", "116–131", "132–147", "148–163", "164–179", "180–195"];
  const screenshotRanges = [
    "anh_tam(1).zip · frame_0014–0025",
    "anh_tam(1).zip · frame_0026–0037",
    "anh_tam(1).zip · frame_0038–0049",
    "anh_tam(1).zip · frame_0050–0061",
    "anh_tam(1).zip · frame_0062–0073",
    "anh_tam(1).zip · frame_0074–0085",
    "anh_tam(1).zip · frame_0086–0097",
    "anh_tam(1).zip · frame_0098–0100 và anh_tam(2).zip · 018–029",
    "anh_tam(2).zip · 030–041",
    "anh_tam(2).zip · 042–053",
    "anh_tam(2).zip · 054–065",
    "anh_tam(2).zip · 066–078",
  ];

  const parseTranslations = (value) => new Map(value.split("\n").filter(Boolean).map((row) => {
    const split = row.indexOf("::");
    return [row.slice(0, split).toLowerCase(), row.slice(split + 2)];
  }));

  units.forEach((unit, unitIndex) => {
    const sourceGroups = Array.isArray(unit.vocabularyGroups)
      ? unit.vocabularyGroups.slice(0, 2).map((group) => ({
          label: group.label,
          terms: Array.isArray(group.terms) ? group.terms.slice() : [],
        }))
      : [];
    const alignment = unit.alignment || {
      title: unit.title,
      benchmark: "Lớp 2 · nguồn hai ZIP anh_tam",
      vocabularyGroups: sourceGroups,
      extendedWords: sourceGroups.flatMap((group) =>
        group.terms.map((term) => ({ term, group: group.label, active: true })),
      ),
      objectives: {
        grammar: (unit.grammarFocus || []).join(" · "),
        listening: "Học theo nội dung ảnh nguồn trong hai ZIP.",
        reading: unit.skills?.[0] || "Đọc nội dung Unit.",
        speaking: unit.skills?.[1] || "Luyện nói theo Unit.",
        writing: unit.skills?.[2] || unit.writing || "Luyện viết theo Unit.",
      },
      exerciseTypes: [
        "Học đúng hai bảng Vocabulary của Unit",
        "Xem và đối chiếu trang ảnh nguồn",
        "Luyện đọc, nói, viết và ngữ pháp theo Unit",
      ],
    };
    unit.alignment = alignment;
    const meanings = parseTranslations(translationRows[unitIndex]);
    const coreWords = new Map(unit.words.map((word) => [String(word[0]).toLowerCase(), word]));
    const seen = new Set();
    const sourceTerms = alignment.extendedWords.filter(({ term }) => {
      const key = String(term).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(({ term, group, active }, termIndex) => {
      const key = String(term).toLowerCase();
      const core = coreWords.get(key);
      return {
        id: `g2-u${unitIndex + 1}-t${termIndex + 1}`,
        term,
        meaning: meanings.get(key) || "CHƯA XÁC MINH",
        group,
        groupVi: groupLabels[group] || group,
        active: Boolean(active || core),
        example: core?.[3] || `Milo luyện từ “${term}” trong chủ đề “${unit.title}”.`,
        exampleType: core?.[3] ? "milo-verified-core" : "milo-authored-practice",
        pronunciation: "speech-synthesis",
      };
    });

    unit.fullKnowledge = {
      version: "V60.12.0",
      scope: "100% phần kiến thức đọc rõ và xác minh được từ hai ZIP",
      printedPages: sourcePages[unitIndex],
      screenshots: screenshotRanges[unitIndex],
      tocEvidence: unitIndex < 6 ? "anh_tam(1).zip · frame_0004–0013" : "anh_tam(1).zip · frame_0008–0013",
      sourceTerms,
      sourceTermCount: sourceTerms.length,
      vocabularyGroups: alignment.vocabularyGroups.map((group) => ({
        label: group.label,
        labelVi: groupLabels[group.label] || group.label,
        terms: group.terms.slice(),
      })),
      objectives: { ...alignment.objectives },
      grammarFocus: unit.grammarFocus.slice(),
      readings: readingEvidence[unitIndex].map(([title, verifiedSummary], index) => ({
        index: index + 1,
        title,
        verifiedSummary,
        source: `${screenshotRanges[unitIndex]} · trang in ${sourcePages[unitIndex]}`,
        fullTextImported: false,
      })),
      skills: unit.skills.slice(),
      value: unit.value,
      writing: unit.writing,
      project: unit.project,
      exerciseTypes: alignment.exerciseTypes.slice(),
      sourceAudio: {
        available: false,
        status: "CHƯA XÁC MINH",
        reason: "Hai ZIP chỉ chứa ảnh; không có tệp audio gốc để nhập hoặc kiểm tra.",
      },
      uncertain: unitIndex === 6
        ? ["Unit 7: nguồn hiển thị ‘loose’; giữ nguyên nguồn và cảnh báo vì có thể cần đối chiếu với ‘lose’. "]
        : [],
      verification: {
        allTermsHaveMeanings: sourceTerms.every((item) => item.meaning !== "CHƯA XÁC MINH"),
        allObjectivesIncluded: Object.values(alignment.objectives).every(Boolean),
        readingTitlesIncluded: readingEvidence[unitIndex].length === 2,
        originalBookAudioIncluded: false,
      },
    };
  });

  window.MILO_GRADE2_FULL_KNOWLEDGE = {
    version: "V60.12.0",
    generatedAt: "2026-08-03",
    units: units.map((unit) => unit.fullKnowledge),
    limitations: [
      "Không có audio gốc trong hai ZIP.",
      "Không sao chép ảnh chụp, giao diện Scribd, quảng cáo hoặc trang lỗi vào ứng dụng.",
      "Không đoán phần chữ bị mờ/che; mọi điểm chưa chắc chắn được ghi rõ.",
    ],
  };
})();
