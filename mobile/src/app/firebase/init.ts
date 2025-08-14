// React Native Firebase initialization helpers
// Native config is read from google-services.json (Android) and GoogleService-Info.plist (iOS)
import firebaseApp from '@react-native-firebase/app';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import storageModule from '@react-native-firebase/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const app = firebaseApp;
export const auth = authModule;
export const db = firestoreModule();
export const storage = storageModule();

export type EnvConfig = {
  FIREBASE_WEB_CLIENT_ID?: string; // for Google Sign-In
};

export function initFirebase(env?: EnvConfig) {
  // RNFirebase initializes natively. Here we centralize Google Sign-In configuration.
  try {
    if (env?.FIREBASE_WEB_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: env.FIREBASE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: false,
      });
    } else {
      console.warn('FIREBASE_WEB_CLIENT_ID not configured - Google Sign-In may not work');
    }
  } catch (error) {
    console.warn('GoogleSignin.configure failed:', error);
  }
}