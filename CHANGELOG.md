# CHANGELOG — Milo English Adventure

Tất cả các thay đổi quan trọng của dự án Milo English Adventure sẽ được ghi nhận tại đây.

## [60.25.13] - 2026-09-04

### Real-Time Auto-Update System & Admin Cleanup
- **Phát Hành Cập Nhật 1-Click Thời Gian Thực (Real-time Broadcast):** Tích hợp `BroadcastChannel` và `storage` trigger cùng bộ đếm 5s fast-poll giúp App Học Viên (`Milo.exe`, `index.html`) lập tức phát hiện và hiện banner **🔔 Cập nhật (V...)** ngay sau khi bấm nút Phát Hành từ Admin mà không cần bấm F5.
- **Tự Động Nhận Biết Bản Mới Qua Timestamp:** Cập nhật cơ chế so sánh `releaseDate` kết hợp `SemVer`, đảm bảo mọi lần bấm Phát Hành đều tự động kích hoạt thông báo cập nhật lên tất cả thiết bị học sinh.
- **Làm Sạch Giao Diện Quản Trị:** Loại bỏ các chuỗi "PRO MAX" / "VIP PRO MAX", nâng cấp Sandbox thử nghiệm Prompt AI trực tiếp với chỉ số độ trễ ms.

## [60.25.8] - 2026-09-04

### Admin UI & Release Manager Enhancements
- **Thiết Kế Lại Sidebar Admin (Light Mode):** Chuyển thanh Sidebar trang quản trị VIP PRO MAX sang tone sáng Indigo chuyên nghiệp (Figma/Notion/Stripe style), tối ưu tương phản font chữ, icon và hiệu ứng hover/active.
- **Trình Quản Lý Phát Hành Cập Nhật (Admin Update Manager):** Tích hợp tab Phát hành Cập nhật thông minh trong menu Admin (`admin.html`), kiểm tra SemVer tự động khóa/mở nút bấm chống click nhầm bản cũ.
- **Tích Hợp Live Preview:** Cho phép quản trị viên xem trước thông báo cập nhật giao diện học viên trước khi push toàn hệ thống.
- **Đồng Bộ Bộ Tệp Client:** Đồng bộ tệp `admin-update-manager.js` và `admin-vip-pro-max-v60-7.css` đồng nhất giữa `src/` và `public/`.

---

## [60.25.7] - 2026-08-19

### Critical Launcher & Runtime Fixes
- **Ưu Tiên Tuyệt Đối Runtime Nội Bộ (RUNTIME_NOI_BO):** Tái cấu trúc hàm `FindNode` trong launcher để luôn ưu tiên chạy Node.js Portable đi kèm trong gói cài đặt, không bị ghi đè hay lỗi do các biến môi trường PATH trên máy tính của phụ huynh.
- **Tăng Thời Gian Chờ Khởi Động (WaitForRuntime):** Tăng timeout từ 18s lên 35s để đảm bảo các máy tính cấu hình thấp hoặc ổ HDD vẫn khởi động dịch vụ và mở giao diện bài học trơn tru 100%.
- **Sửa Đường Dẫn Icon Desktop:** Định vị chính xác biểu tượng ứng dụng `milo-student.ico` khi tạo Shortcut ngoài màn hình Desktop.
- **Ghi Nhật Ký Chi Tiết (Runtime Diagnostic Logger):** Ghi nhận đầy đủ nguồn gốc node runtime và tiến trình khởi chạy vào `%LocalAppData%\MiloEnglishAdventure\milo-runtime.log`.

## [60.25.6] - 2026-08-19

### Auto-Update & Launcher Enhancements
- **Tự Động Thông Báo Cập Nhật Mới:** Kích hoạt hệ thống chuông báo `🔔 Cập nhật (V60.25.6)` và banner thông báo trực quan trên toàn bộ trang Bản đồ học tập và trang Bài học.
- **Tối Ưu Gói Cài Đặt 1-Click Milo_Setup.exe:** Đóng gói trọn vẹn 100% dữ liệu bài học 4 khối lớp, kho ảnh 3D, âm thanh AI và Node.js Portable Runtime, tự động bung nén và mở app học chỉ trong 10 giây.
- **Bulletproof Launcher:** Trang bị cơ chế chống sập, tự động tìm thư mục cài đặt và Fallback mở trình duyệt web nếu máy tính gặp sự cố với WebView2.
- **Đồng Bộ Hoàn Toàn Src & Public:** Đảm bảo toàn bộ module client `update-client.js` và `update-client.css` được đồng bộ đồng nhất.

