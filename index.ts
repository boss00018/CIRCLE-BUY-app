import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import admin from 'firebase-admin';
import { z } from 'zod';

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "circlebuy-5a8d9",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com"
  };
    
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:8081', 'http://10.0.2.2:8000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Additional headers for mobile requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Simple health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Middleware: verify Firebase ID token
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

// Auto-assign role on first login
app.post('/auth/assign-role', verifyAuth, async (req, res) => {
  try {
    const caller = (req as any).user as admin.auth.DecodedIdToken;
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'circlebuy0018@gmail.com';
    
    if (caller.email === superAdminEmail) {
      await admin.auth().setCustomUserClaims(caller.uid, { role: 'super_admin' });
      return res.json({ role: 'super_admin' });
    }
    
    // Check if user is an assigned admin
    const adminMarketplaceSnap = await admin.firestore()
      .collection('marketplaces')
      .where('adminEmail', '==', caller.email)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (!adminMarketplaceSnap.empty) {
      const marketplace = adminMarketplaceSnap.docs[0];
      const marketplaceId = marketplace.id;
      await admin.auth().setCustomUserClaims(caller.uid, { 
        role: 'admin', 
        marketplaceId 
      });
      return res.json({ role: 'admin', marketplaceId });
    }
    
    // Check domain authorization
    const emailDomain = caller.email?.split('@')[1];
    if (!emailDomain) {
      return res.status(403).json({ error: 'Invalid email format' });
    }
    
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (publicDomains.includes(emailDomain.toLowerCase())) {
      return res.status(403).json({ 
        error: 'Unauthorized domain. Please login with your university email.' 
      });
    }
    
    const marketplaceSnap = await admin.firestore()
      .collection('marketplaces')
      .where('domain', '==', emailDomain.toLowerCase())
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (marketplaceSnap.empty) {
      return res.status(403).json({ 
        error: 'Unauthorized domain. Please login with your university email.' 
      });
    }
    
    const marketplace = marketplaceSnap.docs[0];
    const marketplaceId = marketplace.id;
    
    await admin.auth().setCustomUserClaims(caller.uid, { 
      role: 'user', 
      marketplaceId 
    });
    return res.json({ role: 'user', marketplaceId });
    
  } catch (error) {
    console.error('Error assigning role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`CircleBuy server listening on 0.0.0.0:${PORT}`));