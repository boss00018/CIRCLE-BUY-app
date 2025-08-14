import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

interface Donation {
  id: string;
  itemName: string;
  description: string;
  contactDetails: string;
  donorEmail: string;
  status: string;
  createdAt: any;
}

export default function PendingDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    setDonations([]);
    setLoading(false);
  }, []);

  const handleApprove = async (donationId: string) => {
    try {
      await firestore().collection('donations').doc(donationId).update({
        status: 'approved',
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      Alert.alert('Success', 'Donation approved and published.');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve donation.');
    }
  };

  const handleReject = async (donationId: string) => {
    Alert.prompt(
      'Reject Donation',
      'Reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) return;
            try {
              await firestore().collection('donations').doc(donationId).update({
                status: 'rejected',
                rejectionReason: reason.trim(),
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              Alert.alert('Success', 'Donation rejected.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject donation.');
            }
          }
        }
      ]
    );
  };

  const renderDonation = ({ item }: { item: Donation }) => (
    <View style={styles.donationCard}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.contact}>Contact: {item.contactDetails}</Text>
      <Text style={styles.donor}>Donor: {item.donorEmail}</Text>
      
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
        <Text>Loading pending donations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={donations}
        keyExtractor={(item) => item.id}
        renderItem={renderDonation}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending donations</Text>
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
  donationCard: {
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
  donor: {
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