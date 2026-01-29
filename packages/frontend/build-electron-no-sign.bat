@echo off
echo Cleaning electron-builder cache...
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
    echo Cache cleaned.
) else (
    echo Cache folder not found, skipping.
)

echo.
echo Setting environment variables to disable code signing...
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set CSC_KEY_PASSWORD=
set WIN_CSC_LINK=
set WIN_CSC_KEY_PASSWORD=

echo.
echo Building frontend...
call npm run build

if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Building Electron app (unsigned)...
call npx electron-builder --win --config electron-builder.yml

if %errorlevel% neq 0 (
    echo Electron build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Output location: release\
echo.
pause
