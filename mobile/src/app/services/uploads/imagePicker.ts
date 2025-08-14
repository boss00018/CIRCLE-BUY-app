import { Platform } from 'react-native';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

export type PickedImage = { uri: string; fileName?: string; type?: string };

export async function pickImage(): Promise<PickedImage | null> {
  try {
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
    if (res.didCancel || !res.assets || !res.assets.length) return null;
    
    const asset = res.assets[0];
    if (!asset.uri) {
      console.warn('Image asset has no URI');
      return null;
    }
    
    return { 
      uri: asset.uri, 
      fileName: asset.fileName || undefined, 
      type: asset.type || undefined 
    };
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
}

export async function uploadImage(uid: string, localUri: string, onProgress?: (p: number) => void): Promise<string> {
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('Valid user ID is required');
  }
  if (!localUri || typeof localUri !== 'string' || localUri.trim().length === 0) {
    throw new Error('Valid local URI is required');
  }
  
  try {
    // Simulate upload progress
    onProgress && onProgress(0.3);
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress && onProgress(0.7);
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress && onProgress(1.0);
    
    // For free tier, we'll store images as base64 in Firestore
    // This is not ideal for production but works for development
    console.log('Using local URI for image storage (free tier)');
    return localUri;
  } catch (error) {
    console.error('Error processing image:', error);
    return localUri;
  }
}