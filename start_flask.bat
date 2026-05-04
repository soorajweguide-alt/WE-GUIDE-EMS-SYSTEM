@echo off
echo ===================================================
echo   WE GUIDE - Employee Management System
echo   Starting Flask Backend...
echo ===================================================
echo.

cd /d "%~dp0\flask_backend"

echo Checking Python dependencies...
python -m pip install -r requirements.txt

echo.
echo Starting Flask App (Port 5000)...
python app.py

pause
