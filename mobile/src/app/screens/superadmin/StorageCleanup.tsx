import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';

export default function StorageCleanup() {
  const [cleaning, setCleaning] = useState(false);
  const [stats, setStats] = useState({ orphanedProducts: 0, orphanedUsers: 0, orphanedChats: 0 });

  const scanOrphanedData = async () => {
    try {
      setCleaning(true);
      
      // Get all active marketplace domains
      const marketplacesSnap = await firestore().collection('marketplaces').get();
      const activeDomains = marketplacesSnap.docs.map(doc => doc.data().domain);
      const activeMarketplaceIds = marketplacesSnap.docs.map(doc => doc.id);
      
      console.log('Active domains:', activeDomains);
      console.log('Active marketplace IDs:', activeMarketplaceIds);
      
      // Scan orphaned products
      const productsSnap = await firestore().collection('products').get();
      let orphanedProducts = 0;
      
      productsSnap.docs.forEach(doc => {
        const data = doc.data();
        const sellerDomain = data.sellerEmail?.split('@')[1];
        const hasValidDomain = sellerDomain && activeDomains.includes(sellerDomain);
        const hasValidMarketplaceId = data.marketplaceId && activeMarketplaceIds.includes(data.marketplaceId);
        
        if (!hasValidDomain && !hasValidMarketplaceId) {
          orphanedProducts++;
        }
      });
      
      // Scan orphaned users
      const usersSnap = await firestore().collection('users').get();
      let orphanedUsers = 0;
      
      usersSnap.docs.forEach(doc => {
        const data = doc.data();
        const userDomain = data.email?.split('@')[1];
        const hasValidDomain = userDomain && activeDomains.includes(userDomain);
        const hasValidMarketplaceId = data.marketplaceId && activeMarketplaceIds.includes(data.marketplaceId);
        
        if (!hasValidDomain && !hasValidMarketplaceId) {
          orphanedUsers++;
        }
      });
      
      // Scan orphaned chats
      const chatsSnap = await firestore().collection('chats').get();
      let orphanedChats = 0;
      
      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data();
        if (chatData.productId) {
          const productDoc = await firestore().collection('products').doc(chatData.productId).get();
          if (!productDoc.exists) {
            orphanedChats++;
          }
        }
      }
      
      setStats({ orphanedProducts, orphanedUsers, orphanedChats });
      setCleaning(false);
      
      Alert.alert(
        'Scan Complete',
        `Found:\n• ${orphanedProducts} orphaned products\n• ${orphanedUsers} orphaned users\n• ${orphanedChats} orphaned chats`
      );
    } catch (error) {
      console.error('Error scanning orphaned data:', error);
      setCleaning(false);
      Alert.alert('Error', 'Failed to scan orphaned data');
    }
  };

  const cleanupOrphanedData = async () => {
    Alert.alert(
      'Confirm Cleanup',
      `This will permanently delete:\n• ${stats.orphanedProducts} orphaned products\n• ${stats.orphanedUsers} orphaned users\n• ${stats.orphanedChats} orphaned chats\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setCleaning(true);
              
              // Get active marketplace data
              const marketplacesSnap = await firestore().collection('marketplaces').get();
              const activeDomains = marketplacesSnap.docs.map(doc => doc.data().domain);
              const activeMarketplaceIds = marketplacesSnap.docs.map(doc => doc.id);
              
              const batch = firestore().batch();
              let deletedCount = 0;
              
              // Delete orphaned products
              const productsSnap = await firestore().collection('products').get();
              productsSnap.docs.forEach(doc => {
                const data = doc.data();
                const sellerDomain = data.sellerEmail?.split('@')[1];
                const hasValidDomain = sellerDomain && activeDomains.includes(sellerDomain);
                const hasValidMarketplaceId = data.marketplaceId && activeMarketplaceIds.includes(data.marketplaceId);
                
                if (!hasValidDomain && !hasValidMarketplaceId) {
                  batch.delete(doc.ref);
                  deletedCount++;
                }
              });
              
              // Delete orphaned users
              const usersSnap = await firestore().collection('users').get();
              usersSnap.docs.forEach(doc => {
                const data = doc.data();
                const userDomain = data.email?.split('@')[1];
                const hasValidDomain = userDomain && activeDomains.includes(userDomain);
                const hasValidMarketplaceId = data.marketplaceId && activeMarketplaceIds.includes(data.marketplaceId);
                
                if (!hasValidDomain && !hasValidMarketplaceId) {
                  batch.delete(doc.ref);
                  deletedCount++;
                }
              });
              
              // Delete orphaned chats
              const chatsSnap = await firestore().collection('chats').get();
              for (const chatDoc of chatsSnap.docs) {
                const chatData = chatDoc.data();
                if (chatData.productId) {
                  const productDoc = await firestore().collection('products').doc(chatData.productId).get();
                  if (!productDoc.exists) {
                    batch.delete(chatDoc.ref);
                    deletedCount++;
                  }
                }
              }
              
              await batch.commit();
              setCleaning(false);
              setStats({ orphanedProducts: 0, orphanedUsers: 0, orphanedChats: 0 });
              
              Alert.alert('Success', `Deleted ${deletedCount} orphaned records. Storage space freed!`);
            } catch (error) {
              console.error('Error cleaning up orphaned data:', error);
              setCleaning(false);
              Alert.alert('Error', 'Failed to cleanup orphaned data');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧹 Storage Cleanup</Text>
        <Text style={styles.subtitle}>Remove orphaned data to save storage</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Orphaned Data</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.orphanedProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.orphanedUsers}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.orphanedChats}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable 
          style={[styles.button, { backgroundColor: '#3b82f6' }]}
          onPress={scanOrphanedData}
          disabled={cleaning}
        >
          <Text style={styles.buttonText}>
            {cleaning ? '🔍 Scanning...' : '🔍 Scan for Orphaned Data'}
          </Text>
        </Pressable>

        {(stats.orphanedProducts > 0 || stats.orphanedUsers > 0 || stats.orphanedChats > 0) && (
          <Pressable 
            style={[styles.button, { backgroundColor: '#dc2626' }]}
            onPress={cleanupOrphanedData}
            disabled={cleaning}
          >
            <Text style={styles.buttonText}>
              🗑️ Delete All Orphaned Data
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actions: {
    padding: 20,
    gap: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});