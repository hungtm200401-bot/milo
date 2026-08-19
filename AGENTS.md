# AGENTS.md — Quy Định & Hướng Dẫn Dành Cho Agent AI / Developers

Dự án **Milo English Adventure (V60.24.4+)** là ứng dụng học Tiếng Anh Tiểu Học (Lớp 2–5) chạy trên nền tảng Windows Desktop App (Node.js backend + HTML5/CSS3/Vanilla JS frontend + một cửa sổ WinForms/WebView2 chuẩn tại `bin/Milo.exe`).

---

## 1. Lệnh Thao Tác Bắt Buộc

### 1.1 Lệnh Cài Đặt Dependency
```bash
npm install
```

### 1.2 Lệnh Chạy Ứng Dụng
- **Chạy Server trực tiếp (Backend + Web Runtime):**
  ```bash
  node server/server.mjs
  ```
  *Ứng dụng chạy tại: `http://127.0.0.1:8787`*
- **Trang Học Viên:** `http://127.0.0.1:8787/index.html`
- **Trang Quản Trị VIP PRO MAX:** `http://127.0.0.1:8787/admin.html`
- **Trang Luyện Bài Học (Lesson):** `http://127.0.0.1:8787/lesson.html`

### 1.3 Lệnh Kiểm Thử & Validation
- **Chạy toàn bộ Test Suite (Test tự động):**
  ```bash
  npm test
  ```
- **Chạy Validator chống trùng nhiệm vụ (Task Uniqueness):**
  ```bash
  npm run validate:unique
  ```
- **Chạy Validator chống lộ đáp án (Answer Leakage):**
  ```bash
  npm run validate:answers
  ```
- **Chạy Đo hiệu năng Click (Click Performance):**
  ```bash
  npm run measure:click
  ```

### 1.4 Lệnh Build Desktop App
```bash
dotnet publish windows-launcher-src/milo-webview-host/MiloDesktopHost.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o <thu_muc_tam>
```

- Chép duy nhất `<thu_muc_tam>\Milo.exe` vào `bin\Milo.exe` sau khi build thành công.
- `bin/Milo.exe` mở thẳng cửa sổ học viên native, không có thanh điều hướng native **Học viên / Quản trị**.
- `bin/Milo.exe --admin` chỉ dành cho nhân sự quản trị mở thẳng khu quản trị nội bộ.
- Không tạo launcher EXE thứ hai, không chọn chế độ theo tên tệp và không đặt EXE ở root.

---

## 2. Quy Tắc Cấu Trúc & Đặt Tên (Naming & Structure Rules)

1. **KHÔNG TẠO FILE PHIÊN BẢN CHỒNG CHÉO:**
   - **TỪ CHỐI:** `app-v40.js`, `commerce-v55.js`, `fix-final.js`, `fix-final-2.js`.
   - Quản lý phiên bản duy nhất tại `package.json` và `CHANGELOG.md`.
   - Tên file mới phải đặt theo **trách nhiệm đơn lẻ (Single Responsibility)**:
     - `subscription-ui.js`
     - `payment-service.js`
     - `speech-service.js`
     - `progress-repository.js`
     - `vip-access-policy.js`

2. **BẢO MẬT BẮT BUỘC:**
   - **Nghiêm cấm** ghi API key thật, mật khẩu hay token vào mã nguồn, file log, markdown hoặc release.
   - File `.env` chỉ chứa placeholder rỗng cho môi trường release. Không đóng gói `.env` thật có key nhạy cảm vào bản bàn giao.
   - App học (Student UI) **không bao giờ** render tên file `.env`, tên biến `MILO_BANK_NAME`, API key, model, endpoint hay lỗi technical stack trace ra DOM.

3. **QUY TẮC THƯƠNG MẠI & MỞ GÓI VIP:**
   - Mọi nút xem gói/nâng cấp VIP phải dùng API thống nhất:
     `window.SubscriptionUI.openPlans(options)` hoặc `window.MILO_COMMERCE.openVipPlans(options)`.
   - Selector HTML chuẩn: `data-action="open-vip-plans"`.
   - **Nghiêm cấm** dùng `document.querySelector(...).click()` để kích hoạt giả lập click mở modal.
   - Phải có cơ chế debounce (`_planModalLock`) chống nhấp đúp liên tục.

4. **QUY TẮC CHƯƠNG TRÌNH HỌC (CURRICULUM):**
   - Giữ đúng **12 Unit** mỗi lớp. Không tạo/khôi phục Unit 13–16.
   - Giữ nguyên mốc Level milestone: `[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 45, 50]`. Unit 12 đạt đúng Lv.50.
   - Ví dụ giảng bài **không được phép** trùng với đáp án của câu hỏi bài tập sắp làm.
   - Sai lần đầu không được tiết lộ đáp án ngay mà phải đưa ra gợi ý nhỏ.

5. **QUY TẮC PHÁT HÀNH BẢN CẬP NHẬT TỰ ĐỘNG (AUTO-UPDATE & COMPATIBILITY):**
   - **Bắt buộc:** Mọi khi có thay đổi code, sửa lỗi, thêm ảnh, cải tiến giao diện hoặc nội dung bài học, **phải luôn phát hành bản cập nhật mới** (tăng số phiên bản patch trong `server/update-service.mjs` và cập nhật `CHANGELOG.md`).
   - Đảm bảo endpoint `/api/update/status` trả về `hasUpdate: true` với phiên bản mới nhất và changelog chi tiết, để tất cả người dùng chạy `bin/Milo.exe` trên mọi thiết bị đều nhận thông báo nâng cấp tự động và cập nhật mượt mà.
   - Các file dữ liệu bài học, CSS, JS phải được đồng bộ giữa thư mục `src/` và `public/`, đồng thời tự trị không phụ thuộc bộ nhớ cache cũ.

---

## 3. Tiêu Chí Trước Khi Báo Hoàn Thành (Definition of Done)

Trước khi báo hoàn thành nhiệm vụ, Agent phải kiểm tra đủ các điều kiện:
1. `npm test` đạt **100% PASS** (70/70 tests trở lên, hiện tại là 93/93).
2. Validator `validate:unique` và `validate:answers` không báo lỗi.
3. Không có biến toàn cục rác hoặc file vá chồng chéo (`fix-final.js`).
4. Bảng giá 3 gói VIP hiển thị đúng: 1 tháng (299.000đ), 3 tháng (649.000đ), 6 tháng (1.199.000đ).
5. Đã phát hành phiên bản mới trong `server/update-service.mjs` và ghi nhận đầy đủ vào `CHANGELOG.md`.
6. Đã kiểm tra trực tiếp trên runtime `http://127.0.0.1:8787`.
7. Đã build sẵn sàng `bin/Milo.exe` mới nhất cho các thiết bị Windows client.

