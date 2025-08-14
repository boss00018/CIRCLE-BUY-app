import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatList() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Messages will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    color: '#6b7280',
    fontSize: 16,
  },
});