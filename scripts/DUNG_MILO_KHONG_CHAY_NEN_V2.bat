@echo off
chcp 65001 >nul
title DUNG MILO - KHONG CHAY NEN V2

echo.
echo ============================================
echo   DUNG MILO VA GIAI PHONG CONG 8787
echo ============================================
echo.

rem Dung launcher Milo truoc de tranh no khoi dong lai Node
taskkill /F /T /IM "Milo.exe" >nul 2>&1

rem Dung moi tien trinh Node dang giu cong 8787.
rem Lap nhieu lan de bat truong hop tien trinh vua bi launcher khoi dong lai.
for /L %%R in (1,1,5) do (
    for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8787 .*LISTENING"') do (
        echo Dang dung PID %%P dang giu cong 8787...
        taskkill /F /T /PID %%P >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

rem Dung them Node thuoc du an Milo neu con sot lai
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$ps = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'MILO_V60|MiloEnglishAdventure|server[\\/]+server\.mjs' }; foreach ($p in $ps) { & taskkill.exe /F /T /PID $p.ProcessId 2>$null | Out-Null }"

timeout /t 1 /nobreak >nul

echo.
netstat -ano | findstr /R /C:":8787 .*LISTENING" >nul
if errorlevel 1 (
    echo [THANH CONG] Cong 8787 da duoc giai phong. Milo khong con chay nen.
) else (
    echo [CHUA DUNG DUOC] Cong 8787 van dang LISTENING.
    echo Hay mo Task Manager, tab Details, tim PID dang hien va End process tree.
)

echo.
echo Kiem tra tien trinh Node con lai:
tasklist | findstr /I "node.exe"

echo.
pause
