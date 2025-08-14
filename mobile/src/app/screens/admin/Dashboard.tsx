import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalProducts: 0, pendingProducts: 0, totalUsers: 0 });
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!marketplaceId) return;

    console.log('Admin dashboard loading for marketplace:', marketplaceId);

    // Listen to products
    const unsubProducts = firestore()
      .collection('products')
      .where('marketplaceId', '==', marketplaceId)
      .onSnapshot((snapshot) => {
        const total = snapshot.size;
        const pending = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
        console.log('Admin dashboard - Products:', { total, pending });
        setStats(prev => ({ ...prev, totalProducts: total, pendingProducts: pending }));
      });

    // Listen to users
    const unsubUsers = firestore()
      .collection('users')
      .where('marketplaceId', '==', marketplaceId)
      .onSnapshot((snapshot) => {
        console.log('Admin dashboard - Users:', snapshot.size);
        setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
      });

    return () => {
      unsubProducts();
      unsubUsers();
    };
  }, [marketplaceId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Marketplace: {marketplaceId}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingProducts}</Text>
          <Text style={styles.statLabel}>Pending Products</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});