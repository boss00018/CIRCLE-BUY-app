import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import firestore from '@react-native-firebase/firestore';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  pendingProducts: number;
  totalMarketplaces: number;
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProducts: 0, pendingProducts: 0, totalMarketplaces: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listeners for dashboard stats
    const unsubscribeMarketplaces = firestore()
      .collection('marketplaces')
      .onSnapshot(
        (snapshot) => {
          const marketplaceCount = snapshot.size;
          setStats(prev => ({ ...prev, totalMarketplaces: marketplaceCount }));
        },
        (error) => {} // Silent error handling
      );
    
    const unsubscribeProducts = firestore()
      .collection('products')
      .onSnapshot(
        (snapshot) => {
          const totalProducts = snapshot.size;
          const pendingProducts = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
          setStats(prev => ({ ...prev, totalProducts, pendingProducts }));
        },
        (error) => {} // Silent error handling
      );
    
    const unsubscribeUsers = firestore()
      .collection('users')
      .onSnapshot(
        (snapshot) => {
          const totalUsers = snapshot.size;
          setStats(prev => ({ ...prev, totalUsers }));
          setLoading(false);
        },
        (error) => {
          setLoading(false);
        }
      );
    
    return () => {
      unsubscribeMarketplaces();
      unsubscribeProducts();
      unsubscribeUsers();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Super Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage your marketplace ecosystem</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <StatCard title="Total Products" value={stats.totalProducts} color="#3b82f6" />
        <StatCard title="Pending Approval" value={stats.pendingProducts} color="#f59e0b" />
        <StatCard title="Marketplaces" value={stats.totalMarketplaces} color="#10b981" />
        <StatCard title="Active Users" value={stats.totalUsers} color="#8b5cf6" />
      </View>
      

    </ScrollView>
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
  loading: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
  },
  statsGrid: {
    padding: 20,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});