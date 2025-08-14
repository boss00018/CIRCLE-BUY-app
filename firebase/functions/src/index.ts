import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendToUserDevices, sendToMarketplaceAdmins } from './notifications';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// When product is created, notify admins for that marketplace
export const onProductCreated = functions.firestore
  .document('products/{productId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() as any;
    if (!data?.marketplaceId) return;
    await sendToMarketplaceAdmins(data.marketplaceId, {
      notification: {
        title: 'New submission',
        body: `${data.name} is pending approval`,
      },
      data: { type: 'submission', productId: context.params.productId },
    });
  });

// When product status changes, notify owner and log moderation
export const onProductModerated = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data() as any;
    const before = change.before.data() as any;

    if (!after || !before) return;
    if (before.status === after.status) return;

    await db.collection('moderation_logs').add({
      productId: context.params.productId,
      from: before.status,
      to: after.status,
      at: admin.firestore.FieldValue.serverTimestamp(),
      by: after.approvedBy || after.rejectedBy || null,
      reason: after.rejectionReason || null,
    });

    const ownerId = after.sellerId;
    let title = 'Submission updated';
    let body = `Your item ${after.name} status: ${after.status}`;
    if (after.status === 'approved') { title = 'Item approved'; body = `${after.name} is now live`; }
    if (after.status === 'rejected') { title = 'Item rejected'; body = after.rejectionReason || `${after.name} was rejected`; }
    if (after.status === 'needs_changes') { title = 'Changes requested'; body = after.rejectionReason || `Please update ${after.name}`; }

    await sendToUserDevices(ownerId, {
      notification: { title, body },
      data: { type: 'moderation', productId: context.params.productId, status: after.status },
    });
  });

// Ensure initial role for super admin by email
export const ensureSuperAdmin = functions.auth.user().onCreate(async (user) => {
  const superEmail = 'circlebuy0018@gmail.com';
  if (user.email?.toLowerCase() === superEmail) {
    await admin.auth().setCustomUserClaims(user.uid, { role: 'super_admin' });
  }
});