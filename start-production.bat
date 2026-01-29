@echo off
echo ========================================
echo Building Job Bid Management System
echo ========================================

echo.
echo Step 1: Building Frontend...
cd packages\frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Step 2: Building Backend...
cd ..\backend
call npm run build
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Build Complete! Starting Server...
echo ========================================
echo.
echo The application will be available at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

cd ..\..
