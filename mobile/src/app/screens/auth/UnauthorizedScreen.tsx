import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import authRN from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useDispatch } from 'react-redux';
import { signOutLocal } from '../../state/slices/authSlice';

export default function UnauthorizedScreen() {
  const dispatch = useDispatch();
  
  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore Google sign out errors
    }
    try {
      await authRN().signOut();
    } catch (e) {
      // Ignore Firebase sign out errors
    }
    dispatch(signOutLocal());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unauthorized Access</Text>
      <Text style={styles.message}>
        You are unauthorized to visit this application. 
        Please login with your university email that is collaborated with us.
      </Text>
      <Text style={styles.submessage}>
        No other emails are allowed to access this marketplace.
      </Text>
      
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Try Different Account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  submessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});