@echo off
chcp 65001 >nul
title DUNG HOAN TOAN MILO

echo Dang dung cac tien trinh Milo...
taskkill /F /T /IM "Milo.exe" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$items=Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'MILO_V60|MiloEnglishAdventure|server[\\/]server\.mjs' }; foreach($p in $items){Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue}"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8787 .*LISTENING"') do taskkill /F /T /PID %%P >nul 2>&1
echo Milo da duoc dung. Khong dong tat ca node.exe cua VS Code hoac Antigravity.
pause
