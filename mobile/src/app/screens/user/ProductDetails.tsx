import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerEmail: string;
  category: string;
  quality: string;
  negotiable: boolean;
}

export default function ProductDetails({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const doc = await firestore().collection('products').doc(productId).get();
        if (doc.exists) {
          setProduct({ id: doc.id, ...doc.data() } as Product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const startChat = () => {
    if (product) {
      navigation.navigate('Messages', {
        receiverId: product.sellerId,
        productId: product.id
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.images[0] }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        
        <View style={styles.badges}>
          <Text style={styles.badge}>{product.category}</Text>
          <Text style={styles.badge}>{product.quality}</Text>
          {product.negotiable && <Text style={styles.badge}>Negotiable</Text>}
        </View>
        
        <Text style={styles.description}>{product.description}</Text>
        
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerLabel}>Seller:</Text>
          <Text style={styles.sellerEmail}>{product.sellerEmail}</Text>
        </View>
        
        <Pressable onPress={startChat} style={styles.chatButton}>
          <Text style={styles.chatButtonText}>💬 Message Seller</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 16,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sellerLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginRight: 8,
  },
  sellerEmail: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});