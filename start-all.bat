@echo off
cd /d "%~dp0"
start "" "%~dp0start-backend.vbs"
timeout /t 3 /nobreak >nul
start "" "%~dp0start-frontend.vbs"
