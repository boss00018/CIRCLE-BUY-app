import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OfflineBannerProps {
  online: boolean;
}

export default function OfflineBanner({ online }: OfflineBannerProps) {
  if (online) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>You are offline. Changes will sync when back online.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    zIndex: 1000,
  },
  text: {
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
  },
});