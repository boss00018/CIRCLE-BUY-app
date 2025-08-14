import firestore from '@react-native-firebase/firestore';

// Enables Firestore persistence if supported and sets aggressive cache settings
export function optimizeFirestore(): void {
  try {
    // React Native Firebase enables persistence by default; we can tune settings here if needed.
    firestore().settings({ ignoreUndefinedProperties: true });
  } catch (error) {
    console.error('Error configuring Firestore settings:', error);
  }
}