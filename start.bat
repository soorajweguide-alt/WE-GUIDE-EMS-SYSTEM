@echo off
echo ===================================================
echo   WE GUIDE - Employee Management System
echo   Starting Backend + Frontend...
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend (Port 5000)...
start "WE GUIDE Backend" cmd /k "cd /d backend && npm install && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Port 3000)...
start "WE GUIDE Frontend" cmd /k "cd /d frontend && npm install && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo ===================================================
echo   App is starting up!
echo   Admin Dashboard: http://localhost:3000
echo   Backend API:     http://localhost:5000/api/health
echo ===================================================
echo.
pause
