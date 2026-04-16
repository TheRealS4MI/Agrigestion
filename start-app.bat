@echo off
setlocal
cd /d "%~dp0"

echo Demarrage AgriGestion...
echo.

start "AgriGestion - API" /D "%~dp0server" cmd /k npm run dev
start "AgriGestion - Client" /D "%~dp0client" cmd /k npm run dev

echo Attente du serveur Vite (5 s)...
timeout /t 5 /nobreak >nul

start "" "http://localhost:5173"

echo Navigateur ouvert sur http://localhost:5173
echo Fermez les fenetres "AgriGestion - API" et "AgriGestion - Client" pour arreter.
timeout /t 4 >nul
