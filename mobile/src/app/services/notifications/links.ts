import messaging from '@react-native-firebase/messaging';
import { navigate } from '../../navigation/navigationRef';

export function handleInitialNotificationNavigation() {
  // When the app is opened from a quit state.
  messaging().getInitialNotification().then(remoteMessage => {
    if (!remoteMessage?.data) return;
    const { type, productId } = remoteMessage.data;
    if (type === 'moderation' && productId) navigate('Products', { screen: 'ProductReview', params: { productId } });
    if (type === 'submission' && productId) navigate('Products', { screen: 'ProductReview', params: { productId } });
  });
}

export function handleBackgroundNotificationNavigation() {
  // When the app is in background and a notification is tapped.
  const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
    if (!remoteMessage?.data) return;
    const { type, productId } = remoteMessage.data;
    if (type === 'moderation' && productId) navigate('Products', { screen: 'ProductReview', params: { productId } });
    if (type === 'submission' && productId) navigate('Products', { screen: 'ProductReview', params: { productId } });
  });
  return unsubscribe;
}