import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { productRequestsApi } from '../services/api';

export default function ConnectionTest() {
  const [status, setStatus] = useState('Not tested');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test basic connection
      const testResult = await productRequestsApi.test();
      console.log('Test result:', testResult);
      
      // Test authenticated connection
      const healthResult = await productRequestsApi.health();
      console.log('Health result:', healthResult);
      
      if (healthResult.error) {
        setStatus(`❌ Auth Failed: ${healthResult.error}`);
      } else {
        setStatus(`✅ Connected & Authenticated`);
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server Connection Test</Text>
      <Text style={styles.status}>{status}</Text>
      <Pressable 
        style={styles.button} 
        onPress={testConnection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Again'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    marginBottom: 12,
    color: '#374151',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});