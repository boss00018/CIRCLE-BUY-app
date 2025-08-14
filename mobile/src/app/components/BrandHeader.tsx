import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface BrandHeaderProps {
  title?: string;
}

// Sanitize title to prevent any potential issues
function sanitizeTitle(title: string): string {
  return title.replace(/[<>"'&]/g, '').trim();
}

export default function BrandHeader({ title }: BrandHeaderProps) {
  // Use static require for logo to avoid path traversal issues
  const logoSource = require('../../assets/logo.png');
  
  return (
    <View style={styles.container}>
      <Image 
        source={logoSource} 
        resizeMode="contain" 
        style={styles.logo} 
      />
      {title ? (
        <Text style={styles.title}>
          {sanitizeTitle(title)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 28,
    height: 28,
  },
  title: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 16,
  },
});