import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import RealtimeBoundary from '../../components/RealtimeBoundary';
import { ProductCardSkeleton } from '../../components/Skeleton';
import Filters from './Filters';

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
}

interface ProductCardProps {
  item: Product;
  onPress: () => void;
}

function ProductCard({ item, onPress }: ProductCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.productCard}>
      <Image 
        source={{ uri: item.images?.[0] }} 
        style={styles.productImage} 
      />
      <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>₹{item.price}</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.DocumentSnapshot | null>(null);

  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    setBusy(true);
    let base: FirebaseFirestoreTypes.Query = firestore().collection('products')
      .where('status', '==', 'approved');
    if (category) base = base.where('categoryId', '==', category);
    base = base.orderBy('createdAt', 'desc');

    const unsub = base.limit(20).onSnapshot(snap => {
      const docs = snap.docs;
      setItems(docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLastDoc(docs.length ? docs[docs.length - 1] : null);
      setBusy(false);
    }, () => setBusy(false));
    return unsub;
  }, [category]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      let base: FirebaseFirestoreTypes.Query = firestore().collection('products')
        .where('status', '==', 'approved');
      if (category) base = base.where('categoryId', '==', category);
      base = base.orderBy('createdAt', 'desc');
      const snap = await base.startAfter(lastDoc).limit(20).get();
      const docs = snap.docs;
      setItems((prev) => prev.concat(docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
      setLastDoc(docs.length ? docs[docs.length - 1] : null);
    } finally {
      setLoadingMore(false);
    }
  };

  const skeletons = useMemo(() => new Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />), []);

  return (
    <RealtimeBoundary busy={busy}>
      <View style={styles.container}>
        <Filters onChange={setCategory} />
        <View style={styles.content}>
          {busy ? (
            <View style={styles.skeletonContainer}>{skeletons}</View>
          ) : (
            <FlatList
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              data={items}
              keyExtractor={(it) => it.id}
              onEndReachedThreshold={0.4}
              onEndReached={loadMore}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMore}>
                    <Text style={styles.loadingText}>Loading more…</Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <ProductCard 
                  item={item} 
                  onPress={() => navigation.navigate('ProductDetails', { productId: item.id })} 
                />
              )}
            />
          )}
        </View>
      </View>
    </RealtimeBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  columnWrapper: {
    gap: 16,
  },
  loadingMore: {
    paddingVertical: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  productName: {
    marginTop: 12,
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
  },
  productPrice: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 4,
  },
});