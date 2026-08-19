# Bản Đồ Chuyển Đổi (Migration Map & Risk Analysis)

**Dự án:** Milo English Adventure V60.24.0  
**Mục đích:** Quản lý lộ trình di chuyển và gộp các file script cũ/phiên bản lặp về cấu trúc chuyên nghiệp, tránh các điểm nghẽn và nguy cơ làm hỏng runtime.

---

## 1. Bảng Ánh Xạ Chuyển Đổi File (Migration Mapping Table)

| File Cũ (Legacy Source) | File Mới Dự Kiến (Clean Module) | Trách Nhiệm Chức Năng | Mức Rủi Ro | Trạng Thái |
|---|---|---|---|---|
| `.env` (Chứa key) | `.env` & `.env.example` (Placeholder) | Cấu hình môi trường an toàn | **P0 - Cao** | ✅ Đã hoàn thành (P0) |
| `commerce-v54.js` | `subscription-ui.js` | UI Thương mại, Modal 3 gói | **P0 - Cao** | 🔄 Đã tạo API `SubscriptionUI` & map selector P0 |
| `pronunciation-coach.js` (.click hack) | `pronunciation-coach.js` | Phòng phát âm VIP PRO MAX | **P0 - Trung bình** | ✅ Đã xóa `.click()` bypass |
| `app-v37.js` | `student-app-core.js` | Pet & App Bootstrap | **P1 - Trung bình** | 📋 Đã lập bản đồ risk |
| `app-v38.js` | `student-app-core.js` | Pronunciation Coach setup | **P1 - Trung bình** | 📋 Đã lập bản đồ risk |
| `app-v39.js` | `student-app-core.js` | VIP Learning setup | **P1 - Trung bình** | 📋 Đã lập bản đồ risk |
| `student-assistant-status-v60-24.js` | `student-assistant-status.js` | Quản lý trạng thái Trợ lý AI | **P1 - Thấp** | 🔄 Đã chuẩn hóa câu thông báo P0 |
| `micro-lesson-v60-19.js` | `lesson-engine.js` | Trình diễn bài học Micro-lessons | **P2 - Cao** | ⏳ Đợi Đợt 3/P2 |
| `source-sections-v60-17.js` | `source-sections-data.js` | 1.1 MB Dữ liệu giáo trình sách | **P2 - Trung bình** | ⏳ Đợi Đợt 3/P2 |

---

## 2. Quy Trình Chuyển Đổi An Toàn (Safe Migration Process)

1. **Nguyên tắc Không Xóa Vội (Zero Breaking Change):**
   - Không được phép xóa file cũ trước khi tạo module mới, cập nhật script import và chạy `npm test` thành công.
2. **Quy Trình 4 Bước Di Chuyển:**
   - **Bước 1:** Trích xuất hàm/logic sang module mới với tên rõ ràng.
   - **Bước 2:** Cập nhật file HTML hoặc script load tương ứng.
   - **Bước 3:** Chạy `npm test` và kiểm tra manual click-through.
   - **Bước 4:** Xóa bỏ tham chiếu cũ sau khi đã xác nhận 100% PASS.

---

## 3. Các Điểm Rủi Ro Cần Theo Dõi (Risk Points)

- **Global State in Window:** Một số script legacy (`app-v37.js`) gán trực tiếp biến vào `window.state`. Khi refactor cần giữ đúng tên property hoặc dùng getter/setter an toàn.
- **Event Listeners Chồng Chéo:** Tránh việc hai file cùng lắng nghe một sự kiện DOM rồi thực thi hai logic mâu thuẫn nhau.
