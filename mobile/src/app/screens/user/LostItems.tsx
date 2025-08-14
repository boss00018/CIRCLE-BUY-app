import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

// Global array to store submitted items
let globalLostItems: any[] = [];

export const getGlobalLostItems = () => {
  // Mark expired items as orphaned and filter them from active view
  const now = new Date().toISOString();
  
  globalLostItems.forEach(item => {
    if (item.status === 'approved' && item.expiresAt && item.expiresAt <= now && item.status !== 'orphaned') {
      item.status = 'orphaned';
      item.orphanedAt = now;
    }
  });
  
  // Return only non-orphaned items for active display
  return globalLostItems.filter(item => item.status !== 'orphaned');
};

export const getAllLostItems = () => globalLostItems; // Get all items including orphaned

export const updateGlobalLostItem = (id: string, updates: any) => {
  const index = globalLostItems.findIndex(item => item.id === id);
  if (index !== -1) {
    globalLostItems[index] = { ...globalLostItems[index], ...updates };
  }
};

// Mark expired items as orphaned periodically
setInterval(() => {
  const now = new Date().toISOString();
  globalLostItems.forEach(item => {
    if (item.status === 'approved' && item.expiresAt && item.expiresAt <= now) {
      item.status = 'orphaned';
      item.orphanedAt = now;
    }
  });
}, 60000); // Check every minute

interface LostItem {
  id: string;
  itemName: string;
  description: string;
  contactDetails: string;
  reporterId: string;
  reporterEmail: string;
  status: string;
  createdAt: any;
}

export default function LostItems() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'report' | 'view'>('view');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  
  const { marketplaceId } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (activeTab === 'view') {
      const loadApprovedItems = () => {
        const approvedItems = globalLostItems.filter(item => item.status === 'approved');
        setLostItems(approvedItems);
      };
      
      loadApprovedItems();
      const interval = setInterval(loadApprovedItems, 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!itemName.trim() || !description.trim() || !contactDetails.trim()) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Please login');

      // Add to global array for admin to see
      const newItem = {
        id: Date.now().toString(),
        itemName: itemName.trim(),
        description: description.trim(),
        contactDetails: contactDetails.trim(),
        reporterId: user.uid,
        reporterEmail: user.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      globalLostItems.push(newItem);
      console.log('Added item to global array:', newItem);
      
      // Try Firestore as backup
      try {
        await firestore().collection('lostItems').add(newItem);
      } catch (firestoreError) {
        console.log('Firestore failed, using global array');
      }

      Alert.alert('Success', 'Lost item report submitted for admin approval.');
      setItemName('');
      setDescription('');
      setContactDetails('');
      setActiveTab('view');
    } catch (error: any) {
      console.log('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedItem) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedItem(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Lost Item Details</Text>
        </View>
        
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>{selectedItem.itemName}</Text>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailText}>{selectedItem.description}</Text>
          <Text style={styles.detailLabel}>Contact Details:</Text>
          <Text style={styles.detailText}>{selectedItem.contactDetails}</Text>
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
            Lost & Found
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'report' && styles.activeTab]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>
            Report Lost Item
          </Text>
        </Pressable>
      </View>

      {activeTab === 'view' ? (
        <ScrollView style={styles.listContainer}>
          {lostItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No lost items reported yet</Text>
            </View>
          ) : (
            lostItems.map((item) => (
              <Pressable 
                key={item.id}
                style={styles.itemCard}
                onPress={() => setSelectedItem(item)}
              >
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemPreview} numberOfLines={1}>
                  {item.description}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <Text style={styles.formTitle}>Report Lost Item</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Item Name *</Text>
            <TextInput
              value={itemName}
              onChangeText={(text) => {
                setItemName(text);
              }}
              style={styles.input}
              placeholder="Enter item name"
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
              onChangeText={(text) => {
                setDescription(text);
              }}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="Describe the lost item"
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
              onChangeText={(text) => {
                setContactDetails(text);
              }}
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
              {submitting ? 'Submitting...' : 'Submit Report'}
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
    color: '#059669',
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
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#059669',
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
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#059669',
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