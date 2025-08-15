import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

interface User {
  id: string;
  email: string;
  name: string;
  blocked: boolean;
  createdAt: any;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!marketplaceId) {
      setLoading(false);
      return;
    }

    console.log('Loading users for marketplace:', marketplaceId);

    const unsubscribe = firestore()
      .collection('users')
      .where('marketplaceId', '==', marketplaceId)
      .onSnapshot(
        (snapshot) => {
          const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
          
          console.log('Users found for marketplace:', users.length);
          console.log('Users data:', users);
          
          setUsers(users);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading users:', error);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [marketplaceId]);

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'unblock' : 'block';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: currentlyBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('users').doc(userId).update({
                blocked: !currentlyBlocked,
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              console.log(`User ${action}ed successfully`);
            } catch (error) {
              console.error(`Failed to ${action} user`);
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.blocked ? '#fee2e2' : '#dcfce7' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.blocked ? '#dc2626' : '#166534' }
            ]}>
              {item.blocked ? '🚫 Blocked' : '✅ Active'}
            </Text>
          </View>
        </View>
      </View>
      
      <Pressable 
        style={[
          styles.actionButton,
          { backgroundColor: item.blocked ? '#059669' : '#dc2626' }
        ]}
        onPress={() => handleBlockUser(item.id, item.blocked)}
      >
        <Text style={styles.actionText}>
          {item.blocked ? 'Unblock' : 'Block'}
        </Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found</Text>
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
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
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