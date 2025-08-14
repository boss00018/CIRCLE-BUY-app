import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './app/navigation/navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { store, RootState } from './app/state/store';
import { bootstrapAuth } from './app/state/slices/authSlice';
import { initFirebase } from './app/firebase/init';
import { ENV, EnvConfig } from './app/config/env';
import { Text, View, StyleSheet } from 'react-native';
import LoginScreen from './app/screens/auth/LoginScreen';
import AdminStack from './app/navigation/AdminStack';
import SuperAdminStack from './app/navigation/SuperAdminStack';
import BuyerStack from './app/navigation/BuyerStack';
import Chat from './app/screens/user/Chat';
import UnauthorizedScreen from './app/screens/auth/UnauthorizedScreen';
import { registerFcm, listenTokenRefresh } from './app/services/notifications/messaging';
import { setupForegroundNotifications } from './app/services/notifications/foreground';
import { handleInitialNotificationNavigation, handleBackgroundNotificationNavigation } from './app/services/notifications/links';
import { optimizeFirestore } from './app/utils/realtime';
import { realtimeConnection } from './app/services/realtime/connection';
import authRN from '@react-native-firebase/auth';
import ErrorBoundary from './app/components/ErrorBoundary';
import { silentTryCatch } from './app/utils/silentErrorHandler';

// Console logs enabled for debugging

// Initialize Firebase with silent error handling
silentTryCatch(async () => {
  const envConfig = ENV as EnvConfig;
  initFirebase({ FIREBASE_WEB_CLIENT_ID: envConfig?.FIREBASE_WEB_CLIENT_ID });
});

// Initialize Firestore optimizations silently
silentTryCatch(async () => {
  optimizeFirestore();
});

// Initialize realtime connection silently
silentTryCatch(async () => {
  realtimeConnection.initialize();
});

const Stack = createNativeStackNavigator();

function Splash() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashText}>Loading...</Text>
    </View>
  );
}

function RootNav() {
  const dispatch = useDispatch();
  const { status, role, marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => { 
    if (status !== 'unauthorized') {
      dispatch(bootstrapAuth());
    } 
    
    // Initialize FCM registration, foreground notifications, and deep links from notifications
    const initializeNotifications = async () => {
      await silentTryCatch(async () => {
        await registerFcm();
        const unsubToken = listenTokenRefresh();
        const unsubNotif = setupForegroundNotifications();
        handleInitialNotificationNavigation();
        const unsubBg = handleBackgroundNotificationNavigation();
        
        return () => {
          silentTryCatch(async () => {
            if (unsubToken && typeof unsubToken === 'function') unsubToken();
            if (unsubNotif && typeof unsubNotif === 'function') unsubNotif();
            if (unsubBg && typeof unsubBg === 'function') unsubBg();
          });
        };
      });
    };
    
    const cleanup = initializeNotifications();
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [dispatch]);

  if (status === 'checking') {
    return <Splash />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {status === 'unauthorized' ? (
        <Stack.Navigator>
          <Stack.Screen name="Unauthorized" component={UnauthorizedScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      ) : status !== 'authenticated' ? (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : role === 'super_admin' ? (
        <SuperAdminStack />
      ) : role === 'admin' ? (
        <AdminStack />
      ) : role === 'user' ? (
        <BuyerStack />
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Unauthorized" component={UnauthorizedScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <RootNav />
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    fontSize: 16,
    color: '#6b7280',
  },
});