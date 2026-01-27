@echo off
title Job Bid Management System - Startup
color 0A

echo.
echo ========================================
echo  Job Bid Management System - Startup
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

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    echo Please install npm or update Node.js
    echo.
    pause
    exit /b 1
)

echo [INFO] npm version:
npm --version
echo.

REM Check if Rust is installed (required for Tauri)
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Rust is not installed!
    echo.
    echo Rust is REQUIRED for the Tauri desktop app to run.
    echo.
    echo To install Rust:
    echo 1. Visit: https://rustup.rs/
    echo 2. Download and run rustup-init.exe
    echo 3. Follow the installation prompts
    echo 4. Restart this script after installation
    echo.
    echo Alternative: Run 'winget install Rustlang.Rustup' if you have winget
    echo.
    pause
    exit /b 1
)

echo [INFO] Rust version:
rustc --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    echo This may take a few minutes on first run...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        echo Please check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

REM Check if backend .env file exists
if not exist "packages\backend\.env" (
    echo [WARNING] Backend .env file not found!
    echo Creating default .env file from .env.example...
    echo.
    if exist "packages\backend\.env.example" (
        copy "packages\backend\.env.example" "packages\backend\.env" >nul
        echo [INFO] Default .env file created at packages\backend\.env
        echo [INFO] You can edit this file to configure your settings
    ) else (
        echo [ERROR] .env.example file not found in packages\backend\
        echo Please create packages\backend\.env manually
    )
    echo.
)

REM Check if frontend .env file exists
if not exist "packages\frontend\.env" (
    echo [WARNING] Frontend .env file not found!
    echo Creating default .env file from .env.example...
    echo.
    if exist "packages\frontend\.env.example" (
        copy "packages\frontend\.env.example" "packages\frontend\.env" >nul
        echo [INFO] Default .env file created at packages\frontend\.env
        echo [INFO] You can edit this file to configure your settings
    ) else (
        echo [ERROR] .env.example file not found in packages\frontend\
        echo Please create packages\frontend\.env manually
    )
    echo.
)

echo ========================================
echo  Starting Backend Server...
echo ========================================
echo.

REM Start backend in a new window
start "Job Bid System - Backend API" cmd /k "cd /d packages\backend && npm run dev"

REM Wait a moment for backend to start
echo [INFO] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  Starting Frontend Desktop App...
echo ========================================
echo.
echo [INFO] Launching Tauri desktop application...
echo [INFO] This may take 1-2 minutes on first run (Rust compilation)
echo.

REM Start frontend (Tauri app) in a new window
start "Job Bid System - Tauri Desktop App" cmd /k "cd /d packages\frontend && npm run tauri:dev"

echo.
echo ========================================
echo  System Started Successfully!
echo ========================================
echo.
echo [SUCCESS] Both backend and frontend are starting...
echo.
echo Backend API: http://localhost:3000
echo Frontend: Tauri Desktop App (will open in a new window)
echo.
echo Two new windows have opened:
echo 1. Backend API Server (Express + Node.js)
echo 2. Tauri Desktop App (compiling and launching...)
echo.
echo [IMPORTANT] The desktop app window will appear after compilation.
echo [IMPORTANT] First run may take 1-2 minutes to compile Rust code.
echo [IMPORTANT] Subsequent runs will be much faster.
echo.
echo [TIP] You can close this window now.
echo [TIP] To stop the system, close both server windows.
echo.
echo Press any key to close this startup window...
pause >nul