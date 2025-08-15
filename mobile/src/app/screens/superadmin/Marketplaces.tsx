import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import authRN from '@react-native-firebase/auth';

interface Marketplace {
  id: string;
  name: string;
  domain: string;
  adminEmail: string;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

// Input validation and sanitization
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, '').trim();
}

function validateDomain(domain: string): boolean {
  // Allow domains like university.edu, college.ac.in, school.org, etc.
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  const isValid = domainRegex.test(domain) && domain.length >= 4;
  console.log('Validating domain:', domain, 'Result:', isValid);
  return isValid;
}

export default function Marketplaces() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const unsub = firestore()
      .collection('marketplaces')
      .onSnapshot(
        (snap) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Marketplace[];
            setMarketplaces(items);
          }, 300); // Throttle updates
        },
        (error) => {}
      );
    return () => {
      clearTimeout(timeoutId);
      unsub();
    };
  }, []);

  const create = async () => {
    try {
      const sanitizedName = sanitizeInput(name);
      const sanitizedDomain = sanitizeInput(domain);
      const sanitizedEmail = sanitizeInput(adminEmail);
      
      if (!sanitizedName || !sanitizedDomain || !sanitizedEmail) {
        return Alert.alert('Error', 'Please fill all fields');
      }
      
      if (!validateEmail(sanitizedEmail)) {
        return Alert.alert('Error', 'Please enter a valid email address');
      }
      
      if (!validateDomain(sanitizedDomain)) {
        console.log('Domain validation failed for:', sanitizedDomain);
        return Alert.alert('Error', `Please enter a valid domain (e.g., university.edu). You entered: ${sanitizedDomain}`);
      }
      
      console.log('Creating marketplace with domain:', sanitizedDomain);
      
      // Create via server API
      const token = await authRN().currentUser?.getIdToken();
      const response = await fetch('https://circlebuy-server.onrender.com/marketplaces/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: sanitizedName,
          domain: sanitizedDomain,
          adminEmail: sanitizedEmail
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Marketplace created via server:', result);
      
      setName('');
      setDomain('');
      setAdminEmail('');
      Alert.alert('Success', 'Marketplace created successfully');
    } catch (error) {
      console.error('Error creating marketplace:', error);
      Alert.alert('Error', 'Failed to create marketplace');
    }
  };

  const toggle = async (id: string, status: string) => {
    try {
      if (!id || !status) return;
      
      const next = status === 'active' ? 'inactive' : 'active';
      await firestore().collection('marketplaces').doc(id).update({ 
        status: next, 
        updatedAt: firestore.FieldValue.serverTimestamp() 
      });
    } catch (error) {
      console.error('Error toggling marketplace status:', error);
      Alert.alert('Error', 'Failed to update marketplace status');
    }
  };

  const remove = async (id: string) => {
    try {
      if (!id) return;
      
      const marketplace = marketplaces.find(m => m.id === id);
      if (!marketplace) return;
      
      Alert.alert(
        'Confirm Delete',
        `This will permanently delete "${marketplace.name}" and ALL associated data (users, products, chats). This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Everything',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('=== SERVER-SIDE DELETION START ===');
                
                // Call server endpoint for complete deletion
                const token = await authRN().currentUser?.getIdToken();
                const response = await fetch(`https://circlebuy-server.onrender.com/marketplaces/${id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Server deletion result:', result);
                  Alert.alert('Success', 'Marketplace and all associated data deleted successfully');
                } else {
                  console.error('Server deletion failed:', response.status);
                  const errorText = await response.text();
                  Alert.alert('Error', `Failed to delete marketplace: ${errorText}`);
                }
              } catch (error) {
                Alert.alert('Error', error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting marketplace:', error);
      Alert.alert('Error', 'Failed to delete marketplace');
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:'#f9fafb' }}>
      <View style={{ backgroundColor:'#fff', padding:20, borderBottomWidth:1, borderBottomColor:'#e5e7eb' }}>
        <Text style={{ fontSize:28, fontWeight:'bold', color:'#111827', marginBottom:8 }}>Marketplaces</Text>
        <Text style={{ color:'#6b7280', fontSize:16 }}>Manage university marketplaces</Text>
      </View>
      
      <View style={{ backgroundColor:'#fff', margin:20, borderRadius:16, padding:20, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:8, elevation:4 }}>
        <Text style={{ fontSize:18, fontWeight:'600', color:'#111827', marginBottom:16 }}>🏢 Create New Marketplace</Text>
        <View style={{ gap:12 }}>
          <TextInput 
            placeholder="University Name" 
            value={name} 
            onChangeText={setName} 
            style={{ borderWidth:1, borderColor:'#d1d5db', borderRadius:12, padding:16, fontSize:16, backgroundColor:'#fff', color:'#111827' }} 
            placeholderTextColor="#9ca3af"
          />
          <TextInput 
            placeholder="Domain (e.g., university.edu)" 
            value={domain} 
            onChangeText={setDomain} 
            style={{ borderWidth:1, borderColor:'#d1d5db', borderRadius:12, padding:16, fontSize:16, backgroundColor:'#fff', color:'#111827' }} 
            placeholderTextColor="#9ca3af"
          />
          <TextInput 
            placeholder="Admin Email" 
            autoCapitalize='none' 
            keyboardType='email-address' 
            value={adminEmail} 
            onChangeText={setAdminEmail} 
            style={{ borderWidth:1, borderColor:'#d1d5db', borderRadius:12, padding:16, fontSize:16, backgroundColor:'#fff', color:'#111827' }} 
            placeholderTextColor="#9ca3af"
          />
          <Pressable onPress={create} style={{ backgroundColor:'#dc2626', padding:16, borderRadius:12, alignItems:'center', marginTop:8 }}>
            <Text style={{ color:'#fff', fontWeight:'600', fontSize:16 }}>🚀 Create Marketplace</Text>
          </Pressable>
        </View>
      </View>
      
      <FlatList
        data={marketplaces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding:20, paddingTop:0 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor:'#fff', padding:20, borderRadius:16, marginBottom:16, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:4, elevation:3 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:18, fontWeight:'bold', color:'#111827' }}>🏛️ {item.name}</Text>
                <Text style={{ color:'#6b7280', fontSize:14, marginTop:2 }}>📧 {item.domain}</Text>
                <Text style={{ color:'#6b7280', fontSize:14 }}>👤 Admin: {item.adminEmail}</Text>
              </View>
              <View style={[{ paddingHorizontal:12, paddingVertical:6, borderRadius:20 }, item.status === 'active' ? { backgroundColor:'#dcfce7' } : { backgroundColor:'#fee2e2' }]}>
                <Text style={[{ fontSize:12, fontWeight:'600' }, item.status === 'active' ? { color:'#166534' } : { color:'#dc2626' }]}>
                  {item.status === 'active' ? '✅ Active' : '❌ Inactive'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:12 }}>
              <Pressable 
                onPress={() => toggle(item.id, item.status)} 
                style={{ backgroundColor: item.status === 'active' ? '#f59e0b' : '#059669', padding:12, borderRadius:10, flex:1 }}
              >
                <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>
                  {item.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
                </Text>
              </Pressable>
              <Pressable 
                onPress={() => remove(item.id)} 
                style={{ backgroundColor:'#dc2626', padding:12, borderRadius:10, flex:1 }}
              >
                <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>🗑️ Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems:'center', padding:40 }}>
            <Text style={{ fontSize:18, color:'#6b7280' }}>🏢 No marketplaces created yet</Text>
          </View>
        }
      />
    </View>
  );
}