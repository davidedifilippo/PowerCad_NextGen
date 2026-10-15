@echo off
title CADe SIMU Next - Avvio Rapido
cd /d "%~dp0"
echo ========================================================
echo   CADe SIMU Next - Simulatore Schemi Elettrici Moderno
echo ========================================================
echo.
echo Avvio del server applicativo...
start http://localhost:5173
call npm run dev
pause
