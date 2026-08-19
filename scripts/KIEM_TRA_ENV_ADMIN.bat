@echo off
cd /d "%~dp0"
findstr /b /c:"MILO_ADMIN_PASSWORD=" ".env"
echo.
echo Dong Milo va mo lai sau khi sua .env.
pause
