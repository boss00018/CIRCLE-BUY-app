@echo off
echo Starting CircleBuy Development Environment
echo ==========================================

echo.
echo 1. Starting Server...
cd server
start "CircleBuy Server" cmd /k "npm run dev"
cd ..

echo.
echo 2. Starting Metro Bundler...
cd mobile
start "Metro Bundler" cmd /k "npm start"

echo.
echo 3. Waiting for Metro to start...
timeout /t 10 /nobreak > nul

echo.
echo 4. Starting Android App...
start "Android Build" cmd /k "npm run android"

echo.
echo Development environment started!
echo - Server: http://localhost:8000
echo - Metro: http://localhost:8081
echo - Check the opened terminal windows for logs
echo.
pause