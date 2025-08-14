import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserHome from '../screens/user/Home';
import UserSell from '../screens/user/Sell';
import UserProducts from '../screens/user/MyProducts';
import UserProfile from '../screens/user/Profile';
import ProductDetails from '../screens/user/ProductDetails';
import ChatScreen from '../screens/user/ChatScreen';
import { Text } from 'react-native';
import { brandHeaderOption } from './headers';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={brandHeaderOption('Marketplace')}>
      <Stack.Screen name="HomeList" component={UserHome} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} options={{ title: 'Product Details' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}

export default function UserStack() {
  return (
    <Tab.Navigator screenOptions={{
      headerTitleAlign: 'center',
      tabBarActiveTintColor: '#059669',
      tabBarInactiveTintColor: '#6b7280',
      tabBarStyle: { 
        backgroundColor: '#fff', 
        borderTopColor: '#e5e7eb',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500'
      }
    }}>
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ 
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>
        }} 
      />
      <Tab.Screen 
        name="Sell" 
        component={UserSell} 
        options={{
          ...brandHeaderOption('Sell Product'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>
        }} 
      />
      <Tab.Screen 
        name="MyProducts" 
        component={UserProducts} 
        options={{
          ...brandHeaderOption('My Products'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text>
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={UserProfile} 
        options={{
          ...brandHeaderOption('Profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>
        }} 
      />
    </Tab.Navigator>
  );
}