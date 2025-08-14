import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import authRN from '@react-native-firebase/auth';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerEmail: string;
  status: string;
  category: string;
  quality: string;
  rejectionReason?: string;
}

export default function RejectedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRejectedProducts = async () => {
      try {
        const user = authRN().currentUser;
        if (!user) return;
        
        const tokenResult = await user.getIdTokenResult(true);
        const marketplaceId = tokenResult.claims.marketplaceId as string;
        
        if (!marketplaceId) {
          setLoading(false);
          return;
        }

        const unsubscribe = firestore()
          .collection('products')
          .onSnapshot(
            (snapshot) => {
              const productList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }) as Product)
                .filter(product => 
                  product.status === 'rejected' &&
                  product.marketplaceId === marketplaceId
                );
              setProducts(productList);
              setProducts(productList);
              setLoading(false);
            },
            (error) => {
              setLoading(false);
            }
          );

        return unsubscribe;
      } catch (error) {
        // Silent
        setLoading(false);
      }
    };

    getRejectedProducts();
  }, []);

  const handleReapprove = async (productId: string) => {
    Alert.alert(
      'Re-approve Product',
      'Are you sure you want to approve this previously rejected product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await firestore().collection('products').doc(productId).update({
                status: 'approved',
                rejectionReason: firestore.FieldValue.delete(),
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              console.log('Product approved successfully');
            } catch (error) {
              console.error('Failed to approve product');
            }
          }
        }
      ]
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
        <Text style={styles.productDetails}>Category: {item.category} | Quality: {item.quality}</Text>
        <Text style={styles.sellerInfo}>Seller: {item.sellerEmail}</Text>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>❌ Rejected</Text>
        </View>
        
        {item.rejectionReason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{item.rejectionReason}</Text>
          </View>
        )}
        
        <Pressable 
          style={styles.reapproveButton}
          onPress={() => handleReapprove(item.id)}
        >
          <Text style={styles.reapproveText}>✅ Re-approve</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading rejected products...</Text>
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
            <Text style={styles.emptyText}>No rejected products</Text>
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
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  reasonContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  reasonText: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
  },
  reapproveButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  reapproveText: {
    color: '#fff',
    fontSize: 12,
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