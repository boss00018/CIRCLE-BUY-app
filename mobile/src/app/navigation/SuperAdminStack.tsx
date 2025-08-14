import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SuperAdminDashboard from '../screens/superadmin/Dashboard';
import Marketplaces from '../screens/superadmin/Marketplaces';
import AssignAdmin from '../screens/superadmin/AssignAdmin';
import CleanupOrphaned from '../screens/superadmin/CleanupOrphaned';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { brandHeaderOption } from './headers';
import authRN from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { signOutLocal } from '../state/slices/authSlice';

const Tab = createBottomTabNavigator();

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

const AnalyticsPlaceholder = React.memo(() => <Placeholder title="Analytics" />);

function SettingsScreen() {
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
        <Text style={styles.settingsTitle}>Super Admin Settings</Text>
        
        <View style={styles.settingsSection}>
          <Pressable 
            style={styles.settingItem}
            onPress={() => Alert.alert('Security Settings', 'Configure system security, API keys, and access controls.')}
          >
            <Text style={styles.settingText}>🔒 Security Settings</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => Alert.alert('System Monitoring', 'View system health, performance metrics, and uptime statistics.')}
          >
            <Text style={styles.settingText}>📊 System Monitoring</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => Alert.alert('Email Notifications', 'Configure email alerts for system events and admin notifications.')}
          >
            <Text style={styles.settingText}>📧 Email Notifications</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => Alert.alert('System Logs', 'View detailed system logs, error reports, and audit trails.')}
          >
            <Text style={styles.settingText}>📝 System Logs</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => Alert.alert('Backup & Recovery', 'Manage data backups and system recovery options.')}
          >
            <Text style={styles.settingText}>💾 Backup & Recovery</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>
      </View>
      
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </Pressable>
    </View>
  );
}

const SettingsPlaceholder = React.memo(SettingsScreen);

export default function SuperAdminStack() {
  return (
    <Tab.Navigator screenOptions={{
      headerTitleAlign: 'center',
      tabBarActiveTintColor: '#dc2626',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { 
        backgroundColor: '#fff', 
        borderTopColor: '#dc2626',
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
        fontSize: 10,
        fontWeight: '600'
      }
    }}>
      <Tab.Screen 
        name="Dashboard" 
        component={SuperAdminDashboard} 
        options={{
          ...brandHeaderOption('Super Admin Dashboard'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text>
        }} 
      />
      <Tab.Screen 
        name="Marketplaces" 
        component={Marketplaces} 
        options={{
          ...brandHeaderOption('Marketplaces'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏢</Text>
        }} 
      />
      <Tab.Screen 
        name="Cleanup" 
        component={CleanupOrphaned} 
        options={{
          ...brandHeaderOption('Data Cleanup'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🧹</Text>
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsPlaceholder} 
        options={{
          ...brandHeaderOption('Settings'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚙️</Text>
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
  settingsSection: {
    gap: 4,
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
    backgroundColor: '#dc2626',
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
});