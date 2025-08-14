import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { approveProductByAdmin, rejectProductByAdmin, requestChangesByAdmin } from '../../services/firestore/moderationService';
import ReasonDialog from '../../components/ReasonDialog';
import RealtimeBoundary from '../../components/RealtimeBoundary';

export default function ProductReview({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [showChanges, setShowChanges] = useState(false);

  useEffect(() => {
    setBusy(true);
    const unsub = firestore().collection('products').doc(productId).onSnapshot((doc) => {
      setProduct({ id: doc.id, ...(doc.data() as any) });
      setBusy(false);
    }, () => setBusy(false));
    return unsub;
  }, [productId]);

  if (!product) return <RealtimeBoundary busy={true}><View style={{ flex:1 }} /></RealtimeBoundary>;

  const approve = async () => {
    try { 
      await approveProductByAdmin(product.id); 
      Alert.alert('Success', 'Product approved', [{ text: 'OK', onPress: () => navigation.goBack() }]); 
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : 'Failed to approve product';
      Alert.alert('Error', message); 
    }
  };

  const doReject = async (reason: string) => {
    if (!reason?.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    try { 
      await rejectProductByAdmin(product.id, reason); 
      Alert.alert('Success', 'Product rejected', [{ text: 'OK', onPress: () => navigation.goBack() }]); 
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : 'Failed to reject product';
      Alert.alert('Error', message); 
    }
  };

  const doRequestChanges = async (reason: string) => {
    if (!reason?.trim()) {
      Alert.alert('Error', 'Please provide a reason for changes');
      return;
    }
    try { 
      await requestChangesByAdmin(product.id, reason); 
      Alert.alert('Success', 'Changes requested', [{ text: 'OK', onPress: () => navigation.goBack() }]); 
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : 'Failed to request changes';
      Alert.alert('Error', message); 
    }
  };

  return (
    <RealtimeBoundary busy={busy}>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <Text style={{ fontSize:20, fontWeight:'700' }}>{product.name}</Text>
        <Text style={{ color:'#6b7280', marginBottom:8 }}>₹{product.price}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
          {(product.images || []).map((uri: string, idx: number) => (
            <Image key={idx} source={{ uri }} style={{ width:240, height:200, borderRadius:12, marginRight:8, backgroundColor:'#e5e7eb' }} />
          ))}
        </ScrollView>
        <Text style={{ marginBottom:12 }}>{product.description}</Text>
        <Text style={{ color:'#6b7280' }}>Category: {product.categoryId}</Text>
        <Text style={{ color:'#6b7280' }}>Seller: {product.sellerId}</Text>
        <Text style={{ color:'#6b7280', marginBottom:12 }}>Submitted: {new Date(product.createdAt?.toDate?.() || product.createdAt || Date.now()).toLocaleString()}</Text>

        <View style={{ flexDirection:'row', gap:10 }}>
          <Pressable onPress={approve} style={{ backgroundColor:'#16a34a', padding:12, borderRadius:8 }}>
            <Text style={{ color:'#fff', fontWeight:'600' }}>Approve</Text>
          </Pressable>
          <Pressable onPress={() => setShowReject(true)} style={{ backgroundColor:'#dc2626', padding:12, borderRadius:8 }}>
            <Text style={{ color:'#fff', fontWeight:'600' }}>Reject</Text>
          </Pressable>
          <Pressable onPress={() => setShowChanges(true)} style={{ backgroundColor:'#f59e0b', padding:12, borderRadius:8 }}>
            <Text style={{ color:'#fff', fontWeight:'600' }}>Request Changes</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ReasonDialog visible={showReject} title="Enter rejection reason" onClose={() => setShowReject(false)} onSubmit={(r) => { setShowReject(false); doReject(r); }} />
      <ReasonDialog visible={showChanges} title="Enter change request" onClose={() => setShowChanges(false)} onSubmit={(r) => { setShowChanges(false); doRequestChanges(r); }} />
    </RealtimeBoundary>
  );
}