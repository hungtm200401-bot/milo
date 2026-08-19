# CHANGELOG — Milo English Adventure

Tất cả các thay đổi quan trọng của dự án Milo English Adventure sẽ được ghi nhận tại đây.

---

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
