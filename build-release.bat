@echo off
echo Building CircleBuy Release APK...

cd mobile

echo Cleaning previous builds...
call npx react-native clean

echo Installing dependencies...
call npm install

echo Building release APK...
cd android
call gradlew assembleRelease

echo Build complete! APK location:
echo android\app\build\outputs\apk\release\app-release.apk

pause