@echo off
chcp 65001 >nul
set "DB=%~1"
if "%DB%"=="" set "DB=data\commerce.json"
node tools\migrate-progress-v60-20.mjs "%DB%"
pause
