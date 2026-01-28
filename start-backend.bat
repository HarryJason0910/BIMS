@echo off
title Backend API Server
color 0A

echo.
echo ========================================
echo  Starting Backend API Server
echo ========================================
echo.

cd packages\backend

echo [INFO] Starting backend server...
echo [INFO] API will be available at http://localhost:3000
echo.

REM Check if dist folder exists
if not exist "dist" (
    echo [WARNING] Backend not built yet. Building now...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
    echo [SUCCESS] Build complete!
    echo.
)

echo [INFO] Starting server in development mode...
call npm run dev

pause
