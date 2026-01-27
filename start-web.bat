@echo off
title Job Bid Management System - Web Version
color 0B

echo.
echo ========================================
echo  Job Bid Management System - Web Version
echo ========================================
echo.
echo [INFO] Starting backend and web frontend...
echo.

REM Start backend
start "Backend API" cmd /k "cd /d packages\backend && npm run dev"

timeout /t 3 /nobreak >nul

REM Start frontend (web only, no Tauri)
start "Frontend Web" cmd /k "cd /d packages\frontend && npm run dev"

echo.
echo [SUCCESS] System started!
echo.
echo Backend API: http://localhost:3000
echo Frontend Web: http://localhost:5173
echo.
echo Open your browser and go to: http://localhost:5173
echo.
echo Press any key to close...
pause >nul