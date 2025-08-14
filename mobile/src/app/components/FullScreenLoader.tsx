import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface FullScreenLoaderProps {
  text?: string;
}

const COLORS = {
  primary: '#2563eb',
  textSecondary: '#6b7280',
} as const;

export default function FullScreenLoader({ text = 'Loading...' }: FullScreenLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: COLORS.textSecondary,
  },
});