## [60.25.5] - 2026-08-19

### Launcher & Distribution Enhancements
- **Khắc Phục Triệt Để Lỗi Mở Milo.exe:** Bổ sung cơ chế Bắt lỗi toàn cục (Global Exception Handler) và hộp thoại thông báo hướng dẫn Tiếng Việt rõ ràng, giải quyết dứt điểm hiện tượng click đúp vào `Milo.exe` bị tắt ngấm không hiện gì khi người dùng chỉ copy riêng lẻ 1 file EXE.
- **Tự Động Nhận Diện Thư Mục Cài Đặt:** `Milo.exe` tự động quét và kết nối với thư mục bài học trong `%LocalAppData%\MiloEnglishAdventure` nếu người dùng chạy launcher từ Desktop hoặc Downloads.
- **Tích Hợp Node.js Portable Tự Động:** Quy trình đóng gói `Milo_Setup.exe` tự động nhúng runtime Node.js nội bộ, giúp máy người nhận (phụ huynh, học sinh) chạy ngay 100% mà không cần cài thêm bất kỳ phần mềm hay môi trường lập trình nào.
- **Đóng Gói 1-Click Cài Đặt Tự Động:** Tạo file cài đặt duy nhất `Milo_Setup.exe` tự bung nén dữ liệu, tạo icon Desktop và tự động bật app học.

## [60.25.4] - 2026-08-18

### Features & UI Enhancements
- **Duy Trì Server Liên Tục:** Thiết lập server http://127.0.0.1:8787 chạy ngầm tự động và liên tục 24/7.
- **Sửa Triệt Để Giao Diện VIP PRO MAX:** Đồng bộ CSS tự trị hoàn chỉnh cho hộp thoại VIP PRO MAX dạng lưới 3 cột quyền lợi, danh sách 10 tính năng và 3 gói giá nổi bật.
- **Kích Hoạt Banner Cập Nhật:** Bổ sung CSS updater trên trang chủ, đảm bảo thông báo bản nâng cấp mới và nút chuông V60.25.4 hiển thị đồng nhất trên tất cả màn hình.
- **Tối Ưu Tải Trang 0ms:** Dữ liệu 24 Unit được đóng gói đồng bộ, triệt tiêu hoàn toàn độ trễ và khoảng trắng khi mở bài.

## [60.25.3] - 2026-08-18

### Features & UI Enhancements
- **Sửa Triệt Để Giao Diện VIP PRO MAX:** Đồng bộ CSS tự trị hoàn chỉnh cho hộp thoại VIP PRO MAX dạng lưới 3 cột quyền lợi, danh sách 10 tính năng và 3 gói giá nổi bật.
- **Kích Hoạt Banner Cập Nhật:** Bổ sung CSS updater trên trang chủ, đảm bảo thông báo bản nâng cấp mới và nút chuông V60.25.3 hiển thị đồng nhất trên tất cả màn hình.
- **Tối Ưu Tải Trang 0ms:** Dữ liệu 24 Unit được đóng gói đồng bộ, triệt tiêu hoàn toàn độ trễ và khoảng trắng khi mở bài.
- **Trọn Bộ 20 Ảnh 3D Lớp 3 Unit 3:** Hoàn thiện 20 hình ảnh cắt siêu nét cho chủ đề "Why do we go on vacation?".

## [60.25.2] - 2026-08-18

### Features & UI Enhancements
- **Đồng bộ Gói VIP PRO MAX:** Đồng bộ 100% giao diện Nâng cấp VIP PRO MAX chuẩn với 6 thẻ quyền lợi và bảng giá 3 gói trong mọi Unit bài học.
- **Trọn bộ 20 ảnh Flashcard 3D Lớp 3 Unit 3:** Cập nhật 20 hình ảnh chất lượng cao cho chủ đề "Why do we go on vacation?".
- **Tối ưu tốc độ tải 0ms:** Đóng gói dữ liệu bài học nạp đồng bộ, xóa bỏ hoàn toàn hiện tượng khoảng trắng khi chuyển Unit.
- **Nút Thoát (✕) & Phím ESC:** Bổ sung nút Thoát trực quan và phím tắt ESC để quay lại Bản đồ Hành trình mọi lúc.
- **Phòng Luyện Đọc AI:** Tích hợp tính năng luyện đọc đoạn văn và chấm điểm phát âm tương tác trực tiếp.

