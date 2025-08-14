import React from 'react';
import BrandHeader from '../components/BrandHeader';

export const brandHeaderOption = (title?: string) => ({
  headerTitle: () => <BrandHeader title={title} />,
});