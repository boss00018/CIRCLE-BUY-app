import React from 'react';
import { View } from 'react-native';

export function SkeletonLine({ width = '100%', height = 12, radius = 8 }: { width?: number | string; height?: number; radius?: number }) {
  return <View style={{ width, height, backgroundColor: '#e5e7eb', borderRadius: radius, marginVertical: 4 }} />;
}

export function ProductCardSkeleton() {
  return (
    <View style={{ flex:1, backgroundColor:'#fff', borderRadius:12, padding:10, marginBottom:12, borderColor:'#e5e7eb', borderWidth:1 }}>
      <View style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor:'#e5e7eb' }} />
      <SkeletonLine width={'80%'} height={14} />
      <SkeletonLine width={'40%'} height={12} />
    </View>
  );
}