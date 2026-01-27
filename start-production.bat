@echo off
title Job Bid Management System - Production
color 0D

echo.
echo ========================================
echo  Job Bid Management System - Production
echo ========================================
echo.

REM Check if builds exist
if not exist "packages\backend\dist" (
    echo [ERROR] Backend build not found!
    echo Please run build.bat first to build the project.
    echo.
    pause
    exit /b 1
)

if not exist "packages\frontend\dist" (
    echo [ERROR] Frontend build not found!
    echo Please run build.bat first to build the project.
    echo.
    pause
    exit /b 1
)

REM Check if .env files exist
if not exist "packages\backend\.env" (
    echo [WARNING] Backend .env file not found!
    echo Creating default .env file from .env.example...
    echo.
    if exist "packages\backend\.env.example" (
        copy "packages\backend\.env.example" "packages\backend\.env" >nul
        echo [INFO] Default .env file created at packages\backend\.env
        echo [INFO] Please edit this file to configure production settings
    ) else (
        echo [ERROR] .env.example file not found in packages\backend\
        echo Please create packages\backend\.env manually
    )
    echo.
)

echo [INFO] Starting production backend server...
echo.

REM Set production environment
set NODE_ENV=production

REM Start backend in production mode
start "Job Bid System - Production Backend" cmd /k "cd /d packages\backend && set NODE_ENV=production && npm start"

echo.
echo ========================================
echo  Production Server Started!
echo ========================================
echo.
echo [SUCCESS] Backend server is running in production mode
echo.
echo Backend API: http://localhost:3000
echo.
echo [INFO] Frontend build is available in packages\frontend\dist\
echo [INFO] You can serve it with any web server (nginx, Apache, etc.)
echo.
echo [TIP] For development, use start.bat instead
echo [TIP] To stop the server, close the backend window
echo.
echo Press any key to close this window...
pause >nul