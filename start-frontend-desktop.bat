@echo off
title Frontend Desktop - Tauri App
color 0C

echo.
echo ========================================
echo  Starting Tauri Desktop App
echo ========================================
echo.

cd packages\frontend

echo [INFO] Starting Tauri development mode...
echo [INFO] This will compile Rust code and launch the desktop app
echo [INFO] First run may take 1-2 minutes...
echo.

call npm run tauri:dev

pause
