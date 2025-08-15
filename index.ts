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

app.get('/health', (_req, res) => res.json({ ok: true, firebase: admin.apps.length > 0 }));

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

const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`CircleBuy server with full Firebase features listening on 0.0.0.0:${PORT}`));