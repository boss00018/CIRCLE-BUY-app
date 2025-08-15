import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { superAdminApi } from '../../services/api';

export default function CleanupOrphaned() {
  const [loading, setLoading] = React.useState(false);
  const [migrating, setMigrating] = React.useState(false);

  const cleanupOrphanedData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await superAdminApi.cleanupOrphanedData();
      Alert.alert('Success', `${result.message}\nDeleted: ${result.deletedCount} records`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to cleanup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const migrateUsers = async () => {
    if (migrating) return;
    setMigrating(true);
    try {
      const result = await superAdminApi.migrateUsers();
      Alert.alert('Success', `${result.message}\nMigrated: ${result.migratedCount} users`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to migrate: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧹 Data Cleanup</Text>
      <Text style={styles.description}>
        Migrate existing users and cleanup orphaned data
      </Text>
      
      <Pressable 
        onPress={migrateUsers} 
        disabled={migrating}
        style={[styles.migrateButton, migrating && styles.disabledButton]}
      >
        <Text style={styles.migrateButtonText}>
          {migrating ? '🔄 Migrating...' : '👥 Migrate Users'}
        </Text>
      </Pressable>
      
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
  migrateButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  migrateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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