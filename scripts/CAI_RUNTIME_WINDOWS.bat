@echo off
setlocal
cd /d "%~dp0.."
if not exist "RUNTIME_NOI_BO" mkdir "RUNTIME_NOI_BO"
if exist "RUNTIME_NOI_BO\node.exe" (
  echo Runtime Milo da co san.
  "RUNTIME_NOI_BO\node.exe" --version
  pause
  exit /b 0
)
echo Dang tai runtime Windows chinh thuc...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing 'https://nodejs.org/dist/v22.16.0/win-x64/node.exe' -OutFile 'RUNTIME_NOI_BO\node.exe.download'; $h=(Get-FileHash 'RUNTIME_NOI_BO\node.exe.download' -Algorithm SHA256).Hash.ToLower(); if($h -ne 'c5ff4c736112dd483c750fd4149d30c8a116db1a49b8b3ec88be4b65e6c86c19'){Remove-Item 'RUNTIME_NOI_BO\node.exe.download' -Force; throw 'Ma kiem tra runtime khong khop'}; Move-Item 'RUNTIME_NOI_BO\node.exe.download' 'RUNTIME_NOI_BO\node.exe' -Force"
if errorlevel 1 (
  echo.
  echo Khong tai duoc runtime. Hay kiem tra Internet va thu lai.
  pause
  exit /b 1
)
echo.
echo Da cai runtime thanh cong. Mo bin\Milo.exe de hoc, hoac bin\Milo.exe --admin de quan tri.
pause
