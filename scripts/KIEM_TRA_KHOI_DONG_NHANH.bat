@echo off
setlocal
set "LOG=%LOCALAPPDATA%\MiloEnglishAdventure\windows-app\Milo-Khoi-Dong-Nhanh.log"
if exist "%LOG%" (
  start "" notepad.exe "%LOG%"
) else (
  echo Chua co log. Hay mo bin\Milo.exe mot lan roi chay lai file nay.
  pause
)
endlocal
