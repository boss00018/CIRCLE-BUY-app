import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import admin from 'firebase-admin';
import { z } from 'zod';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Parse the JSON credentials from environment variable
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      console.log('No Firebase credentials found');
      admin.initializeApp({ projectId: "circlebuy-5a8d9" });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    admin.initializeApp({ projectId: "circlebuy-5a8d9" });
  }
}

const app = express();

app.use(cors({ origin: '*', credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true, firebase: admin.apps.length > 0, timestamp: new Date().toISOString() }));



async function verifyAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = await admin.auth().verifyIdToken(token, true);
    (req as any).user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/auth/assign-role', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'circlebuy0018@gmail.com';
    
    if (caller.email === superAdminEmail) {
      await admin.auth().setCustomUserClaims(caller.uid, { role: 'super_admin' });
      return res.json({ role: 'super_admin' });
    }
    
    const adminMarketplaceSnap = await admin.firestore().collection('marketplaces').where('adminEmail', '==', caller.email).where('status', '==', 'active').limit(1).get();
    
    if (!adminMarketplaceSnap.empty) {
      const marketplace = adminMarketplaceSnap.docs[0];
      const marketplaceId = marketplace.id;
      await admin.auth().setCustomUserClaims(caller.uid, { role: 'admin', marketplaceId });
      return res.json({ role: 'admin', marketplaceId });
    }
    
    const emailDomain = caller.email?.split('@')[1];
    if (!emailDomain) return res.status(403).json({ error: 'Invalid email format' });
    
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (publicDomains.includes(emailDomain.toLowerCase())) {
      return res.status(403).json({ error: 'Unauthorized domain. Please login with your university email.' });
    }
    
    const marketplaceSnap = await admin.firestore().collection('marketplaces').where('domain', '==', emailDomain.toLowerCase()).where('status', '==', 'active').limit(1).get();
    
    if (marketplaceSnap.empty) {
      return res.status(403).json({ error: 'Unauthorized domain. Please login with your university email.' });
    }
    
    const marketplace = marketplaceSnap.docs[0];
    const marketplaceId = marketplace.id;
    
    await admin.auth().setCustomUserClaims(caller.uid, { role: 'user', marketplaceId });
    return res.json({ role: 'user', marketplaceId });
    
  } catch (error) {
    console.error('Error assigning role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const CreateMarketplaceSchema = z.object({ name: z.string().min(3), domain: z.string().min(3), adminEmail: z.string().email() });
app.post('/marketplaces/create', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'super_admin') return res.status(403).json({ error: 'Only super admin can create marketplaces' });
    
    const parsed = CreateMarketplaceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { name, domain, adminEmail } = parsed.data;
    
    const marketplaceRef = await admin.firestore().collection('marketplaces').add({
      name, domain, adminEmail, status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      stats: { totalUsers: 0, totalProducts: 0, pendingProducts: 0 }
    });
    
    return res.json({ marketplaceId: marketplaceRef.id });
  } catch (error) {
    console.error('Error creating marketplace:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/marketplaces', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    
    const snapshot = await admin.firestore().collection('marketplaces').get();
    const marketplaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return res.json({ marketplaces });
  } catch (error) {
    console.error('Error fetching marketplaces:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete marketplace
app.delete('/marketplaces/:id', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    
    const marketplaceId = req.params.id;
    
    // Delete marketplace data in batches
    const deleteCollection = async (collectionName: string, field: string) => {
      const query = admin.firestore().collection(collectionName).where(field, '==', marketplaceId).limit(500);
      let snapshot = await query.get();
      
      while (!snapshot.empty) {
        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        snapshot = await query.get();
      }
    };
    
    // Delete related data
    await deleteCollection('products', 'marketplaceId');
    await deleteCollection('users', 'marketplaceId');
    await deleteCollection('chats', 'marketplaceId');
    await deleteCollection('lostItems', 'marketplaceId');
    await deleteCollection('productRequests', 'marketplaceId');
    await deleteCollection('donations', 'marketplaceId');
    await deleteCollection('messages', 'marketplaceId');
    
    // Delete marketplace
    await admin.firestore().collection('marketplaces').doc(marketplaceId).delete();
    
    return res.json({ success: true, message: 'Marketplace deleted successfully' });
  } catch (error) {
    console.error('Error deleting marketplace:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cleanup orphaned data
app.post('/cleanup-orphaned-data', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    
    // Get all active marketplace IDs
    const marketplacesSnapshot = await admin.firestore().collection('marketplaces').get();
    const activeMarketplaceIds = marketplacesSnapshot.docs.map(doc => doc.id);
    
    let deletedCount = 0;
    
    // Clean orphaned data from multiple collections
    const collections = ['products', 'users', 'chats', 'lostItems', 'productRequests', 'donations', 'messages'];
    
    for (const collectionName of collections) {
      const snapshot = await admin.firestore().collection(collectionName).get();
      const batch = admin.firestore().batch();
      let batchCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.marketplaceId && !activeMarketplaceIds.includes(data.marketplaceId)) {
          batch.delete(doc.ref);
          deletedCount++;
          batchCount++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }
      
      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }
    }
    
    return res.json({ success: true, deletedCount, message: `Cleaned up ${deletedCount} orphaned records` });
  } catch (error) {
    console.error('Error cleaning orphaned data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Product Requests endpoints
const ProductRequestSchema = z.object({
  productName: z.string().min(1),
  description: z.string().min(1),
  contactDetails: z.string().min(1)
});

app.post('/product-requests', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    console.log('Product request from user:', caller.email, 'marketplace:', caller.marketplaceId);
    
    const parsed = ProductRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('Validation error:', parsed.error);
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const { productName, description, contactDetails } = parsed.data;
    
    const requestRef = await admin.firestore().collection('productRequests').add({
      productName,
      description,
      contactDetails,
      requesterId: caller.uid,
      requesterEmail: caller.email,
      marketplaceId: caller.marketplaceId || 'default',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Product request created:', requestRef.id);
    return res.json({ id: requestRef.id, message: 'Product request submitted' });
  } catch (error) {
    console.error('Error creating product request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/product-requests', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const status = req.query.status as string;
    const marketplaceId = caller.marketplaceId || 'default';
    
    console.log('Fetching product requests for marketplace:', marketplaceId, 'status:', status);
    
    let query = admin.firestore().collection('productRequests')
      .where('marketplaceId', '==', marketplaceId)
      .orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    
    console.log('Found', requests.length, 'product requests');
    return res.json({ requests });
  } catch (error) {
    console.error('Error fetching product requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/product-requests/:id/approve', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'admin' && caller.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can approve requests' });
    }
    
    const requestId = req.params.id;
    const approvalTime = admin.firestore.FieldValue.serverTimestamp();
    const expiryTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    await admin.firestore().collection('productRequests').doc(requestId).update({
      status: 'approved',
      approvedAt: approvalTime,
      expiresAt: expiryTime,
      approvedBy: caller.uid
    });
    
    return res.json({ message: 'Product request approved' });
  } catch (error) {
    console.error('Error approving product request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/product-requests/:id/reject', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'admin' && caller.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can reject requests' });
    }
    
    const requestId = req.params.id;
    const { reason } = req.body;
    
    await admin.firestore().collection('productRequests').doc(requestId).update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || 'No reason provided',
      rejectedBy: caller.uid
    });
    
    return res.json({ message: 'Product request rejected' });
  } catch (error) {
    console.error('Error rejecting product request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Lost Items endpoints
const LostItemSchema = z.object({
  itemName: z.string().min(1),
  description: z.string().min(1),
  contactDetails: z.string().min(1)
});

app.post('/lost-items', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const parsed = LostItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request data' });

    const { itemName, description, contactDetails } = parsed.data;
    
    const itemRef = await admin.firestore().collection('lostItems').add({
      itemName,
      description,
      contactDetails,
      reporterId: caller.uid,
      reporterEmail: caller.email,
      marketplaceId: caller.marketplaceId || 'default',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.json({ id: itemRef.id, message: 'Lost item reported' });
  } catch (error) {
    console.error('Error creating lost item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/lost-items', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const status = req.query.status as string;
    
    let query = admin.firestore().collection('lostItems')
      .where('marketplaceId', '==', caller.marketplaceId)
      .orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    
    return res.json({ items });
  } catch (error) {
    console.error('Error fetching lost items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/lost-items/:id/approve', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'admin' && caller.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can approve items' });
    }
    
    const itemId = req.params.id;
    const approvalTime = admin.firestore.FieldValue.serverTimestamp();
    const expiryTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    await admin.firestore().collection('lostItems').doc(itemId).update({
      status: 'approved',
      approvedAt: approvalTime,
      expiresAt: expiryTime,
      approvedBy: caller.uid
    });
    
    return res.json({ message: 'Lost item approved' });
  } catch (error) {
    console.error('Error approving lost item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/lost-items/:id/reject', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'admin' && caller.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can reject items' });
    }
    
    const itemId = req.params.id;
    const { reason } = req.body;
    
    await admin.firestore().collection('lostItems').doc(itemId).update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || 'No reason provided',
      rejectedBy: caller.uid
    });
    
    return res.json({ message: 'Lost item rejected' });
  } catch (error) {
    console.error('Error rejecting lost item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Donations endpoints
const DonationSchema = z.object({
  itemName: z.string().min(1),
  description: z.string().min(1),
  contactDetails: z.string().min(1)
});

app.post('/donations', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const parsed = DonationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request data' });

    const { itemName, description, contactDetails } = parsed.data;
    
    const donationRef = await admin.firestore().collection('donations').add({
      itemName,
      description,
      contactDetails,
      donorId: caller.uid,
      donorEmail: caller.email,
      marketplaceId: caller.marketplaceId || 'default',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.json({ id: donationRef.id, message: 'Donation submitted' });
  } catch (error) {
    console.error('Error creating donation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/donations', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const status = req.query.status as string;
    
    let query = admin.firestore().collection('donations')
      .where('marketplaceId', '==', caller.marketplaceId)
      .orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    const donations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    
    return res.json({ donations });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/donations/:id/approve', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'admin' && caller.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can approve donations' });
    }
    
    const donationId = req.params.id;
    
    await admin.firestore().collection('donations').doc(donationId).update({
      status: 'approved',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: caller.uid
    });
    
    return res.json({ message: 'Donation approved' });
  } catch (error) {
    console.error('Error approving donation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/donations/:id/reject', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    if (caller.role !== 'admin' && caller.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can reject donations' });
    }
    
    const donationId = req.params.id;
    const { reason } = req.body;
    
    await admin.firestore().collection('donations').doc(donationId).update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || 'No reason provided',
      rejectedBy: caller.uid
    });
    
    return res.json({ message: 'Donation rejected' });
  } catch (error) {
    console.error('Error rejecting donation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Products endpoints
app.put('/products/:id/mark-sold', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const productId = req.params.id;
    
    // Get product to verify ownership
    const productDoc = await admin.firestore().collection('products').doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productDoc.data();
    if (!product || product.sellerId !== caller.uid) {
      return res.status(403).json({ error: 'Not authorized to modify this product' });
    }
    
    // Mark as orphaned and move to sold status
    await admin.firestore().collection('products').doc(productId).update({
      status: 'orphaned',
      soldAt: admin.firestore.FieldValue.serverTimestamp(),
      orphanedAt: admin.firestore.FieldValue.serverTimestamp(),
      soldBy: caller.uid
    });
    
    return res.json({ message: 'Product marked as sold' });
  } catch (error) {
    console.error('Error marking product as sold:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Messages endpoints
app.post('/messages', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const { receiverId, productId, message } = req.body;
    
    if (!receiverId || !message?.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const messageRef = await admin.firestore().collection('messages').add({
      senderId: caller.uid,
      senderEmail: caller.email,
      receiverId,
      productId: productId || null,
      message: message.trim(),
      marketplaceId: caller.marketplaceId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
    return res.json({ id: messageRef.id, message: 'Message sent' });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/messages', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const { chatWith } = req.query;
    
    let query = admin.firestore().collection('messages')
      .where('marketplaceId', '==', caller.marketplaceId)
      .orderBy('createdAt', 'desc')
      .limit(50);
    
    if (chatWith) {
      // Get messages between caller and specific user
      query = admin.firestore().collection('messages')
        .where('marketplaceId', '==', caller.marketplaceId)
        .where('senderId', 'in', [caller.uid, chatWith])
        .where('receiverId', 'in', [caller.uid, chatWith])
        .orderBy('createdAt', 'desc')
        .limit(50);
    } else {
      // Get all messages for caller
      query = admin.firestore().collection('messages')
        .where('marketplaceId', '==', caller.marketplaceId)
        .where('receiverId', '==', caller.uid)
        .orderBy('createdAt', 'desc')
        .limit(50);
    }
    
    const snapshot = await query.get();
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    
    return res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`CircleBuy server with full Firebase features listening on 0.0.0.0:${PORT}`));