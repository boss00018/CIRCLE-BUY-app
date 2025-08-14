import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { brandHeaderOption } from './headers';
import authRN from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { signOutLocal } from '../state/slices/authSlice';
import { RootState } from '../state/store';
import firestore from '@react-native-firebase/firestore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardHome" component={AdminDashboard} options={{ headerShown: false }} />
      <Stack.Screen 
        name="PendingProducts" 
        component={PendingProductsScreen} 
        options={{ title: 'Pending Products' }} 
      />
      <Stack.Screen 
        name="Users" 
        component={UsersScreen} 
        options={{ title: 'Manage Users' }} 
      />
    </Stack.Navigator>
  );
}

function AdminDashboard({ navigation }: any) {
  const [stats, setStats] = React.useState({ pendingProducts: 0, activeUsers: 0, totalProducts: 0, soldProducts: 0 });
  const [loading, setLoading] = React.useState(true);
  const [marketplaceId, setMarketplaceId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    // Get marketplace ID from Firebase auth token
    const getMarketplaceId = async () => {
      try {
        const user = authRN().currentUser;
        if (user) {
          const tokenResult = await user.getIdTokenResult(true);
          const mpId = tokenResult.claims.marketplaceId as string;
          console.log('Admin marketplace ID:', mpId);
          setMarketplaceId(mpId);
        }
      } catch (error) {
        console.error('Error getting marketplace ID:', error);
        setLoading(false);
      }
    };
    
    getMarketplaceId();
  }, []);
  
  React.useEffect(() => {
    if (!marketplaceId) {
      return;
    }
    
    console.log('Setting up admin listeners for marketplace:', marketplaceId);
    
    // Get marketplace domain and filter by seller email
    const getMarketplaceDomain = async () => {
      try {
        const marketplaceDoc = await firestore().collection('marketplaces').doc(marketplaceId).get();
        const marketplaceData = marketplaceDoc.data();
        
        if (marketplaceData?.domain) {
          const domain = marketplaceData.domain;
          
          // Listen to all products and filter by domain
          const unsubscribeProducts = firestore()
            .collection('products')
            .onSnapshot(
            (snapshot) => {
              const domainProducts = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.sellerEmail && data.sellerEmail.endsWith('@' + domain);
              });
              
              const approved = domainProducts.filter(doc => doc.data().status === 'approved').length;
              const pending = domainProducts.filter(doc => doc.data().status === 'pending').length;
              const sold = domainProducts.filter(doc => doc.data().status === 'sold').length;
              const total = approved + pending + sold;
              console.log('Admin products update - Total:', total, 'Pending:', pending, 'Sold:', sold);
              setStats(prev => ({ ...prev, totalProducts: total, pendingProducts: pending, soldProducts: sold }));
            },
            (error) => console.error('Error loading products:', error)
          );
          
          // Listen to all users and filter by domain
          const unsubscribeUsers = firestore()
            .collection('users')
            .onSnapshot(
            (snapshot) => {
              const domainUsers = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.email && data.email.endsWith('@' + domain);
              });
              console.log('Admin users update:', domainUsers.length);
              setStats(prev => ({ ...prev, activeUsers: domainUsers.length }));
              setLoading(false);
            },
            (error) => {
              console.error('Error loading users:', error);
              setLoading(false);
            }
          );
          
          return () => {
            unsubscribeProducts();
            unsubscribeUsers();
          };
        }
      } catch (error) {
        console.error('Error getting marketplace domain:', error);
        setLoading(false);
      }
    };
    
    getMarketplaceDomain();
  }, [marketplaceId]);
  
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage your marketplace</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.statValue}>{stats.pendingProducts}</Text>
          <Text style={styles.statTitle}>Pending Products</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
          <Text style={styles.statValue}>{stats.activeUsers}</Text>
          <Text style={styles.statTitle}>Active Users</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#059669' }]}>
          <Text style={styles.statValue}>{stats.soldProducts}</Text>
          <Text style={styles.statTitle}>Sold Products</Text>
        </View>
      </View>
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Pressable 
          style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
          onPress={() => navigation.navigate('PendingProducts')}
        >
          <Text style={styles.actionText}>📋 Review Products</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
          onPress={() => navigation.navigate('Users')}
        >
          <Text style={styles.actionText}>👥 Manage Users</Text>
        </Pressable>
      </View>
    </View>
  );
}

const PendingProducts = React.lazy(() => import('../screens/admin/PendingProducts'));
const ApprovedProducts = React.lazy(() => import('../screens/admin/ApprovedProducts'));
const RejectedProducts = React.lazy(() => import('../screens/admin/RejectedProducts'));
const Users = React.lazy(() => import('../screens/admin/Users'));
const PendingLostItems = React.lazy(() => import('../screens/admin/PendingLostItems'));
const PendingRequests = React.lazy(() => import('../screens/admin/PendingRequests'));
const PendingDonations = React.lazy(() => import('../screens/admin/PendingDonations'));

