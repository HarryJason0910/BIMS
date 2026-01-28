@echo off
title Desktop App Connection Test
color 0E

echo.
echo ========================================
echo  Desktop App Connection Test
echo ========================================
echo.

echo [TEST 1] Checking if backend is running...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Backend is running on port 3000
) else (
    echo [FAIL] Backend is NOT running!
    echo.
    echo Please start the backend first:
    echo   start-backend.bat
    echo.
    pause
    exit /b 1
)

echo.
echo [TEST 2] Checking frontend .env file...
if exist "packages\frontend\.env" (
    echo [PASS] Frontend .env file exists
    echo.
    echo Contents:
    type packages\frontend\.env
) else (
    echo [FAIL] Frontend .env file missing!
    echo.
    echo Creating it now...
    echo VITE_API_BASE_URL=http://localhost:3000 > packages\frontend\.env
    echo [FIXED] Created packages\frontend\.env
)

echo.
echo [TEST 3] Checking Tauri configuration...
if exist "packages\frontend\src-tauri\tauri.conf.json" (
    echo [PASS] Tauri config exists
    findstr /C:"http://localhost:3000" packages\frontend\src-tauri\tauri.conf.json >nul
    if %errorlevel% equ 0 (
        echo [PASS] HTTP scope includes localhost:3000
    ) else (
        echo [WARN] HTTP scope might not include localhost:3000
    )
) else (
    echo [FAIL] Tauri config not found!
)

echo.
echo [TEST 4] Checking backend CORS configuration...
if exist "packages\backend\.env" (
    echo [PASS] Backend .env exists
    findstr /C:"CORS_ORIGIN" packages\backend\.env
) else (
    echo [FAIL] Backend .env not found!
)

echo.
echo ========================================
echo  Test Summary
echo ========================================
echo.
echo If all tests passed, you can now run:
echo   start-frontend-desktop.bat
echo.
echo Or manually:
echo   cd packages\frontend
echo   npm run tauri:dev
echo.
echo ========================================
echo.
pause
