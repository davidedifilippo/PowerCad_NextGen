@echo off
title PowerCad_NextGen - Avvio Rapido
cd /d "%~dp0"
echo ========================================================
echo   PowerCad_NextGen - Simulatore & CAD Elettrico Industriale
echo ========================================================
echo.
echo Avvio del server applicativo...
start http://localhost:5173
call npm run dev
pause
