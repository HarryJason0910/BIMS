@echo off
echo ========================================
echo Building Job Bid Manager Desktop App
echo ========================================
echo.

echo Step 1: Building Backend...
cd packages\backend
call npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)
echo Backend build complete!
echo.

echo Step 2: Installing Frontend Dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo Dependencies installed!
echo.

echo Step 3: Building Electron App...
call npm run electron:build:win
if errorlevel 1 (
    echo ERROR: Electron build failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Your app is ready in: packages\frontend\release\
echo.
echo Files created:
dir /b ..\frontend\release\*.exe 2>nul
echo.
pause
