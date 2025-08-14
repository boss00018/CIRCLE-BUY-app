import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { getGlobalLostItems, updateGlobalLostItem } from '../user/LostItems';

interface LostItem {
  id: string;
  itemName: string;
  description: string;
  contactDetails: string;
  reporterEmail: string;
  status: string;
  createdAt: any;
}

export default function PendingLostItems() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    const loadItems = () => {
      // Get submitted items from global array
      const submittedItems = getGlobalLostItems().filter(item => item.status === 'pending');
      
      setItems(submittedItems);
      setLoading(false);
    };
    
    loadItems();
    
    // Refresh every 2 seconds to show new submissions
    const interval = setInterval(loadItems, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (itemId: string) => {
    try {
      const approvalTime = new Date().toISOString();
      const expiryTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours from now
      
      // Update in global array with expiry
      updateGlobalLostItem(itemId, { 
        status: 'approved', 
        updatedAt: approvalTime,
        approvedAt: approvalTime,
        expiresAt: expiryTime
      });
      
      // Try Firestore as backup
      try {
        await firestore().collection('lostItems').doc(itemId).update({
          status: 'approved',
          updatedAt: firestore.FieldValue.serverTimestamp(),
          approvedAt: firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        });
      } catch (firestoreError) {
        console.log('Firestore update failed, using global array');
      }
      
      Alert.alert('Success', 'Lost item approved and will be visible for 48 hours.');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve item.');
    }
  };

  const handleReject = async (itemId: string) => {
    Alert.prompt(
      'Reject Lost Item',
      'Reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) return;
            try {
              await firestore().collection('lostItems').doc(itemId).update({
                status: 'rejected',
                rejectionReason: reason.trim(),
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              Alert.alert('Success', 'Lost item rejected.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject item.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: LostItem }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.contact}>Contact: {item.contactDetails}</Text>
      <Text style={styles.reporter}>Reporter: {item.reporterEmail}</Text>
      
      <View style={styles.actions}>
        <Pressable 
          style={[styles.actionButton, { backgroundColor: '#059669' }]}
          onPress={() => handleApprove(item.id)}
        >
          <Text style={styles.actionText}>✅ Approve</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, { backgroundColor: '#dc2626' }]}
          onPress={() => handleReject(item.id)}
        >
          <Text style={styles.actionText}>❌ Reject</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading pending lost items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending lost items</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  contact: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500',
  },
  reporter: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },
  actionText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});