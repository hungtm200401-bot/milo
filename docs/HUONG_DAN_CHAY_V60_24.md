# Hướng dẫn chạy V60.24.4

1. Giải nén toàn bộ ZIP vào một thư mục có quyền ghi.
2. Chủ hệ thống điền cấu hình vào `.env`; không chia sẻ file đã điền bí mật.
3. Nhấp đúp `bin\Milo.exe` để chạy cửa sổ học viên Milo riêng.
4. Cửa sổ học viên không có thanh điều hướng native **Học viên / Quản trị**.
5. Quản trị viên dùng lối nội bộ `bin\Milo.exe --admin` nếu cần mở thẳng quản trị.
6. Trong quản trị, đăng nhập rồi chọn `Kết nối AI` để xem trạng thái hoặc kiểm tra kết nối.

App học chỉ hiển thị `Milo đã sẵn sàng`, `Milo đang kết nối…` hoặc thông báo thử lại; chi tiết kỹ thuật không xuất hiện ở đó.

Milo dùng WebView2 bên trong cửa sổ Windows native, nên không mở trình duyệt Edge/Chrome bên ngoài. Máy cần WebView2 Runtime có sẵn trên Windows 10/11 hiện đại.
