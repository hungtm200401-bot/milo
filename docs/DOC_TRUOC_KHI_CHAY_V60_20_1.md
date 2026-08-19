# MILO V60.24.4 — Đọc trước khi chạy

## File chạy chính

Dự án chỉ có một launcher Windows chuẩn:

- `bin\Milo.exe`: mở cửa sổ ứng dụng Milo native.
- `bin\Milo.exe` mở thẳng khu học viên, không có thanh điều hướng native **Học viên / Quản trị**.
- `bin\Milo.exe --admin`: lối nội bộ dành cho quản trị viên mở thẳng khu quản trị bằng cùng EXE.

Không đổi tên `Milo.exe` để chọn chế độ và không sao chép EXE ra root.

## Cấu hình

- `.env`: cấu hình thật mà máy chủ đọc; không chia sẻ tệp này.
- `.env.example`: mẫu an toàn, không chứa API key hay mật khẩu.
- `scripts\MO_FILE_CAU_HINH_ENV.bat`: mở tệp cấu hình bằng Notepad.
- `docs\CAU_HINH_MILO_ENV.txt`: hướng dẫn cấu hình chi tiết.

## Runtime Windows

Launcher tìm Node.js nội bộ trong `RUNTIME_NOI_BO` hoặc Node.js đã cài trên máy. Nếu chưa có, launcher có thể cài runtime đã khóa SHA-256; cũng có thể chạy `scripts\CAI_RUNTIME_WINDOWS.bat` thủ công.

Cửa sổ Milo là ứng dụng Windows native dùng WebView2 bên trong; không mở Edge hoặc Chrome như một cửa sổ bên ngoài.

## Cách chạy

1. Giải nén toàn bộ ZIP ra một thư mục bình thường có quyền ghi.
2. Điền cấu hình cần dùng vào `.env`.
3. Mở `bin\Milo.exe` để vào khu học viên. Quản trị viên dùng lối nội bộ `bin\Milo.exe --admin` khi cần bảo trì.

Không chạy EXE trực tiếp bên trong cửa sổ xem ZIP.
