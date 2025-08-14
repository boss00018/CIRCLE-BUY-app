import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

const categories = [
  { id: null, name: 'All' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'books', name: 'Books' },
  { id: 'home', name: 'Home & Garden' },
  { id: 'sports', name: 'Sports' },
];

interface FiltersProps {
  onChange: (category: string | null) => void;
}

export default function Filters({ onChange }: FiltersProps) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const handleSelect = (categoryId: string | null) => {
    setSelected(categoryId);
    onChange(categoryId);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {categories.map((category) => (
          <Pressable
            key={category.id || 'all'}
            style={[
              styles.filterButton,
              selected === category.id && styles.filterButtonActive
            ]}
            onPress={() => handleSelect(category.id)}
          >
            <Text style={[
              styles.filterText,
              selected === category.id && styles.filterTextActive
            ]}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
});