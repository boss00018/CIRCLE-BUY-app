import { auth, db } from './init';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Input validation helpers
function validateEmail(email: string): void {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('Valid email is required');
  }
}

function validatePassword(password: string): void {
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
}

function validateCollectionName(collection: string): void {
  if (!collection || typeof collection !== 'string' || collection.trim().length === 0) {
    throw new Error('Valid collection name is required');
  }
}

function validateDocId(docId: string): void {
  if (!docId || typeof docId !== 'string' || docId.trim().length === 0) {
    throw new Error('Valid document ID is required');
  }
}

// Auth Services
export const signUp = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    validateEmail(email);
    validatePassword(password);
    return await auth().createUserWithEmailAndPassword(email.trim(), password);
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    validateEmail(email);
    validatePassword(password);
    return await auth().signInWithEmailAndPassword(email.trim(), password);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    return await auth().signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

// Firestore Services
export const addDocument = async (collection: string, data: Record<string, any>): Promise<FirebaseFirestoreTypes.DocumentReference> => {
  try {
    validateCollectionName(collection);
    if (!data || typeof data !== 'object') {
      throw new Error('Valid data object is required');
    }
    return await db.collection(collection.trim()).add(data);
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const getDocument = async (collection: string, docId: string): Promise<FirebaseFirestoreTypes.DocumentSnapshot> => {
  try {
    validateCollectionName(collection);
    validateDocId(docId);
    return await db.collection(collection.trim()).doc(docId.trim()).get();
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const updateDocument = async (collection: string, docId: string, data: Record<string, any>): Promise<void> => {
  try {
    validateCollectionName(collection);
    validateDocId(docId);
    if (!data || typeof data !== 'object') {
      throw new Error('Valid data object is required');
    }
    return await db.collection(collection.trim()).doc(docId.trim()).update(data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (collection: string, docId: string): Promise<void> => {
  try {
    validateCollectionName(collection);
    validateDocId(docId);
    return await db.collection(collection.trim()).doc(docId.trim()).delete();
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const getCollection = async (collection: string): Promise<FirebaseFirestoreTypes.QuerySnapshot> => {
  try {
    validateCollectionName(collection);
    return await db.collection(collection.trim()).get();
  } catch (error) {
    console.error('Error getting collection:', error);
    throw error;
  }
};