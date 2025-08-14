import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, ScrollView, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { pickImage, uploadImage } from '../../services/uploads/imagePicker';

const defaultCategories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Vehicles', 'Furniture', 'Other'];
const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export default function UserSell() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [shareContact, setShareContact] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [marketplaceName, setMarketplaceName] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        
        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (allGranted) {
          setPermissionsGranted(true);
        } else {
          Alert.alert(
            'Permissions Required',
            'Camera and storage permissions are required to upload product photos.',
            [{ text: 'OK', onPress: requestPermissions }]
          );
        }
      } catch (error) {
        console.log('Permission error:', error);
      }
    } else {
      setPermissionsGranted(true);
    }
  };

  useEffect(() => {
    requestPermissions();
    
    const loadMarketplaceData = async () => {
      if (marketplaceId) {
        try {
          const doc = await firestore().collection('marketplaces').doc(marketplaceId).get();
          if (doc.exists) {
            const data = doc.data();
            setMarketplaceName(data?.name || '');
            if (data?.categories && data.categories.length > 0) {
              setCategories(data.categories);
            }
          }
        } catch (error) {
          console.log('Error loading marketplace data:', error);
        }
      }
    };
    loadMarketplaceData();
  }, [marketplaceId]);

  const chooseImage = async () => {
    if (!permissionsGranted) {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and storage permissions to upload photos.',
        [{ text: 'Grant Permissions', onPress: requestPermissions }]
      );
      return;
    }
    
    try {
      const picked = await pickImage();
      if (picked?.uri) {
        // Check file size (3MB limit)
        if (picked.fileSize && picked.fileSize > 3 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please upload an image within 3MB size limit.');
          return;
        }
        setLocalImage(picked.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const submit = async () => {
    try {
      if (!termsAccepted) {
        Alert.alert('Terms Required', 'Please accept the terms and conditions.');
        return;
      }
      
      if (!name || !description || !price || !category || !condition || !localImage) {
        Alert.alert('Missing Fields', 'Please fill all required fields.');
        return;
      }
      
      if (description.trim().length < 10) {
        Alert.alert('Description Too Short', 'Description must be at least 10 characters long.');
        return;
      }

      setSubmitting(true);
      const user = auth().currentUser;
      if (!user) throw new Error('Please login');

      const imageUrl = await uploadImage(user.uid, localImage, setProgress);

      console.log('Submitting product to Firestore...');
      console.log('User marketplaceId from Redux:', marketplaceId);
      console.log('User email:', user.email);
      
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        condition,
        negotiable,
        shareContact,
        images: [imageUrl],
        sellerId: user.uid,
        sellerEmail: user.email,
        marketplaceId: marketplaceId,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      console.log('Product data being submitted:', productData);
      const docRef = await firestore().collection('products').add(productData);
      console.log('Product submitted successfully with ID:', docRef.id);

      Alert.alert('Success', 'Your product has been submitted for admin approval. Product ID: ' + docRef.id);
      // Reset form
      setName(''); setDescription(''); setPrice(''); setCategory(''); setCondition('');
      setNegotiable(false); setShareContact(false); setTermsAccepted(false);
      setLocalImage(null); setProgress(0);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit product');
    } finally {
      setSubmitting(false);
    }
  };

  if (!permissionsGranted) {
    return (
      <View style={styles.permissionsContainer}>
        <Text style={styles.permissionsTitle}>📱 Permissions Required</Text>
        <Text style={styles.permissionsText}>
          To sell products, we need access to:
        </Text>
        <View style={styles.permissionsList}>
          <Text style={styles.permissionItem}>📷 Camera - To take product photos</Text>
          <Text style={styles.permissionItem}>📁 Storage - To save and upload images</Text>
        </View>
        <Pressable onPress={requestPermissions} style={styles.permissionsButton}>
          <Text style={styles.permissionsButtonText}>Grant Permissions</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <View style={styles.form}>
        <Text style={styles.title}>Sell Your Product</Text>
        {marketplaceName && (
          <Text style={styles.marketplace}>📍 {marketplaceName} Marketplace</Text>
        )}
        
        <TextInput
          placeholder="Product Name *"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />
        
        <TextInput
          placeholder="Description *"
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input, styles.textArea]}
          placeholderTextColor="#9ca3af"
        />
        
        <TextInput
          placeholder="Price (₹) *"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />
        
        <Text style={styles.label}>Category *</Text>
        <View style={styles.optionsRow}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.option, category === cat && styles.optionSelected]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.optionText, category === cat && styles.optionTextSelected]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
        
        <Text style={styles.label}>Condition *</Text>
        <View style={styles.optionsRow}>
          {conditions.map((cond) => (
            <Pressable
              key={cond}
              style={[styles.option, condition === cond && styles.optionSelected]}
              onPress={() => setCondition(cond)}
            >
              <Text style={[styles.optionText, condition === cond && styles.optionTextSelected]}>
                {cond}
              </Text>
            </Pressable>
          ))}
        </View>
        
        <Pressable onPress={chooseImage} style={styles.imageButton}>
          <Text style={styles.imageButtonText}>
            {localImage ? 'Change Image' : 'Add Photo *'}
          </Text>
        </Pressable>
        
        {localImage && (
          <>
            <Image source={{ uri: localImage }} style={styles.image} />
            {progress > 0 && progress < 1 && (
              <View style={styles.progressBar}>
                <View style={[styles.progress, { width: `${progress * 100}%` }]} />
              </View>
            )}
          </>
        )}
        
        <Pressable
          style={styles.checkbox}
          onPress={() => setNegotiable(!negotiable)}
        >
          <Text style={styles.checkboxText}>
            {negotiable ? '☑️' : '☐'} Price is negotiable
          </Text>
        </Pressable>
        
        <Pressable
          style={styles.checkbox}
          onPress={() => setShareContact(!shareContact)}
        >
          <Text style={styles.checkboxText}>
            {shareContact ? '☑️' : '☐'} Share my contact information
          </Text>
        </Pressable>
        
        <Pressable
          style={styles.checkbox}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <Text style={styles.checkboxText}>
            {termsAccepted ? '☑️' : '☐'} I accept terms and conditions *
          </Text>
        </Pressable>
        
        <Text style={styles.terms}>
          By checking this box, I confirm that I am responsible for everything placed 
          and nothing illegal is being sold. This product is within marketplace restrictions.
        </Text>
        
        <Pressable
          onPress={submit}
          disabled={submitting}
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  permissionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  permissionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionsList: {
    marginBottom: 32,
  },
  permissionItem: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  marketplace: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 24,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#fff',
  },
  imageButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 16,
  },
  progress: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxText: {
    fontSize: 16,
    color: '#374151',
  },
  terms: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});