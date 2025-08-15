import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/user/Home';
import ProductDetails from '../screens/user/ProductDetails';
import SellScreen from '../screens/buyer/Sell';
import MyListings from '../screens/seller/MyListings';
import Chat from '../screens/user/Chat';
import ChatList from '../screens/user/ChatList';
import LostItems from '../screens/user/LostItems';
import RequestProducts from '../screens/user/RequestProducts';
import Donations from '../screens/user/Donations';
import Messages from '../screens/user/Messages';
import { lostItemsApi, productRequestsApi } from '../services/api';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { brandHeaderOption } from './headers';
import authRN from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { signOutLocal } from '../state/slices/authSlice';
import { RootState } from '../state/store';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Sanitize title to prevent XSS-like issues
function sanitizeTitle(title: string): string {
  return title.replace(/[<>"'&]/g, '').trim();
}

interface PlaceholderProps {
  title: string;
}

function Placeholder({ title }: PlaceholderProps) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{sanitizeTitle(title)}</Text>
    </View>
  );
}

// Create memoized components to avoid recreation on every render
const SearchPlaceholder = React.memo(() => <Placeholder title="Search" />);
function MenuScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => {
        await authRN().signOut();
        dispatch(signOutLocal());
      }}
    ]);
  };
  
  const menuItems = [
    { title: 'Lost Items', icon: '🔍', action: () => navigation.navigate('LostItems') },
    { title: 'Request Products', icon: '📝', action: () => navigation.navigate('RequestProducts') },
    { title: 'Donate Items', icon: '🎁', action: () => navigation.navigate('Donations') },
    { title: 'Profile Settings', icon: '👤', action: () => {} },
    { title: 'Notifications', icon: '🔔', action: () => {} },
    { title: 'Help & Support', icon: '❓', action: () => {} },
    { title: 'About', icon: 'ℹ️', action: () => {} },
  ];
  
  return (
    <View style={styles.menu}>
      <View style={styles.userSection}>
        <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>
      
      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <Pressable key={index} style={styles.menuItem} onPress={item.action}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        ))}
      </View>
      
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const MenuPlaceholder = React.memo(MenuScreen);

