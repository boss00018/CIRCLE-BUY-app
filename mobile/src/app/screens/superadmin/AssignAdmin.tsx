import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import { ENV } from '../../config/env';

// Input validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, '').trim();
}

export default function AssignAdmin() {
  const [email, setEmail] = useState('');
  const [marketplaceId, setMarketplaceId] = useState('');
  const [serverUrl, setServerUrl] = useState(ENV.SERVER_URL || 'http://192.168.0.8:8000');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      
      // Input validation
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedMarketplaceId = sanitizeInput(marketplaceId);
      const sanitizedServerUrl = sanitizeInput(serverUrl);
      
      if (!sanitizedEmail || !sanitizedMarketplaceId) {
        throw new Error('Please fill all required fields');
      }
      
      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Please enter a valid email address');
      }
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('Login required');
      }
      
      const token = await user.getIdToken();
      
      // Add CSRF protection by including user info in request
      const requestBody = {
        email: sanitizedEmail,
        marketplaceId: sanitizedMarketplaceId,
        requesterId: user.uid, // Add requester ID for additional validation
        timestamp: Date.now() // Add timestamp for request freshness
      };
      
      const res = await fetch(`${sanitizedServerUrl}/roles/assign-admin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest' // Additional CSRF protection
        },
        body: JSON.stringify(requestBody)
      });
      
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Request failed');
      }
      
      Alert.alert('Success', 'Admin assigned successfully');
      setEmail('');
      setMarketplaceId('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to assign admin';
      console.error('Error assigning admin:', error);
      Alert.alert('Error', message);
    } finally {
      setBusy(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(sanitizeInput(text));
  };
  
  const handleMarketplaceIdChange = (text: string) => {
    setMarketplaceId(sanitizeInput(text));
  };
  
  const handleServerUrlChange = (text: string) => {
    setServerUrl(sanitizeInput(text));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Admin</Text>
      
      <TextInput 
        placeholder="Admin email" 
        autoCapitalize="none" 
        keyboardType="email-address" 
        value={email} 
        onChangeText={handleEmailChange}
        style={styles.input}
        maxLength={100}
      />
      
      <TextInput 
        placeholder="Marketplace ID" 
        value={marketplaceId} 
        onChangeText={handleMarketplaceIdChange}
        style={styles.input}
        maxLength={50}
      />
      
      <TextInput 
        placeholder="Server URL" 
        value={serverUrl} 
        onChangeText={handleServerUrlChange}
        style={styles.input}
        maxLength={200}
      />
      
      <Pressable 
        onPress={submit} 
        disabled={busy} 
        style={[styles.button, busy && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {busy ? 'Assigning...' : 'Assign'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
});