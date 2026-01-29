@echo off
echo ========================================
echo Starting Job Bid Management System
echo ========================================
echo.
echo The application will be available at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

cd packages\backend
call npm start
cd ..\..
