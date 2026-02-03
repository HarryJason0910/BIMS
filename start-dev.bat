@echo off
title Job Bid Management System - Development
color 0B

echo.
echo ==========================================
echo  Job Bid Management System - Development
echo ==========================================
echo.

REM Start backend server
echo [INFO] Starting backend server...
start "Backend API" cmd /k "cd /d %~dp0packages\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [INFO] Starting frontend application...
start "Frontend App" cmd /k "cd /d %~dp0packages\frontend && npm run dev"

echo.
echo [SUCCESS] System is starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul