@echo off
setlocal
set "MILO_ROOT=%~dp0.."
set "MILO_EXE=%~dp0..\bin\Milo.exe"
set "MILO_REPORT=%~dp0..\MILO_KET_QUA_KIEM_TRA.txt"
> "%MILO_REPORT%" echo MILO - KIEM TRA CAY RUNTIME CHUAN
if exist "%MILO_EXE%" (
  >> "%MILO_REPORT%" echo [OK] bin\Milo.exe
  powershell.exe -NoProfile -Command "(Get-FileHash -LiteralPath '%MILO_EXE%' -Algorithm SHA256).Hash.ToLower()" >> "%MILO_REPORT%" 2>&1
) else (
  >> "%MILO_REPORT%" echo [LOI] Thieu bin\Milo.exe
)
if exist "%MILO_ROOT%\server\server.mjs" (>> "%MILO_REPORT%" echo [OK] server\server.mjs) else (>> "%MILO_REPORT%" echo [LOI] Thieu server\server.mjs)
if exist "%MILO_ROOT%\public\index.html" (>> "%MILO_REPORT%" echo [OK] public\index.html) else (>> "%MILO_REPORT%" echo [LOI] Thieu public\index.html)
start "" notepad.exe "%MILO_REPORT%"
endlocal
