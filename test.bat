@echo off
title Job Bid Management System - Run Tests
color 0E

echo.
echo ========================================
echo  Job Bid Management System - Tests
echo ========================================
echo.

echo [INFO] Running backend tests...
echo.
cd packages\backend
npm test
set backend_result=%errorlevel%
cd ..\..

echo.
echo ========================================
echo.

if %backend_result% equ 0 (
    echo [SUCCESS] Backend tests passed!
) else (
    echo [ERROR] Backend tests failed!
)

echo.
echo [INFO] Running frontend tests...
echo.
cd packages\frontend
npm test run
set frontend_result=%errorlevel%
cd ..\..

echo.
echo ========================================
echo  Test Results Summary
echo ========================================
echo.

if %backend_result% equ 0 (
    echo Backend Tests: PASSED ✓
) else (
    echo Backend Tests: FAILED ✗
)

if %frontend_result% equ 0 (
    echo Frontend Tests: PASSED ✓
) else (
    echo Frontend Tests: FAILED ✗
)

echo.
if %backend_result% equ 0 if %frontend_result% equ 0 (
    echo [SUCCESS] All tests passed! 🎉
) else (
    echo [WARNING] Some tests failed. Check output above.
)

echo.
echo Press any key to close...
pause >nul