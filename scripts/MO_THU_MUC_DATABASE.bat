@echo off
setlocal
set "MILO_SHARED_DB=%LOCALAPPDATA%\MiloEnglishAdventure\data"
if not exist "%MILO_SHARED_DB%" mkdir "%MILO_SHARED_DB%"
start "" "%MILO_SHARED_DB%"
endlocal
