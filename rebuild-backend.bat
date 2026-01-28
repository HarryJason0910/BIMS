@echo off
echo Rebuilding backend...
cd packages\backend
call npm run build
if %errorlevel% equ 0 (
    echo.
    echo Backend rebuilt successfully!
    echo.
    echo To start the backend, run:
    echo   npm start
    echo.
    echo Or in development mode:
    echo   npm run dev
) else (
    echo.
    echo Build failed! Check the errors above.
)
pause
