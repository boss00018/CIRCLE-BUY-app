@echo off
echo Building CircleBuy APK...
echo ========================

cd android
call gradlew assembleRelease

echo.
echo APK built successfully!
echo Location: android\app\build\outputs\apk\release\app-release.apk
echo.
pause