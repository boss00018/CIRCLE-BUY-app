import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import authRN from '@react-native-firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { getGlobalLostItems } from './LostItems';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  sellerId: string;
  negotiable: boolean;
  quality: string;
}

function ProductCard({ item, onPress }: { item: Product; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.productCard}>
      <Image 
        source={{ uri: item.images[0] || 'https://via.placeholder.com/150x150?text=Product' }} 
        style={styles.productImage}
        defaultSource={{ uri: 'https://via.placeholder.com/150x150?text=Product' }}
      />
      <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>₹{item.price}</Text>
      <View style={styles.badges}>
        {item.negotiable && <Text style={styles.badge}>Negotiable</Text>}
        <Text style={[styles.badge, styles.qualityBadge]}>{item.quality}</Text>
      </View>
    </Pressable>
  );
}

export default function UserHome({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!marketplaceId) return;

    setLoading(true);
    const currentUserId = authRN().currentUser?.uid;

    // Query products excluding current user's products
    const unsubscribe = firestore()
      .collection('products')
      .where('marketplaceId', '==', marketplaceId)
      .where('status', '==', 'approved')
      .onSnapshot(
        (snapshot) => {
          const productList = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as Product)
            .filter(product => product.sellerId !== currentUserId);
          setProducts(productList);
          setLoading(false);
        },
        (error) => {
          setLoading(false);
        }
      );
    
    return unsubscribe;
  }, [marketplaceId]);

  // Load approved lost items once
  useEffect(() => {
    setLostItems([]);
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      
      <FlatList
        numColumns={2}
        data={products}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        key={products.length} // Force re-render when product count changes
        renderItem={({ item }) => (
          <ProductCard 
            item={item} 
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products available yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productName: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
  },
  productPrice: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  badge: {
    fontSize: 10,
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  announcementContainer: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  announcementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  announcementScroll: {
    flexDirection: 'row',
  },
  announcementItem: {
    marginRight: 20,
    paddingVertical: 4,
  },
  announcementText: {
    fontSize: 14,
    color: '#78350f',
    fontWeight: '500',
  },
});