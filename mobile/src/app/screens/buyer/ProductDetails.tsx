import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  status: string;
  createdAt: any;
}

export default function ProductDetails({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('products')
      .doc(productId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setProduct({ id: doc.id, ...doc.data() } as Product);
          } else {
            Alert.alert('Error', 'Product not found');
            navigation.goBack();
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching product:', error);
          Alert.alert('Error', 'Failed to load product');
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [productId, navigation]);

  const handleContact = () => {
    Alert.alert('Contact Seller', 'Contact functionality would be implemented here');
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.images[0] }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
        
        <View style={styles.actions}>
          <Pressable style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.contactText}>Contact Seller</Text>
          </Pressable>
        </View>
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
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
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
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  actions: {
    marginTop: 20,
  },
  contactButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});