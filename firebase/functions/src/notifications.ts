import * as admin from 'firebase-admin';
const db = admin.firestore();

export async function sendToUserDevices(userId: string, payload: admin.messaging.MessagingPayload) {
  const snap = await db.collection('users').doc(userId).collection('devices').get();
  const tokens = snap.docs.map(d => (d.data() as any).token).filter(Boolean);
  if (!tokens.length) return;
  await admin.messaging().sendToDevice(tokens, payload, { priority: 'high' });
}

export async function sendToMarketplaceAdmins(marketplaceId: string, payload: admin.messaging.MessagingPayload) {
  // This assumes admin users are tagged with role=admin and marketplaceId in custom claims.
  // We mirror minimal user info in Firestore users collection to map marketplace -> admin user ids.
  const adminsSnap = await db.collection('users').where('role', '==', 'admin').where('marketplaceId', '==', marketplaceId).get();
  const adminIds = adminsSnap.docs.map(d => d.id);
  await Promise.all(adminIds.map(uid => sendToUserDevices(uid, payload)));
}