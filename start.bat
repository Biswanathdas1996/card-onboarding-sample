@echo off
title Sample Web App
echo ========================================
echo   Starting Sample Web App
echo ========================================
echo.

:: Start the backend server
echo [1/2] Starting API Server (port 5000)...
start "API Server" cmd /k "cd /d %~dp0 && node server.js"

:: Wait a moment for the server to start
timeout /t 2 /nobreak >nul

:: Start the React frontend
echo [2/2] Starting React Frontend (port 3000)...
start "React Frontend" cmd /k "cd /d %~dp0 && npm start"

echo.
echo ========================================
echo   App started!
echo   - API Server:  http://localhost:5000
echo   - Frontend:    http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause >nul