import auth from '@react-native-firebase/auth';
import { approveProduct, rejectProduct, requestChanges, bulkApprove, bulkReject } from './productsRepo';

export async function approveProductByAdmin(productId: string): Promise<void> {
  if (!productId?.trim()) {
    throw new Error('Product ID is required');
  }
  
  const current = auth().currentUser;
  if (!current) {
    throw new Error('Not authenticated');
  }
  
  await approveProduct(productId, current.uid);
}

export async function rejectProductByAdmin(productId: string, reason: string): Promise<void> {
  if (!productId?.trim()) {
    throw new Error('Product ID is required');
  }
  if (!reason?.trim()) {
    throw new Error('Rejection reason required');
  }
  
  const current = auth().currentUser;
  if (!current) {
    throw new Error('Not authenticated');
  }
  
  await rejectProduct(productId, current.uid, reason.trim());
}

export async function requestChangesByAdmin(productId: string, reason: string): Promise<void> {
  if (!productId?.trim()) {
    throw new Error('Product ID is required');
  }
  if (!reason?.trim()) {
    throw new Error('Reason required');
  }
  
  const current = auth().currentUser;
  if (!current) {
    throw new Error('Not authenticated');
  }
  
  await requestChanges(productId, current.uid, reason.trim());
}

export async function bulkApproveByAdmin(ids: string[]): Promise<void> {
  const current = auth().currentUser;
  if (!current) {
    throw new Error('Not authenticated');
  }
  
  await bulkApprove(ids, current.uid);
}

export async function bulkRejectByAdmin(ids: string[], reason: string): Promise<void> {
  if (!reason?.trim()) {
    throw new Error('Rejection reason required');
  }
  
  const current = auth().currentUser;
  if (!current) {
    throw new Error('Not authenticated');
  }
  
  await bulkReject(ids, current.uid, reason.trim());
}