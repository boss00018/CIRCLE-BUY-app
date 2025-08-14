@echo off
echo ========================================
echo CircleBuy - Ready to Run!
echo ========================================
echo.
echo Super Admin: circlebuy0018@gmail.com
echo Firebase: Configured
echo Service Account: Ready
echo.

echo 1. Installing Dependencies...
cd server
call npm install
cd ..\mobile
call npm install

echo.
echo 2. Starting Backend Server...
cd ..\server
start "CircleBuy Server" cmd /k "npm run dev"

echo.
echo 3. Starting Metro Bundler...
cd ..\mobile
start "Metro Bundler" cmd /k "npm start"

echo.
echo 4. Building APK...
timeout /t 5 /nobreak > nul
call npm run build:android

echo.
echo ========================================
echo APK Location:
echo mobile\android\app\build\outputs\apk\release\app-release.apk
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Super Admin: circlebuy0018@gmail.com
echo.
pause