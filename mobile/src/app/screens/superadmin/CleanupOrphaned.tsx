import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import authRN from '@react-native-firebase/auth';

export default function CleanupOrphaned() {
  const cleanupOrphanedData = async () => {
    try {
      console.log('Starting server-side orphaned data cleanup...');
      
      const token = await authRN().currentUser?.getIdToken();
      const response = await fetch('https://circlebuy-server.onrender.com/cleanup-orphaned-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Cleanup result:', result);
        Alert.alert('Success', result.message);
      } else {
        console.error('Cleanup failed:', response.status);
        Alert.alert('Error', 'Failed to cleanup orphaned data');
      }
    } catch (error: any) {
      console.error('Error cleaning up orphaned data:', error);
      Alert.alert('Error', 'Failed to cleanup orphaned data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧹 Data Cleanup</Text>
      <Text style={styles.description}>
        Remove orphaned data that belongs to deleted marketplaces
      </Text>
      
      <Pressable onPress={cleanupOrphanedData} style={styles.cleanupButton}>
        <Text style={styles.cleanupButtonText}>🗑️ Cleanup Orphaned Data</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  cleanupButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cleanupButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});