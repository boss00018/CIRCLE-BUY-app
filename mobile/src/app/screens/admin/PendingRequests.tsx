import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { getGlobalProductRequests, updateGlobalProductRequest } from '../user/RequestProducts';

interface ProductRequest {
  id: string;
  productName: string;
  description: string;
  contactDetails: string;
  requesterEmail: string;
  status: string;
  createdAt: any;
}

export default function PendingRequests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    const loadPendingRequests = () => {
      const pendingRequests = getGlobalProductRequests().filter((item: any) => item.status === 'pending');
      setRequests(pendingRequests);
      setLoading(false);
    };
    
    loadPendingRequests();
    const interval = setInterval(loadPendingRequests, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      const approvalTime = new Date().toISOString();
      const expiryTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      
      updateGlobalProductRequest(requestId, { 
        status: 'approved', 
        updatedAt: approvalTime,
        approvedAt: approvalTime,
        expiresAt: expiryTime
      });
      
      Alert.alert('Success', 'Product request approved and will be visible for 48 hours.');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request.');
    }
  };

  const handleReject = async (requestId: string) => {
    Alert.prompt(
      'Reject Product Request',
      'Reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) return;
            try {
              updateGlobalProductRequest(requestId, {
                status: 'rejected',
                rejectionReason: reason.trim(),
                updatedAt: new Date().toISOString()
              });
              Alert.alert('Success', 'Product request rejected.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject request.');
            }
          }
        }
      ]
    );
  };

  const renderRequest = ({ item }: { item: ProductRequest }) => (
    <View style={styles.requestCard}>
      <Text style={styles.productName}>{item.productName}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.contact}>Contact: {item.contactDetails}</Text>
      <Text style={styles.requester}>Requester: {item.requesterEmail}</Text>
      
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
        <Text>Loading pending requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending product requests</Text>
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
  requestCard: {
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
  productName: {
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
  requester: {
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