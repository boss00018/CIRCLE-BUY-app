import messaging from '@react-native-firebase/messaging';
import { saveFcmToken, removeFcmToken } from '../firestore/usersRepo';
import { Platform } from 'react-native';

export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function registerFcm(): Promise<string | null> {
  try {
    const enabled = await requestNotificationPermission();
    if (!enabled) return null;
    
    const token = await messaging().getToken();
    if (!token) {
      return null;
    }
    
    await saveFcmToken(token, Platform.OS === 'ios' ? 'ios' : 'android').catch(() => {});
    return token;
  } catch (error) {
    // Silently handle FCM errors
    return null;
  }
}

export function listenTokenRefresh() {
  return messaging().onTokenRefresh(async (token) => {
    try {
      if (token) {
        await saveFcmToken(token, Platform.OS === 'ios' ? 'ios' : 'android').catch(() => {});
      }
    } catch (error) {
      // Silently handle token refresh errors
    }
  });
}

export async function cleanupFcm() {
  const token = await messaging().getToken().catch(() => null);
  if (token) await removeFcmToken(token);
}