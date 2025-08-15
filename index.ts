import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, message: 'CircleBuy server is running' }));

// Basic auth endpoint for testing
app.post('/auth/assign-role', (req, res) => {
  res.json({ 
    role: 'user', 
    message: 'Server is running - Firebase integration pending' 
  });
});

const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CircleBuy server listening on 0.0.0.0:${PORT}`);
  console.log('Server is running successfully!');
});