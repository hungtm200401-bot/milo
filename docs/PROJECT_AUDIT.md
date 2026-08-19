# PROJECT_AUDIT.md — Báo Cáo Kiểm Toán Mã Nguồn Dự Án

**Ngày lập:** 05/08/2026  
**Phiên bản:** MILO V60.24.0  
**Tác giả:** Antigravity IDE Agent

---

## 1. Cây Thư Mục & Phân Phối File

Dự án hiện tại chứa **149 file** và **12 thư mục con** ở thư mục gốc:

- **Entry Points:**
  - `server.mjs`: Server Node.js chính (Port 8787), xử lý static files, API endpoints `/api/runtime`, `/api/tutor`, `/api/config/*`, và ủy quyền cho commerce.
  - `index.html`: App học chính (185 KB, chứa UI layout, SVG icons, inline CSS/JS).
  - `lesson.html`: Trang học bài chi tiết theo Unit (10.9 KB).
  - `admin.html`: Trang quản trị VIP PRO MAX (11.6 KB).
- **Commerce & Auth:**
  - `commerce-server.mjs`: Core server logic cho database JSON, tài khoản, đăng nhập, đơn hàng, gói VIP.
  - `commerce-v54.js`: Client commerce UI (bảng chọn gói, tạo đơn, login modal).
- **Lesson Engine & Content:**
  - `lesson.js` (136 KB), `micro-lesson-v60-19.js` (124 KB), `curriculum.js` (60.6 KB).
  - `grade2-sourcebook-data.js` (95.9 KB), `grade3-sourcebook-data.js` (92.8 KB), `source-sections-v60-17.js` (1.1 MB).
  - `book-exercises-v60-23.js` (83.8 KB), `book-exercises-v60-23.json` (110 KB).
- **Voice & Pronunciation:**
  - `pronunciation-coach.js` (57.4 KB), `pronunciation-lexicon-v60-16.js` (243 KB), `cute-voice-v60-16.js` (10.1 KB).
- **Launchers & Runtime:**
  - `windows-launcher-src/milo-webview-host/`: host WinForms/WebView2 native cho app Milo.
  - Artifact Windows chuẩn duy nhất: `bin/Milo.exe`; mở thẳng khu học viên, khu quản trị chỉ dùng lối nội bộ `--admin`.

---

## 2. Các Vấn Đề Đã Phát Hiện & Đã Xử Lý (P0)

1. **[P0 - ĐÃ SỬA] Rò rỉ API Key trong `.env`:**
   - *Chi tiết:* `.env` chứa API Key thật `AIzaSyDF...`.
   - *Khắc phục:* Đã làm sạch `.env` và `.env.example`. Đã thêm test kiểm tra tự động.
2. **[P0 - ĐÃ SỬA] Giá gói 6 tháng bị lỗi kinh tế:**
   - *Chi tiết:* Gói 6 tháng giá 1.399.000đ đắt hơn mua 2 lần gói 3 tháng (1.298.000đ).
   - *Khắc phục:* Giảm gói 6 tháng xuống **1.199.000đ** (tiết kiệm 595.000đ).
3. **[P0 - ĐÃ SỬA] Các nút mở gói VIP bị liệt / dùng `.click()` bypass:**
   - *Chi tiết:* `data-open-vip-plans` không có listener; `pronunciation-coach.js` dùng `querySelector(...).click()`.
   - *Khắc phục:* Tạo API `window.SubscriptionUI.openPlans()`, chuẩn hóa listener `data-action="open-vip-plans"`, thêm debounce 400ms.
4. **[P0 - ĐÃ SỬA] Lộ biến kỹ thuật ngân hàng/file `.env` ra UI:**
   - *Chi tiết:* Modal báo lỗi render `Thiếu trong file .env: MILO_BANK_NAME...`.
   - *Khắc phục:* Thay thế bằng câu báo lỗi thân thiện dành cho phụ huynh.

---

## 3. Các Điểm Cần Tái Cấu Trúc Đợt 2 (P1)

- **Các file phiên bản lặp (Legacy Versioned Files):**
  - `app-v37.js`, `app-v38.js`, `app-v39.js` được tải nối tiếp nhau trong `index.html`.
  - Cần quy hoạch gộp thành module `student-app-core.js` trong các mốc tiếp theo.
- **Tài sản truyền thông & Data Separation:**
  - File `source-sections-v60-17.js` chứa 1.1 MB JSON inline. Cần chuyển dần thành JSON tĩnh hoặc nạp async khi mở Unit tương ứng để tối ưu dung lượng RAM và tốc độ khởi động.