const PendingProductsScreen = () => (
  <React.Suspense fallback={<View style={styles.loading}><Text>Loading...</Text></View>}>
    <PendingProducts />
  </React.Suspense>
);

const ApprovedProductsScreen = () => (
  <React.Suspense fallback={<View style={styles.loading}><Text>Loading...</Text></View>}>
    <ApprovedProducts />
  </React.Suspense>
);

const RejectedProductsScreen = () => (
  <React.Suspense fallback={<View style={styles.loading}><Text>Loading...</Text></View>}>
    <RejectedProducts />
  </React.Suspense>
);

const UsersScreen = () => (
  <React.Suspense fallback={<View style={styles.loading}><Text>Loading...</Text></View>}>
    <Users />
  </React.Suspense>
);

const PendingLostItemsScreen = () => (
  <React.Suspense fallback={<View style={styles.loading}><Text>Loading...</Text></View>}>
    <PendingLostItems />
  </React.Suspense>
);

const PendingRequestsScreen = () => (
  <React.Suspense fallback={<View style={styles.loading}><Text>Loading...</Text></View>}>
    <PendingRequests />
  </React.Suspense>
);

const PendingDonationsScreen = () => (
  <React.Suspense fallback={<View style={styles.loading}><Text>Loading...</Text></View>}>
    <PendingDonations />
  </React.Suspense>
);

function ProductsStack() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor: '#f59e0b',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { height: 50 },
      tabBarLabelStyle: { fontSize: 10 }
    }}>
      <Tab.Screen 
        name="Pending" 
        component={PendingProductsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>⏳</Text> }}
      />
      <Tab.Screen 
        name="Approved" 
        component={ApprovedProductsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>✅</Text> }}
      />
      <Tab.Screen 
        name="Rejected" 
        component={RejectedProductsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>❌</Text> }}
      />
    </Tab.Navigator>
  );
}

function RequestsStack() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { height: 50 },
      tabBarLabelStyle: { fontSize: 9 }
    }}>
      <Tab.Screen 
        name="Lost Items" 
        component={PendingLostItemsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 14, color }}>🔍</Text> }}
      />
      <Tab.Screen 
        name="Product Requests" 
        component={PendingRequestsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 14, color }}>📝</Text> }}
      />
      <Tab.Screen 
        name="Donations" 
        component={PendingDonationsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 14, color }}>🎁</Text> }}
      />
    </Tab.Navigator>
  );
}



function AdminSettings() {
  const dispatch = useDispatch();
  
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await authRN().signOut();
        dispatch(signOutLocal());
      }}
    ]);
  };
  
  return (
    <View style={styles.settings}>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Admin Settings</Text>
        
        <Pressable 
          style={styles.settingItem}
          onPress={() => Alert.alert('Notifications', 'Configure notification preferences for product approvals and user activities.')}
        >
          <Text style={styles.settingText}>🔔 Notifications</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        
        <Pressable 
          style={styles.settingItem}
          onPress={() => Alert.alert('Reports', 'Generate and view marketplace activity reports and analytics.')}
        >
          <Text style={styles.settingText}>📊 Reports</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        
        <Pressable 
          style={styles.settingItem}
          onPress={() => Alert.alert('Marketplace Rules', 'Configure marketplace policies and content guidelines.')}
        >
          <Text style={styles.settingText}>📜 Marketplace Rules</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>
      
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </Pressable>
    </View>
  );
}

export default function AdminStack() {
  return (
    <Tab.Navigator screenOptions={{
      headerTitleAlign: 'center',
      tabBarActiveTintColor: '#f59e0b',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { 
        backgroundColor: '#fff', 
        borderTopColor: '#f59e0b',
        borderTopWidth: 2,
        height: 65,
        paddingBottom: 10,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600'
      }
    }}>
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack} 
        options={{
          ...brandHeaderOption('Admin Dashboard'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text>,
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsStack} 
        options={{
          ...brandHeaderOption('Product Management'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📦</Text>,
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="Requests" 
        component={RequestsStack} 
        options={{
          ...brandHeaderOption('Requests Management'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📝</Text>,
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="Users" 
        component={UsersScreen} 
        options={{
          ...brandHeaderOption('User Management'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👥</Text>
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={AdminSettings} 
        options={{
          ...brandHeaderOption('Settings'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚙️</Text>
        }} 
      />
    </Tab.Navigator>
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
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  settings: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  logoutBtn: {
    backgroundColor: '#f59e0b',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});