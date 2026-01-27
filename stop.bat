@echo off
title Job Bid Management System - Stop
color 0C

echo.
echo ========================================
echo  Job Bid Management System - Stop
echo ========================================
echo.

echo [INFO] Stopping all Job Bid System processes...
echo.

REM Kill Node.js processes (backend)
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend server stopped
) else (
    echo [INFO] No backend processes found
)

REM Kill any remaining npm processes
taskkill /f /im npm.exe 2>nul

REM Kill Tauri processes (frontend)
taskkill /f /im "Job Bid Management System.exe" 2>nul
taskkill /f /im "job-bid-management-system.exe" 2>nul

REM Kill any Rust/Cargo processes from Tauri
taskkill /f /im cargo.exe 2>nul
taskkill /f /im rustc.exe 2>nul

echo.
echo [SUCCESS] All processes stopped
echo.
echo Press any key to close...
pause >nul