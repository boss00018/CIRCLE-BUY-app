import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { productRequestsApi } from '../../services/api';

interface ProductRequest {
  id: string;
  productName: string;
  description: string;
  contactDetails: string;
  requesterId: string;
  requesterEmail: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
}

export default function RequestProducts() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'report' | 'view'>('view');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (activeTab === 'view') {
      const loadApprovedRequests = async () => {
        try {
          const response = await productRequestsApi.getAll('approved');
          setRequests(response.requests || []);
        } catch (error) {
          console.error('Error loading requests:', error);
        }
      };
      
      loadApprovedRequests();
      const interval = setInterval(loadApprovedRequests, 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!productName.trim() || !description.trim() || !contactDetails.trim()) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await productRequestsApi.create({
        productName: productName.trim(),
        description: description.trim(),
        contactDetails: contactDetails.trim(),
      });

      Alert.alert('Success', 'Product request submitted for admin approval.');
      setProductName('');
      setDescription('');
      setContactDetails('');
      setActiveTab('view');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedRequest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedRequest(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>
        
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>{selectedRequest.productName}</Text>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailText}>{selectedRequest.description}</Text>
          <Text style={styles.detailLabel}>Contact Details:</Text>
          <Text style={styles.detailText}>{selectedRequest.contactDetails}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'view' && styles.activeTab]}
          onPress={() => setActiveTab('view')}
        >
          <Text style={[styles.tabText, activeTab === 'view' && styles.activeTabText]}>
            Product Requests
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'report' && styles.activeTab]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>
            Request Product
          </Text>
        </Pressable>
      </View>

      {activeTab === 'view' ? (
        <ScrollView style={styles.listContainer}>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No product requests yet</Text>
            </View>
          ) : (
            requests.map((request) => (
              <Pressable 
                key={request.id}
                style={styles.itemCard}
                onPress={() => setSelectedRequest(request)}
              >
                <Text style={styles.itemName}>{request.productName}</Text>
                <Text style={styles.itemPreview} numberOfLines={1}>
                  {request.description}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <Text style={styles.formTitle}>Request Product</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Product Name *</Text>
            <TextInput
              value={productName}
              onChangeText={setProductName}
              style={styles.input}
              placeholder="Enter product name"
              placeholderTextColor="#9ca3af"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="Describe what you're looking for"
              placeholderTextColor="#9ca3af"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contact Details *</Text>
            <TextInput
              value={contactDetails}
              onChangeText={setContactDetails}
              style={styles.input}
              placeholder="Phone number or email"
              placeholderTextColor="#9ca3af"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
              keyboardType="default"
            />
          </View>
          
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemPreview: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
});