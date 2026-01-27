@echo off
title Job Bid Management System - Quick Start
color 0B

echo.
echo ==========================================
echo  Job Bid Management System - Quick Start
echo ==========================================
echo.

REM Quick start without extensive checks
echo [INFO] Starting backend server...
start "Backend API" cmd /k "cd /d packages\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [INFO] Starting frontend application...
start "Frontend App" cmd /k "cd /d packages\frontend && npm run tauri:dev"

echo.
echo [SUCCESS] System is starting...
echo Backend: http://localhost:3000
echo Frontend: Tauri desktop app will launch
echo.
echo Press any key to close this window...
pause >nul