## [Unreleased] - 2026-08-11

### Learning experience
- Chia hành trình mỗi Unit thành 6 buổi rõ ràng và chỉ hiển thị 3 giai đoạn lớn cho trẻ: **Học**, **Luyện**, **Kiểm tra**.
- Thêm chế độ học tập trung một cột; ẩn điều hướng, phần thưởng và bảng chọn không cần thiết khi trẻ đang làm nhiệm vụ.
- Đưa giảng dạy chuyên sâu thành bước mặc định với mục tiêu, ý nghĩa/cấu trúc, cách dùng, lỗi thường gặp và ví dụ mẫu khác bài tập.
- Hiển thị nguyên văn đã đối chiếu trực tiếp ngay trong bài; nội dung chưa kiểm duyệt không được gắn nhãn chữ sách.
- Hợp nhất bộ dựng bài lớp 2–3 để micro lesson là chủ sở hữu duy nhất của vùng nội dung, chấm dứt tình trạng hai renderer ghi đè lẫn nhau.
- Nút **Học tiếp** mở đúng Unit, buổi, giai đoạn và bước gần nhất; cài đặt mới bắt đầu tại Hành trình.
- Build lại `bin/Milo.exe` để xóa riêng Disk Cache, Cache Storage và service worker cũ khi mở app; tài khoản, localStorage và tiến độ không bị xóa.
- Static HTML/JS/CSS chuyển sang `no-store` + network-first và dùng định danh `60.25.1-deep-learning`, chặn WebView2 dùng lại UI cũ.

### Verification
- 91/91 kiểm thử đạt.
- 4.178 hoạt động: 0 trùng lặp, 0 gợi ý đầu làm lộ đáp án.

## [60.24.0-P1] - 2026-08-05

### Added (Bổ Sung)
- **Tài liệu kiến trúc & quy chuẩn:** Bổ sung `AGENTS.md`, `README.md`, `PROJECT_AUDIT.md`, `docs/architecture.md`, `docs/module-boundaries.md`, và `docs/migration-map.md`.
- **Báo cáo xác minh runtime P0:** `reports/p0-runtime-verification.md` & `reports/script-load-and-risk-map.md`.
- **API công khai thống nhất:** `window.SubscriptionUI.openPlans(options)` & `window.MILO_COMMERCE.openVipPlans(options)`.
- **Test Suite P1:** Tăng số lượng unit test từ 67 lên 70 test (100% PASS).

### Security (Bảo Mật P0)
- Xóa bỏ API Key nhạy cảm thật (`AIzaSy...`) khỏi file `.env`.
- Cập nhật `.env` & `.env.example` dạng placeholder sạch an toàn cho bản release.
- Ẩn hoàn toàn tên file `.env` và tên biến ngân hàng khỏi giao diện học viên (Student UI).

### Fixed (Sửa Lỗi P0)
- **Chuẩn hóa Paywall Buttons:** Sửa lỗi các nút `Dùng thử 24 giờ`, `Xem gói`, `Xem 3 gói VIP`, `Mở khóa VIP PRO MAX` bị liệt/không phản hồi do không có listener hoặc selector rải rác.
- **Loại bỏ `.click()` Bypass:** Sửa `pronunciation-coach.js` loại bỏ hack click giả lập selector, gọi trực tiếp API `SubscriptionUI.openPlans()`.
- **Chống Double Click:** Thêm khóa debounce `_planModalLock` 400ms ngăn chặn nhấp đúp mở 2 modal hoặc tạo trùng đơn.
- **Giá Gói 6 Tháng:** Điều chỉnh giá gói 6 tháng từ `1.399.000đ` xuống `1.199.000đ` (tiết kiệm 595.000đ), đảm bảo gói 6 tháng luôn có chi phí/tháng rẻ hơn gói 3 tháng.

---

## [60.24.0] - Baseline Release

- Bản phát hành gốc V60.24.0 Simple Child Chat.
