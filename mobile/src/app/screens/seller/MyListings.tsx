import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import RealtimeBoundary from '../../components/RealtimeBoundary';
import { SkeletonLine } from '../../components/Skeleton';

export default function MyListings({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    setBusy(true);
    console.log('Loading products for user:', user.uid);
    
    const unsub = firestore().collection('products')
      .where('sellerId', '==', user.uid)
      .onSnapshot(snap => {
        console.log('Found products:', snap.size);
        const allProducts = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        const activeProducts = allProducts.filter(product => 
          product.status !== 'sold' && product.status !== 'orphaned'
        );
        console.log('Active products:', activeProducts);
        setItems(activeProducts);
        setBusy(false);
      }, (error) => {
        console.log('Error loading products:', error);
        setBusy(false);
      });
    return unsub;
  }, []);

  const handleMarkAsSold = async (productId: string) => {
    Alert.alert(
      'Mark as Sold',
      'This will remove the product from the marketplace for all users. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('products').doc(productId).update({
                status: 'sold',
                soldAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              Alert.alert('Success', 'Product marked as sold and removed from marketplace.');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark product as sold.');
            }
          }
        }
      ]
    );
  };

  const handleDelete = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'This will permanently delete the product from your listings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('products').doc(productId).update({
                status: 'orphaned',
                deletedAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              Alert.alert('Success', 'Product deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product.');
            }
          }
        }
      ]
    );
  };

  return (
    <RealtimeBoundary busy={busy}>
      <View style={{ flex:1, padding:16, backgroundColor:'#f9fafb' }}>
        <Text style={{ fontSize:20, fontWeight:'700', marginBottom:12, color:'#111827' }}>My Listings</Text>
        {busy ? (
          <View>
            {new Array(6).fill(0).map((_, i) => (
              <View key={i} style={{ paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#e5e7eb' }}>
                <SkeletonLine width={'60%'} height={14} />
                <SkeletonLine width={'30%'} height={12} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <View style={{ paddingVertical:16, paddingHorizontal:16, marginBottom:8, backgroundColor:'#fff', borderRadius:8, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.1, shadowRadius:2, elevation:2 }}>
                <Text style={{ fontWeight:'600', color:'#111827', fontSize:16 }}>{item.name} — ₹{item.price}</Text>
                <Text style={{ color:'#374151', fontSize:14, marginTop:4 }}>Status: <Text style={{ fontWeight:'600', color: item.status === 'approved' ? '#059669' : item.status === 'rejected' ? '#dc2626' : '#f59e0b' }}>{item.status}</Text>{item.rejectionReason ? <Text style={{ color:'#dc2626' }}> — {item.rejectionReason}</Text> : ''}</Text>
                
                <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
                  {item.status === 'approved' && (
                    <Pressable 
                      onPress={() => handleMarkAsSold(item.id)}
                      style={{ backgroundColor:'#059669', paddingHorizontal:12, paddingVertical:6, borderRadius:6, flex:1 }}
                    >
                      <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600', fontSize:12 }}>Mark as Sold</Text>
                    </Pressable>
                  )}
                  <Pressable 
                    onPress={() => handleDelete(item.id)}
                    style={{ backgroundColor:'#dc2626', paddingHorizontal:12, paddingVertical:6, borderRadius:6, flex:1 }}
                  >
                    <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600', fontSize:12 }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems:'center', padding:40 }}>
                <Text style={{ fontSize:16, color:'#6b7280', textAlign:'center' }}>No products listed yet.\nStart selling by adding your first product!</Text>
              </View>
            }
          />
        )}
      </View>
    </RealtimeBoundary>
  );
}