function ProductRequestsAnnouncement({ navigation }: any) {
  const [approvedRequests, setApprovedRequests] = React.useState<any[]>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  
  React.useEffect(() => {
    const loadApprovedRequests = async () => {
      try {
        const response = await productRequestsApi.getAll('approved');
        setApprovedRequests(response.requests || []);
      } catch (error) {
        setApprovedRequests([]);
      }
    };
    
    loadApprovedRequests();
    const interval = setInterval(loadApprovedRequests, 1500);
    return () => clearInterval(interval);
  }, []);
  
  // Auto-scroll animation
  React.useEffect(() => {
    if (approvedRequests.length > 1) {
      const scrollInterval = setInterval(() => {
        setScrollPosition(prev => {
          const newPosition = prev + 150;
          const maxScroll = (approvedRequests.length - 1) * 150;
          const nextPos = newPosition > maxScroll ? 0 : newPosition;
          
          scrollViewRef.current?.scrollTo({ x: nextPos, animated: true });
          return nextPos;
        });
      }, 3000);
      
      return () => clearInterval(scrollInterval);
    }
  }, [approvedRequests]);
  
  if (approvedRequests.length === 0) return null;
  
  return (
    <View style={{ backgroundColor: '#dbeafe', padding: 8, borderBottomWidth: 1, borderBottomColor: '#3b82f6' }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: '#1e40af', marginBottom: 2 }}>
        📝 Product Requests:
      </Text>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {approvedRequests.map((item, index) => (
          <Pressable 
            key={item.id}
            style={{ width: 150, marginRight: 15, paddingVertical: 2 }}
            onPress={() => navigation.navigate('RequestProducts')}
          >
            <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '500' }}>
              {item.productName} - {item.description.substring(0, 30)}...
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function HomeWithAnnouncement({ navigation }: any) {
  const [approvedItems, setApprovedItems] = React.useState<any[]>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  
  React.useEffect(() => {
    const loadApprovedItems = async () => {
      try {
        const response = await lostItemsApi.getAll('approved');
        setApprovedItems(response.items || []);
      } catch (error) {
        setApprovedItems([]);
      }
    };
    
    loadApprovedItems();
    const interval = setInterval(loadApprovedItems, 1500);
    return () => clearInterval(interval);
  }, []);
  
  // Auto-scroll animation
  React.useEffect(() => {
    if (approvedItems.length > 1) {
      const scrollInterval = setInterval(() => {
        setScrollPosition(prev => {
          const newPosition = prev + 200;
          const maxScroll = (approvedItems.length - 1) * 200;
          const nextPos = newPosition > maxScroll ? 0 : newPosition;
          
          scrollViewRef.current?.scrollTo({ x: nextPos, animated: true });
          return nextPos;
        });
      }, 3000);
      
      return () => clearInterval(scrollInterval);
    }
  }, [approvedItems]);
  
  return (
    <View style={{ flex: 1 }}>
      {approvedItems.length > 0 && (
        <View style={{ backgroundColor: '#fef3c7', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f59e0b' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4 }}>
            🔍 Lost & Found:
          </Text>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            {approvedItems.map((item, index) => (
              <Pressable 
                key={item.id}
                style={{ width: 200, marginRight: 20, paddingVertical: 4 }}
                onPress={() => navigation.navigate('LostItems')}
              >
                <Text style={{ fontSize: 14, color: '#78350f', fontWeight: '500' }}>
                  {item.itemName} - {item.description.substring(0, 40)}...
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Smaller Product Requests Announcement */}
      <ProductRequestsAnnouncement navigation={navigation} />
      
      <HomeScreen navigation={navigation} />
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={brandHeaderOption('Buyer')}>
      <Stack.Screen name="HomeList" component={HomeWithAnnouncement} options={{ title: 'Home' }} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} options={{ title: 'Details' }} />
      <Stack.Screen name="Chat" component={Chat} options={{ title: 'Chat' }} />
      <Stack.Screen name="ChatList" component={ChatList} options={{ title: 'Messages' }} />
      <Stack.Screen name="LostItems" component={LostItems} options={{ title: 'Lost Items' }} />
      <Stack.Screen name="RequestProducts" component={RequestProducts} options={{ title: 'Request Products' }} />
      <Stack.Screen name="Donations" component={Donations} options={{ title: 'Donations' }} />
      <Stack.Screen name="Messages" component={Messages} options={{ title: 'Messages' }} />
    </Stack.Navigator>
  );
}

export default function BuyerStack() {
  return (
    <Tab.Navigator screenOptions={{
      headerTitleAlign: 'center',
      tabBarActiveTintColor: '#059669',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { 
        backgroundColor: '#fff', 
        borderTopColor: '#059669',
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
        name="Home" 
        component={HomeStack} 
        options={{ 
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>
        }} 
      />
      <Tab.Screen 
        name="Messages" 
        component={ChatList} 
        options={{
          ...brandHeaderOption('Messages'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💬</Text>
        }} 
      />
      <Tab.Screen 
        name="Sell" 
        component={SellScreen} 
        options={{
          ...brandHeaderOption('Sell Product'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>➕</Text>
        }} 
      />
      <Tab.Screen 
        name="MyListings" 
        component={MyListings} 
        options={{
          ...brandHeaderOption('My Products'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📦</Text>
        }} 
      />
      <Tab.Screen 
        name="Menu" 
        component={MenuPlaceholder} 
        options={{
          ...brandHeaderOption('Menu'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>☰</Text>
        }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
  },
  menu: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  userSection: {
    backgroundColor: '#059669',
    padding: 24,
    paddingTop: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#dcfce7',
  },
  menuList: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
  },

});