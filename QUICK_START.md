# Quick Start Guide

## ✅ Pre-configured Settings

**Firebase Web Client ID**: `999994603165-q9dh53nltumv8sbj6lnbv4loe8q0j4q7.apps.googleusercontent.com`
**Super Admin Email**: `circlebuy0018@gmail.com`
**Firebase Config**: Already added for Android & iOS

## 🚀 Steps to Run

### 1. Install Dependencies
```bash
# Server
cd server
npm install

# Mobile
cd ../mobile
npm install
```

### 2. Download Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `circlebuy-5a8d9`
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save as `firebase-service-account.json` in `server/` folder

### 3. Start Backend
```bash
cd server
npm run dev
# Server runs at http://localhost:8000
```

### 4. Build & Run APK
```bash
cd ../mobile

# For development
npm run android

# For release APK
npm run build:android
```

### 5. APK Location
```
mobile/android/app/build/outputs/apk/debug/app-debug.apk
mobile/android/app/build/outputs/apk/release/app-release.apk
```

### 6. Login Credentials
- **Super Admin**: `circlebuy0018@gmail.com` (Google Sign-In)
- **Any Google Account**: Will be assigned "buyer" role by default

### 7. Real-time Features
- ✅ Live product updates
- ✅ Real-time notifications  
- ✅ Instant admin actions
- ✅ Live marketplace sync

## 📱 For Physical Device Testing
Update `mobile/.env`:
```
SERVER_URL=http://YOUR_COMPUTER_IP:8000
```
Replace `YOUR_COMPUTER_IP` with your actual IP address.