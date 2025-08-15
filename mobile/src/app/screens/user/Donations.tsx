import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { donationsApi } from '../../services/api';

interface Donation {
  id: string;
  itemName: string;
  description: string;
  contactDetails: string;
  donorId: string;
  donorEmail: string;
  status: string;
  createdAt: string;
}

export default function Donations() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'donate' | 'view'>('view');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  useEffect(() => {
    if (activeTab === 'view') {
      const loadApprovedDonations = async () => {
        try {
          const response = await donationsApi.getAll('approved');
          setDonations(response.donations || []);
        } catch (error) {
          console.error('Error loading donations:', error);
        }
      };
      
      loadApprovedDonations();
      const interval = setInterval(loadApprovedDonations, 2000);
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
      await donationsApi.create({
        itemName: itemName.trim(),
        description: description.trim(),
        contactDetails: contactDetails.trim(),
      });

      Alert.alert('Success', 'Donation submitted for admin approval.');
      setItemName('');
      setDescription('');
      setContactDetails('');
      setActiveTab('view');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedDonation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedDonation(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Donation Details</Text>
        </View>
        
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>{selectedDonation.itemName}</Text>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailText}>{selectedDonation.description}</Text>
          <Text style={styles.detailLabel}>Contact Details:</Text>
          <Text style={styles.detailText}>{selectedDonation.contactDetails}</Text>
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
            Available Donations
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'donate' && styles.activeTab]}
          onPress={() => setActiveTab('donate')}
        >
          <Text style={[styles.tabText, activeTab === 'donate' && styles.activeTabText]}>
            Donate Item
          </Text>
        </Pressable>
      </View>

      {activeTab === 'view' ? (
        <ScrollView style={styles.listContainer}>
          {donations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No donations available yet</Text>
            </View>
          ) : (
            donations.map((donation) => (
              <Pressable 
                key={donation.id}
                style={styles.itemCard}
                onPress={() => setSelectedDonation(donation)}
              >
                <Text style={styles.itemName}>{donation.itemName}</Text>
                <Text style={styles.itemPreview} numberOfLines={1}>
                  {donation.description}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <Text style={styles.formTitle}>Donate Item</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Item Name *</Text>
            <TextInput
              value={itemName}
              onChangeText={setItemName}
              style={styles.input}
              placeholder="Enter item name"
              placeholderTextColor="#9ca3af"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="Describe the item you want to donate"
              placeholderTextColor="#9ca3af"
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
            />
          </View>
          
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Donation'}
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
    color: '#8b5cf6',
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
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8b5cf6',
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
    backgroundColor: '#8b5cf6',
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