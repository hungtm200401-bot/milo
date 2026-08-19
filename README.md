# Milo English Adventure — App Học Tiếng Anh Tiểu Học Lớp 2–5

[![Version](https://img.shields.io/badge/version-60.24.4-blue.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-70%2F70%20PASS-brightgreen.svg)](tests/run-all.mjs)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#)

Milo English Adventure là hệ thống phần mềm giáo dục tiếng Anh tương tác dành cho học sinh tiểu học (Lớp 2, Lớp 3, Lớp 4, Lớp 5), kết hợp giữa chương trình chuẩn 12 Unit/lớp, trợ lý AI Plus đồng hành, phòng luyện phát âm chuyên sâu VIP PRO MAX và hệ thống thương mại phân quyền thuê bao an toàn.

---

## 🌟 Tính Năng Nổi Bật

- **Chương Trình Học 12 Unit Theo Lớp:**
  - 12 Unit thiết kế chuẩn khung năng lực tiểu học (Lớp 2–5).
  - Tích hợp 50 Level tiến độ (`[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 45, 50]`).
- **Trợ Lý AI Plus & VIP PRO MAX:**
  - AI Plus mở miễn phí cho mọi tài khoản đăng nhập.
  - VIP PRO MAX mở khóa 8 Trợ lý AI chuyên môn (Phát âm, Ngữ pháp, Từ vựng, Hội thoại, Viết, Nghe, Bài tập, Lộ trình).
- **Thương Mại & Thanh Toán An Toàn:**
  - Bảng giá 3 gói rõ ràng: 1 tháng (299.000đ), 3 tháng (649.000đ), 6 tháng (1.199.000đ - Tiết kiệm 595.000đ).
  - Tích hợp dùng thử 24 giờ hoàn toàn miễn phí.
  - Hệ thống xác thực & phân quyền bảo mật qua Token & Server Authorize.

---

## 🚀 Hướng Dẫn Khởi Động & Chạy App

### 1. Khởi Động Nhanh Trên Windows

- Nhấp đúp `bin\Milo.exe` để mở cửa sổ Milo riêng, không mở Edge hoặc Chrome bên ngoài.
- `bin\Milo.exe` mở thẳng khu học viên; không còn thanh điều hướng native **Học viên / Quản trị** trên cửa sổ học.
- Khu quản trị chỉ dành cho nhân sự quản trị mở bằng lối nội bộ `bin\Milo.exe --admin`.
- Milo dùng WebView2 bên trong cửa sổ Windows native; Windows 10/11 thường đã có WebView2 Runtime.

### 2. Chạy Kiểm Thử Nội Bộ Bằng Node.js Terminal
```bash
# Khởi động Node.js backend & static server
node server/server.mjs
```
Các đường dẫn nội bộ này chỉ dùng cho kiểm thử kỹ thuật, không phải cách chạy bản bàn giao:
- **App học:** `http://127.0.0.1:8787/index.html`
- **Bài học:** `http://127.0.0.1:8787/lesson.html`
- **Quản trị:** `http://127.0.0.1:8787/admin.html`

---

## 🧪 Kiểm Thử & Kiểm Soát Chất Lượng

```bash
# Chạy suite 70 test tự động
npm test

# Kiểm tra tính độc nhất của bài tập (0% duplicate)
npm run validate:unique

# Kiểm tra chống lộ đáp án trước khi làm
npm run validate:answers
```

---

## 📂 Cấu Trúc Dự Án Tinh Gọn & Chuyên Nghiệp

```
MILO_V60_24_4_ADMIN_READABLE_TEXT_REAL_DATA_NO_BACKGROUND/
├── bin/
│   └── Milo.exe             # Launcher Windows duy nhất
├── public/                  # index.html, lesson.html, admin.html và tài nguyên web
├── server/                  # server.mjs, commerce-server.mjs và các module backend
├── desktop-runtime/
│   └── milo-window.mjs      # Entry Node cũ đã bị vô hiệu hóa, không mở trình duyệt
├── content/                 # Nội dung chương trình học
├── assets/                  # Tài nguyên dùng chung
├── scripts/                 # Kịch bản mở app, kiểm tra runtime và tắt server
├── docs/                    # Tài liệu kiến trúc, bàn giao và cấu hình
├── reports/                 # Báo cáo kiểm soát chất lượng
├── tools/                   # Validator và công cụ đo lường
├── tests/                   # Test suite chạy trên cây runtime chuẩn
├── windows-launcher-src/
│   └── milo-webview-host/   # Mã nguồn WinForms/WebView2 của Milo.exe
├── .env.example             # Mẫu cấu hình an toàn, không chứa khóa thật
├── AGENTS.md
└── README.md
```

`bin/Milo.exe` là artifact Windows duy nhất của bản phát hành.
