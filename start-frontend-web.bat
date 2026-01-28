@echo off
title Frontend Web - Development Server
color 0B

echo.
echo ========================================
echo  Starting Frontend Web Server
echo ========================================
echo.

cd packages\frontend

echo [INFO] Starting Vite development server...
echo [INFO] The web app will open at http://localhost:5173
echo.

call npm run dev

pause
