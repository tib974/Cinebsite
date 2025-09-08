@echo off
REM Windows: double-cliquez pour lancer le serveur local
setlocal
set DIR=%~dp0
set PORT=%1
if "%PORT%"=="" set PORT=8000

where php >nul 2>nul
if errorlevel 1 (
  echo PHP introuvable. Installez-le et relancez.
  pause
  exit /b 1
)

start "" "http://127.0.0.1:%PORT%/desk/login.php"
php -S 127.0.0.1:%PORT% -t "%DIR%"
endlocal
