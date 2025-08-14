# CircleBuy Mobile (React Native)

This is the React Native app for CircleBuy.

## Setup
1. Add `google-services.json` to `android/app/` and `GoogleService-Info.plist` to `ios/`.
2. Install deps: `npm install`
3. Run: `npm run android` or `npm run ios`

## Notes
- Uses Firebase Auth/Firestore/Storage/FCM (React Native Firebase)
- Role-based routing via custom claims; super admin email: `circlebuy0018@gmail.com`.
- Google Sign-In uses Web Client ID in native files; or pass via ENV if needed.