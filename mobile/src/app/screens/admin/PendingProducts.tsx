import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerEmail: string;
  status: string;
  category: string;
  quality: string;
}

export default function PendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!marketplaceId) {
      setLoading(false);
      return;
    }

    console.log('Setting up pending products listener for marketplace:', marketplaceId);

    const unsubscribe = firestore()
      .collection('products')
      .where('status', '==', 'pending')
      .onSnapshot(
        (snapshot) => {
          const allProducts = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }) as Product);
          
          const filteredProducts = allProducts.filter(product => 
            product.marketplaceId === marketplaceId || !product.marketplaceId
          );
          
          console.log('All pending products found:', allProducts.length);
          console.log('Filtered for marketplace:', filteredProducts.length);
          console.log('Pending products data:', filteredProducts);
          setProducts(filteredProducts);
          setLoading(false);
        },
        (error) => {
          // Silently handle permission errors
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [marketplaceId]);

  const handleApprove = async (productId: string) => {
    try {
      await firestore().collection('products').doc(productId).update({
        status: 'approved',
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      console.log('Product approved successfully');
    } catch (error) {
      console.error('Failed to approve product');
    }
  };

  const handleReject = async (productId: string) => {
    Alert.prompt(
      'Reject Product',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) {
              console.error('Please provide a rejection reason');
              return;
            }
            try {
              await firestore().collection('products').doc(productId).update({
                status: 'rejected',
                rejectionReason: reason.trim(),
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              console.log('Product rejected with reason');
            } catch (error) {
              console.error('Failed to reject product');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: item.images[0] || 'https://via.placeholder.com/80x80?text=Product' }} 
        style={styles.productImage}
        defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=Product' }}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.productDetails}>Category: {item.category} | Quality: {item.quality}</Text>
        <Text style={styles.sellerInfo}>Seller: {item.sellerEmail}</Text>
        
        <View style={styles.actions}>
          <Pressable 
            style={[styles.actionButton, { backgroundColor: '#059669' }]}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.actionText}>✅ Approve</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionButton, { backgroundColor: '#dc2626' }]}
            onPress={() => handleReject(item.id)}
          >
            <Text style={styles.actionText}>❌ Reject</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading pending products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending products</Text>
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
  content: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
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
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  productDetails: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  sellerInfo: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  actionText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
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