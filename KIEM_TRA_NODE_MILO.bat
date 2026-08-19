@echo off
chcp 65001 >nul
title KIEM TRA NODE MILO
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Select-Object ProcessId,CommandLine | Format-List"
echo.
echo Neu CommandLine co server\server.mjs va thu muc MILO thi do la Milo.
echo Neu co VS Code, Antigravity, npm, vite... thi khong phai Milo.
pause
