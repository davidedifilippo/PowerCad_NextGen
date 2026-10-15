@echo off
title ElectroForge - Avvio Rapido
cd /d "%~dp0"
echo ========================================================
echo   ElectroForge - Simulatore & CAD Elettrico Industriale
echo ========================================================
echo.
echo Avvio del server applicativo...
start http://localhost:5173
call npm run dev
pause
