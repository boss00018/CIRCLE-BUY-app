@echo off
echo Testing CircleBuy Build...
echo =========================

echo Clearing Metro cache...
npx react-native start --reset-cache &

timeout /t 3 /nobreak > nul

echo Building APK...
cd android
gradlew clean
gradlew assembleRelease

echo.
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo ✅ APK built successfully!
    echo Location: android\app\build\outputs\apk\release\app-release.apk
) else (
    echo ❌ APK build failed
)
pause