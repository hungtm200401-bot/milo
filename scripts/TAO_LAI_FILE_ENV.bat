@echo off
cd /d "%~dp0"
if exist ".env" (
  echo File .env da ton tai. Khong ghi de de tranh mat cau hinh.
) else (
  copy /y ".env.example" ".env" >nul
  echo Da tao file .env.
)
pause
