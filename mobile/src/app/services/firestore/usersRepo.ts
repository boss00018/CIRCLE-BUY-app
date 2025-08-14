import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export async function upsertUserProfile(extra?: Record<string, any>) {
  try {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore().collection('users').doc(user.uid);
    const data = {
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      ...extra,
    };
    await ref.set({ createdAt: firestore.FieldValue.serverTimestamp(), ...data }, { merge: true });
  } catch (error) {
    // Silently handle Firestore permission errors
  }
}

export async function saveFcmToken(token: string, platform: 'android' | 'ios') {
  try {
    const user = auth().currentUser;
    if (!user) return;
    const ref = firestore().collection('users').doc(user.uid).collection('devices').doc(token);
    await ref.set({ token, platform, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
  } catch (error) {
    // Silently handle Firestore permission errors
  }
}

export async function removeFcmToken(token: string) {
  try {
    const user = auth().currentUser;
    if (!user) return;
    await firestore().collection('users').doc(user.uid).collection('devices').doc(token).delete();
  } catch (error) {
    // Silently handle Firestore permission errors
  }
}