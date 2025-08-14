import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

async function ensureChannel() {
  await notifee.createChannel({ id: 'default', name: 'Default', importance: AndroidImportance.HIGH });
}

export function setupForegroundNotifications() {
  ensureChannel();
  const unsub = messaging().onMessage(async (remoteMessage) => {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'CircleBuy',
      body: remoteMessage.notification?.body || '',
      android: { channelId: 'default' },
      data: remoteMessage.data || {},
    });
  });
  return unsub;
}