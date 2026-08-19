# Ranh Giới Module (Module Boundaries & Layered Architecture)

**Dự án:** Milo English Adventure V60.24.0  
**Mục đích:** Phân định rõ chức năng và ranh giới trách nhiệm giữa các tầng (Layer) trong ứng dụng để tránh chồng chéo code và sự phụ thuộc vòng.

---

## 1. Mẫu Kiến Trúc Bốn Tầng (4-Layer Model)

```
+-------------------------------------------------------------------+
|                        PRESENTATION LAYER                         |
|   index.html, lesson.html, admin.html, CSS UI tokens, Modals      |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                        APPLICATION LAYER                          |
|   SubscriptionUI, StudentAssistantStatus, LessonProgressController|
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                           DOMAIN LAYER                            |
|   Curriculum Rules (12 Units), Level Targets (1-50), VIP Policy  |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                       INFRASTRUCTURE LAYER                        |
|   server.mjs, commerce-server.mjs, JSON DB, Web Speech API       |
+-------------------------------------------------------------------+
```

---

## 2. Quy Tắc Phân Chia Chi Tiết

### 2.1 Presentation Layer (Giao diện)
- **Trách nhiệm:** Render DOM, tiếp nhận click/touch từ người dùng, quản lý hiệu ứng chuyển trang (SPA views).
- **Thành phần:** `index.html`, `lesson.html`, `admin.html`, các stylesheet `.css`.
- **Quy tắc:**
  - **Không** tự đưa ra quyết định cấp quyền VIP.
  - **Không** chứa logic tính XP hay quy đổi Level.
  - Phải dùng `data-action="open-vip-plans"` thay vì gắn listener tùy tiện.

### 2.2 Application Layer (Điều phối Use Cases)
- **Trách nhiệm:** Điều phối các kịch bản người dùng (dùng thử 24h, mở modal chọn gói, làm bài học, gửi phản hồi voice).
- **Thành phần:** `SubscriptionUI` (`commerce-v54.js`), `StudentAssistantStatus` (`student-assistant-status-v60-24.js`), `pronunciation-coach.js`.
- **Quy tắc:**
  - Cung cấp API có chữ ký rõ ràng (`SubscriptionUI.openPlans({ source })`).
  - Đảm bảo debounce chống click đúp (`_planModalLock`).

### 2.3 Domain Layer (Quy tắc Nghiệp vụ)
- **Trách nhiệm:** Lưu giữ logic cốt lõi của ứng dụng giáo dục.
- **Thành phần:**
  - Quy tắc 12 Unit mỗi lớp (Lớp 2, 3, 4, 5).
  - Quy tắc quy đổi Level milestone `[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 45, 50]`.
  - Quy tắc tính giá & mức tiết kiệm gói VIP (1 tháng 299k, 3 tháng 649k, 6 tháng 1.199k).
- **Quy tắc:** Pure JavaScript logic, độc lập hoàn toàn với HTML DOM element.

### 2.4 Infrastructure Layer (Hạ tầng & Lưu trữ)
- **Trách nhiệm:** Lưu trữ dữ liệu JSON DB, xử lý HTTP Server, mã hóa mật khẩu (`scrypt`), giao tiếp Web Speech API và Google Gemini API.
- **Thành phần:** `server.mjs`, `commerce-server.mjs`, `tutor-prompt.mjs`, `tutor-response.mjs`.
- **Quy tắc:** Trả về kết quả JSON chuẩn hóa, bảo vệ tuyệt đối file `.env` và API keys.
