import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { productsApi } from '../../services/api';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'sold';
  createdAt: any;
  rejectionReason?: string;
}

function ProductCard({ item }: { item: Product }) {
  const getStatusColor = () => {
    switch (item.status) {
      case 'approved': return '#059669';
      case 'rejected': return '#dc2626';
      case 'sold': return '#6b7280';
      default: return '#f59e0b';
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case 'approved': return '✅ Approved';
      case 'rejected': return '❌ Rejected';
      case 'sold': return '💰 Sold';
      default: return '⏳ Pending';
    }
  };

  const handleEdit = () => {
    // Navigate to edit screen
    console.log('Edit product:', item.id);
  };

  const handleMarkAsSold = () => {
    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this product as sold? It will be removed from the marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsApi.markAsSold(item.id);
              Alert.alert('Success', 'Product marked as sold and removed from marketplace.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark product as sold');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.productCard}>
      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        
        {item.status === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionContainer}>
            <Text style={styles.rejectionLabel}>Reason:</Text>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
            <Pressable style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editText}>✏️ Edit Product</Text>
            </Pressable>
          </View>
        )}
        
        {item.status === 'approved' && (
          <Pressable style={[styles.editButton, { backgroundColor: '#dc2626' }]} onPress={handleMarkAsSold}>
            <Text style={styles.editText}>✅ Mark as Sold</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function MyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('products')
      .where('sellerId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const productList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          setProducts(productList);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching products:', error);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading your products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <ProductCard item={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You haven't listed any products yet</Text>
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
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  rejectionText: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  editText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
});