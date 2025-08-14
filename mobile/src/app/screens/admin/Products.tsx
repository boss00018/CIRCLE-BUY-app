import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { listenPendingProducts, Product } from '../../services/firestore/productsRepo';
import { approveProductByAdmin, rejectProductByAdmin, bulkApproveByAdmin, bulkRejectByAdmin } from '../../services/firestore/moderationService';
import RealtimeBoundary from '../../components/RealtimeBoundary';
import { SkeletonLine } from '../../components/Skeleton';

export default function ProductsScreen({ navigation }: any) {
  const [pending, setPending] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [marketplaceId, setMarketplaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    // Read marketplaceId from claims
    const unsub = auth().onIdTokenChanged(async (user) => {
      if (!user) return;
      const token = await user.getIdTokenResult();
      const mp = token.claims.marketplaceId as string | undefined;
      setMarketplaceId(mp || null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!marketplaceId) return;
    setBusy(true);
    const unsub = listenPendingProducts(marketplaceId, (items) => { setPending(items); setBusy(false); });
    return unsub;
  }, [marketplaceId]);

  const toggleSelect = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const approve = async (id: string) => {
    try { 
      await approveProductByAdmin(id); 
      Alert.alert('Success', 'Product approved');
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : 'Failed to approve product';
      Alert.alert('Error', message); 
    }
  };
  
  const reject = async (id: string) => {
    try { 
      await rejectProductByAdmin(id, 'Inappropriate content'); 
      Alert.alert('Success', 'Product rejected');
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : 'Failed to reject product';
      Alert.alert('Error', message); 
    }
  };

  const bulkApprove = async () => {
    const ids = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);
    if (!ids.length) {
      Alert.alert('No Selection', 'Please select products to approve');
      return;
    }
    try { 
      await bulkApproveByAdmin(ids); 
      setSelected({}); 
      Alert.alert('Success', `${ids.length} products approved`);
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : 'Failed to approve products';
      Alert.alert('Error', message); 
    }
  };

  const bulkReject = async () => {
    const ids = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);
    if (!ids.length) {
      Alert.alert('No Selection', 'Please select products to reject');
      return;
    }
    try { 
      await bulkRejectByAdmin(ids, 'Prohibited item'); 
      setSelected({}); 
      Alert.alert('Success', `${ids.length} products rejected`);
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : 'Failed to reject products';
      Alert.alert('Error', message); 
    }
  };

  const listSkeleton = useMemo(() => new Array(6).fill(0).map((_, i) => (
    <View key={i} style={{ padding:12, borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, marginBottom:8 }}>
      <SkeletonLine width={'60%'} height={14} />
      <SkeletonLine width={'100%'} height={12} />
      <SkeletonLine width={'40%'} height={12} />
    </View>
  )), []);

  return (
    <RealtimeBoundary busy={busy}>
      <View style={{ flex:1, padding:16 }}>
        <Text style={{ fontSize:20, fontWeight:'600', marginBottom:12 }}>Pending Products</Text>
        <View style={{ flexDirection:'row', gap:12, marginBottom:12 }}>
          <Pressable onPress={bulkApprove} style={{ backgroundColor:'#22c55e', padding:8, borderRadius:6 }}><Text style={{ color:'#fff' }}>Bulk Approve</Text></Pressable>
          <Pressable onPress={bulkReject} style={{ backgroundColor:'#ef4444', padding:8, borderRadius:6 }}><Text style={{ color:'#fff' }}>Bulk Reject</Text></Pressable>
        </View>
        {busy ? (
          <View>{listSkeleton}</View>
        ) : (
          <FlatList
            data={pending}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ padding:12, borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, marginBottom:8 }}>
                <Pressable onPress={() => navigation.navigate('ProductReview', { productId: item.id })}>
                  <Text style={{ fontWeight:'600' }}>{item.name} — ₹{item.price}</Text>
                  <Text numberOfLines={2} style={{ color:'#6b7280' }}>{item.description}</Text>
                </Pressable>
                <Pressable onPress={() => toggleSelect(item.id)}>
                  <Text style={{ color: selected[item.id] ? '#2563eb' : '#9ca3af' }}>{selected[item.id] ? 'Selected' : 'Tap to select for bulk'}</Text>
                </Pressable>
                <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
                  <Pressable onPress={() => approve(item.id)} style={{ backgroundColor:'#10b981', padding:8, borderRadius:6 }}>
                    <Text style={{ color:'#fff' }}>Approve</Text>
                  </Pressable>
                  <Pressable onPress={() => reject(item.id)} style={{ backgroundColor:'#ef4444', padding:8, borderRadius:6 }}>
                    <Text style={{ color:'#fff' }}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </RealtimeBoundary>
  );
}