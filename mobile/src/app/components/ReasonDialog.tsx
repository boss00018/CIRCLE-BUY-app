import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

interface ReasonDialogProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

// Sanitize input to prevent XSS-like issues
function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, '').trim();
}

export default function ReasonDialog({ visible, title = 'Enter reason', onClose, onSubmit }: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const presets = ['Inappropriate content', 'Prohibited item', 'Incomplete information', 'Low-quality images'];

  const submit = () => {
    const sanitizedReason = sanitizeInput(reason);
    if (sanitizedReason.length === 0) {
      return; // Don't submit empty reason
    }
    onSubmit(sanitizedReason);
    setReason('');
  };

  const close = () => { 
    setReason(''); 
    onClose(); 
  };

  const handleReasonChange = (text: string) => {
    setReason(sanitizeInput(text));
  };

  const isSubmitDisabled = reason.trim().length === 0;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{sanitizeInput(title)}</Text>
          <View style={styles.presetsContainer}>
            {presets.map((preset) => (
              <Pressable 
                key={preset} 
                onPress={() => setReason(preset)} 
                style={styles.presetButton}
              >
                <Text style={styles.presetText}>{preset}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput 
            placeholder="Enter your reason" 
            value={reason} 
            onChangeText={handleReasonChange}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <View style={styles.buttonContainer}>
            <Pressable onPress={close} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={submit} 
              style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
              disabled={isSubmitDisabled}
            >
              <Text style={[styles.submitText, isSubmitDisabled && styles.submitTextDisabled]}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  presetButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  presetText: {
    color: '#374151',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
  submitTextDisabled: {
    color: '#9ca3af',
  },
});