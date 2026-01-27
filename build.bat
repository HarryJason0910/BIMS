@echo off
title Job Bid Management System - Build
color 0A

echo.
echo ========================================
echo  Job Bid Management System - Build
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 22+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo  Building Backend...
echo ========================================
echo.

REM Build backend
cd packages\backend
npm run build
set backend_result=%errorlevel%
cd ..\..

if %backend_result% neq 0 (
    echo [ERROR] Backend build failed!
    pause
    exit /b 1
)

echo [SUCCESS] Backend built successfully!
echo.

echo ========================================
echo  Building Frontend...
echo ========================================
echo.

REM Build frontend
cd packages\frontend
npm run build
set frontend_result=%errorlevel%
cd ..\..

if %frontend_result% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)

echo [SUCCESS] Frontend built successfully!
echo.

echo ========================================
echo  Build Complete!
echo ========================================
echo.

echo [SUCCESS] Both backend and frontend built successfully! 🎉
echo.
echo Build artifacts:
echo - Backend: packages\backend\dist\
echo - Frontend: packages\frontend\dist\
echo.
echo To run in production:
echo 1. Set NODE_ENV=production in backend .env
echo 2. Use 'npm start' in packages\backend for production server
echo 3. Serve frontend dist folder with a web server
echo.
echo Press any key to close...
pause >nul