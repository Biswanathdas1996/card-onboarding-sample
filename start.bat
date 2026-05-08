@echo off
title KYC Web App
color 0A
echo.
echo ========================================
echo    Starting KYC Web Application
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies. Press any key to exit.
        pause >nul
        exit /b 1
    )
)

echo Starting backend server on http://localhost:5000...
start "KYC Backend Server" cmd /k "npm run start --prefix . --port 5000"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Starting frontend development server on http://localhost:3000...
start "KYC Frontend Server" cmd /k "npm start"

echo.
echo ========================================
echo    Application Starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /FI "WindowTitle eq KYC Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq KYC Frontend Server*" /T /F >nul 2>&1
echo Servers stopped.
pause
