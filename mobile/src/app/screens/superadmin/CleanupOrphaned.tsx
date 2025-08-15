import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import authRN from '@react-native-firebase/auth';

export default function CleanupOrphaned() {
  const [loading, setLoading] = React.useState(false);

  const cleanupOrphanedData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      console.log('Starting server-side orphaned data cleanup...');
      
      const token = await authRN().currentUser?.getIdToken();
      console.log('Token obtained, making request...');
      
      const response = await fetch('https://circlebuy-server.onrender.com/cleanup-orphaned-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Cleanup result:', result);
        Alert.alert('Success', `${result.message}\nDeleted: ${result.deletedCount} records`);
      } else {
        const errorText = await response.text();
        console.error('Cleanup failed:', response.status, errorText);
        Alert.alert('Error', `Failed to cleanup: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Error cleaning up orphaned data:', error);
      Alert.alert('Error', `Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧹 Data Cleanup</Text>
      <Text style={styles.description}>
        Remove orphaned data that belongs to deleted marketplaces
      </Text>
      

      
      <Pressable 
        onPress={cleanupOrphanedData} 
        disabled={loading}
        style={[styles.cleanupButton, loading && styles.disabledButton]}
      >
        <Text style={styles.cleanupButtonText}>
          {loading ? '🔄 Cleaning...' : '🗑️ Cleanup Orphaned Data'}
        </Text>
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

  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});