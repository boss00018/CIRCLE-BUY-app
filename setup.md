# CircleBuy Setup Guide

## Prerequisites

1. Node.js (v16 or higher)
2. React Native development environment
3. Firebase project with Authentication, Firestore, and Storage enabled
4. Google Cloud Console project for Google Sign-In

## Setup Steps

### 1. Server Setup

```bash
cd server
npm install
cp .env.sample .env
```

Edit `.env` file:
- Set `GOOGLE_APPLICATION_CREDENTIALS` to your Firebase service account key path
- Set `SUPERADMIN_EMAIL` to your admin email
- Set `PORT` if different from 8000

### 2. Mobile App Setup

```bash
cd mobile
npm install
cp .env.sample .env
```

Edit `.env` file:
- Set `FIREBASE_WEB_CLIENT_ID` from your Firebase project settings
- Set `SERVER_URL` to your server URL (default: http://localhost:8000)

### 3. Firebase Configuration

1. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) from Firebase Console
2. Place them in the appropriate directories:
   - Android: `mobile/android/app/google-services.json`
   - iOS: `mobile/ios/GoogleService-Info.plist`

### 4. Security Configuration

1. Remove hardcoded API keys from any committed files
2. Use environment variables for all sensitive configuration
3. Ensure Firebase security rules are properly configured

### 5. Build and Run

#### Server
```bash
cd server
npm run dev
```

#### Mobile App
```bash
cd mobile
# For Android
npm run android

# For iOS
npm run ios
```

## Security Notes

- Never commit `.env` files or Firebase configuration files to version control
- Use Firebase security rules to protect your data
- Implement proper input validation on both client and server
- Use HTTPS in production
- Regularly update dependencies for security patches

## Troubleshooting

1. **Google Sign-In not working**: Ensure `FIREBASE_WEB_CLIENT_ID` is correctly set
2. **Server connection issues**: Check `SERVER_URL` in mobile app configuration
3. **Firebase errors**: Verify Firebase configuration files are in correct locations
4. **Build errors**: Clear node_modules and reinstall dependencies