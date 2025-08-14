import React, { useEffect } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import authRN from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { ENV, EnvConfig } from '../../config/env';
import { useDispatch } from 'react-redux';
import { bootstrapAuth, setUnauthorized } from '../../state/slices/authSlice';

export default function LoginScreen() {
  const dispatch = useDispatch();
  useEffect(() => {
    // Configure centrally in initFirebase; keep here as no-op fallback if needed
    const envConfig = ENV as EnvConfig;
    if (envConfig?.FIREBASE_WEB_CLIENT_ID) {
      try {
        GoogleSignin.configure({ 
          webClientId: envConfig.FIREBASE_WEB_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (error) {
        // Silently handle GoogleSignin configuration errors
      }
    }
  }, []);

  const onGooglePress = async () => {
    try {
      const envConfig = ENV as EnvConfig;
      
      if (!envConfig?.FIREBASE_WEB_CLIENT_ID) {
        Alert.alert(
          'Configuration needed', 
          'Missing FIREBASE_WEB_CLIENT_ID. Please provide the Web Client ID from Firebase in src/app/config/env.ts.'
        );
        return;
      }
      
      // Force reconfigure
      GoogleSignin.configure({ 
        webClientId: envConfig.FIREBASE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
      
      // Sign out first if already signed in
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Silently handle sign out errors
      }
      
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
      const signInResult = await GoogleSignin.signIn();
      
      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        throw new Error('Failed to get ID token from Google Sign-In');
      }
      
      console.log('Google Sign-In successful, attempting Firebase auth...');
      const googleCredential = authRN.GoogleAuthProvider.credential(idToken);
      const userCredential = await authRN().signInWithCredential(googleCredential);
      console.log('Firebase auth successful for:', userCredential.user.email);
      
      // Try to connect to backend server
      try {
        const token = await userCredential.user.getIdToken();
        console.log('Got Firebase token:', token ? 'Present' : 'Missing');
        console.log('Token length:', token?.length || 0);
        console.log('Trying to connect to backend at: http://192.168.0.8:8000');
        
        const response = await fetch('http://192.168.0.8:8000/auth/assign-role', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Backend connected successfully:', data);
          
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL
          };
          
          dispatch({ 
            type: 'auth/updateAuthState', 
            payload: { 
              status: 'authenticated', 
              role: data.role, 
              user: userData,
              marketplaceId: data.marketplaceId 
            } 
          });
          return;
        } else if (response.status === 403) {
          console.log('Access denied by server - unauthorized domain');
          await authRN().signOut();
          dispatch(setUnauthorized());
          return;
        } else {
          console.log('Server responded with error:', response.status);
        }
      } catch (error) {
        console.log('Backend connection error:', error.message);
        // Only allow offline mode for SuperAdmin
        const email = userCredential.user.email;
        if (email === 'circlebuy0018@gmail.com') {
          console.log('Offline SuperAdmin access:', email);
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL
          };
          dispatch({ 
            type: 'auth/updateAuthState', 
            payload: { 
              status: 'authenticated', 
              role: 'super_admin', 
              user: userData,
              marketplaceId: null 
            } 
          });
          return;
        } else {
          console.log('Network error - signing out non-admin user');
          await authRN().signOut();
          dispatch(setUnauthorized());
          return;
        }
      }
      
      // Login successful
    } catch (error: unknown) {
      console.log('Login error:', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        console.log('Error code:', error.code);
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }
      }
      
      Alert.alert('Login Error', 'Failed to sign in. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to CircleBuy</Text>
      <Pressable onPress={onGooglePress} style={styles.button}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#111827',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});