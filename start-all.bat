@echo off
title Job Bid Management System - Complete Startup
color 0E

echo.
echo ========================================
echo  Job Bid Management System
echo  Complete Startup Script
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 22+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Check if backend is built
if not exist "packages\backend\dist" (
    echo [INFO] Backend not built. Building now...
    cd packages\backend
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Backend build failed!
        cd ..\..
        pause
        exit /b 1
    )
    cd ..\..
    echo [SUCCESS] Backend built successfully!
    echo.
)

REM Check if .env files exist
if not exist "packages\frontend\.env" (
    echo [INFO] Creating frontend .env file...
    echo VITE_API_BASE_URL=http://localhost:3000 > packages\frontend\.env
    echo [SUCCESS] Frontend .env created
    echo.
)

echo ========================================
echo  Starting Backend Server...
echo ========================================
echo.

REM Start backend in a new window
start "Backend API Server" cmd /k "cd /d packages\backend && npm run dev"

echo [INFO] Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  Starting Frontend Web Server...
echo ========================================
echo.

REM Start frontend web in a new window
start "Frontend Web Server" cmd /k "cd /d packages\frontend && npm run dev"

echo.
echo ========================================
echo  System Started Successfully!
echo ========================================
echo.
echo [SUCCESS] Both backend and frontend are starting...
echo.
echo Backend API: http://localhost:3000
echo Frontend Web: http://localhost:5173
echo.
echo Two new windows have opened:
echo 1. Backend API Server (port 3000)
echo 2. Frontend Web Server (port 5173)
echo.
echo [TIP] Open your browser and go to: http://localhost:5173
echo [TIP] To stop the system, close both server windows
echo.
echo Press any key to close this startup window...
pause >nul
