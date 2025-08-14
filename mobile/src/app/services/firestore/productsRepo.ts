import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  sellerId: string;
  marketplaceId: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  rejectionReason?: string;
  approvedBy?: string;
  reviewedBy?: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
};

// Input validation helpers
function validateProductId(id: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid product ID');
  }
}

function validateReason(reason: string): void {
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw new Error('Reason is required and cannot be empty');
  }
}

function validateMarketplaceId(marketplaceId: string): void {
  if (!marketplaceId || typeof marketplaceId !== 'string' || marketplaceId.trim().length === 0) {
    throw new Error('Invalid marketplace ID');
  }
}

// List pending products for a marketplace with optional filters
export function listenPendingProducts(marketplaceId: string, cb: (items: Product[]) => void) {
  try {
    validateMarketplaceId(marketplaceId);
    
    return firestore()
      .collection('products')
      .where('marketplaceId', '==', marketplaceId.trim())
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data();
            return { id: d.id, ...data } as Product;
          });
          cb(items);
        },
        (error) => {
          console.error('Error listening to pending products:', error);
          cb([]);
        }
      );
  } catch (error) {
    console.error('Error setting up pending products listener:', error);
    cb([]);
    return () => {}; // Return empty unsubscribe function
  }
}

export async function approveProduct(id: string, adminId: string): Promise<void> {
  try {
    validateProductId(id);
    validateProductId(adminId); // Reuse validation for adminId
    
    await firestore().collection('products').doc(id.trim()).update({
      status: 'approved',
      approvedBy: adminId.trim(),
      rejectionReason: firestore.FieldValue.delete(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving product:', error);
    throw error;
  }
}

export async function rejectProduct(id: string, adminId: string, reason: string): Promise<void> {
  try {
    validateProductId(id);
    validateProductId(adminId);
    validateReason(reason);
    
    await firestore().collection('products').doc(id.trim()).update({
      status: 'rejected',
      reviewedBy: adminId.trim(),
      rejectionReason: reason.trim(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    throw error;
  }
}

export async function requestChanges(id: string, adminId: string, reason: string): Promise<void> {
  try {
    validateProductId(id);
    validateProductId(adminId);
    validateReason(reason);
    
    await firestore().collection('products').doc(id.trim()).update({
      status: 'needs_changes',
      reviewedBy: adminId.trim(),
      rejectionReason: reason.trim(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error requesting changes for product:', error);
    throw error;
  }
}

export async function bulkApprove(ids: string[], adminId: string): Promise<void> {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid product IDs array');
    }
    validateProductId(adminId);
    
    const batch = firestore().batch();
    ids.forEach((id) => {
      validateProductId(id);
      const ref = firestore().collection('products').doc(id.trim());
      batch.update(ref, {
        status: 'approved',
        approvedBy: adminId.trim(),
        rejectionReason: firestore.FieldValue.delete(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error bulk approving products:', error);
    throw error;
  }
}

export async function bulkReject(ids: string[], adminId: string, reason: string): Promise<void> {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid product IDs array');
    }
    validateProductId(adminId);
    validateReason(reason);
    
    const batch = firestore().batch();
    ids.forEach((id) => {
      validateProductId(id);
      const ref = firestore().collection('products').doc(id.trim());
      batch.update(ref, {
        status: 'rejected',
        reviewedBy: adminId.trim(),
        rejectionReason: reason.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error bulk rejecting products:', error);
    throw error;
  }
}