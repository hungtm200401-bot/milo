@echo off
chcp 65001 >nul
echo Dang mo Milo tren Web...
cd /d "%~dp0"
start /min "" cmd /c "node server/server.mjs"
timeout /t 2 >nul
start http://127.0.0.1:8787
exit
