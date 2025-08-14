<<<<<<< HEAD
# CircleBuy - Secure Marketplace App

A secure React Native marketplace application with real-time features, built with Firebase backend and comprehensive security measures.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- React Native development environment
- Firebase project
- Android Studio / Xcode

### Setup
1. **Validate Setup**: `node validate-setup.js`
2. **Start Development**: `start.bat` (Windows) or follow manual steps below

### Manual Setup

#### 1. Server Setup
```bash
cd server
npm install
cp .env.sample .env
# Configure .env with your Firebase service account
npm run dev
```

#### 2. Mobile Setup
```bash
cd mobile
npm install
cp .env.sample .env
# Configure .env with Firebase Web Client ID
npm run validate
npm start
```

#### 3. Run Mobile App
```bash
# Android
npm run android

# iOS
npm run ios
```

## 🔒 Security Features

### ✅ Fixed Vulnerabilities
- **Hardcoded Credentials**: Environment variable management
- **NoSQL Injection**: Input validation and sanitization
- **XSS Prevention**: Input sanitization and output encoding
- **CSRF Protection**: Request validation and headers
- **Path Traversal**: Secure file handling
- **Error Handling**: Comprehensive error management

### 🛡️ Security Measures
- Environment-based configuration
- Input validation and sanitization
- Secure Firebase rules
- HTTPS enforcement (production)
- Rate limiting and monitoring
- Encrypted storage for sensitive data

## 📱 Features

### User Roles
- **Buyers**: Browse and purchase products
- **Sellers**: List and manage products
- **Admins**: Moderate marketplace content
- **Super Admins**: Manage marketplaces and assign roles

### Real-time Features
- Live product updates
- Real-time notifications
- Instant messaging
- Live inventory tracking

### Core Functionality
- Product listing and browsing
- Image upload and management
- User authentication (Google Sign-In)
- Role-based access control
- Product moderation workflow
- Marketplace management

## 🏗️ Architecture

### Frontend (React Native)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation 6
- **UI Components**: Custom styled components
- **Real-time**: Firebase Firestore listeners
- **Authentication**: Firebase Auth + Google Sign-In

### Backend (Node.js + Express)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **File Storage**: Firebase Storage
- **API**: RESTful endpoints
- **Security**: CORS, rate limiting, input validation

### Infrastructure
- **Hosting**: Firebase Hosting (recommended)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Push Notifications**: Firebase Cloud Messaging

## 📂 Project Structure

```
circlebuy-reactnative/
├── mobile/                 # React Native app
│   ├── src/app/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Screen components
│   │   ├── navigation/     # Navigation configuration
│   │   ├── services/       # API and Firebase services
│   │   ├── state/          # Redux store and slices
│   │   └── utils/          # Utility functions
│   ├── android/            # Android-specific files
│   ├── ios/                # iOS-specific files
│   └── .env                # Environment variables
├── server/                 # Node.js backend
│   ├── src/
│   │   └── index.ts        # Express server
│   └── .env                # Server environment variables
├── firebase/               # Firebase configuration
└── docs/                   # Documentation
```

## 🔧 Configuration

### Environment Variables

#### Mobile (.env)
```
FIREBASE_WEB_CLIENT_ID=your-web-client-id
SERVER_URL=http://localhost:8000
NODE_ENV=development
```

#### Server (.env)
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
PORT=8000
SUPERADMIN_EMAIL=admin@example.com
```

### Firebase Configuration
1. Download `google-services.json` (Android)
2. Download `GoogleService-Info.plist` (iOS)
3. Place in respective platform directories

## 🧪 Testing

```bash
# Run tests
npm test

# Security audit
npm run audit:security

# Lint code
npm run lint
```

## 🚀 Deployment

### Production Build
```bash
# Validate configuration
npm run validate

# Build for Android
npm run build:android

# Build for iOS
npm run build:ios
```

### Server Deployment
```bash
cd server
npm run build
npm start
```

## 📊 Monitoring

- Firebase Analytics for user behavior
- Firebase Crashlytics for error tracking
- Custom logging for security events
- Performance monitoring with Firebase Performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run security validation: `npm run validate`
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check `setup.md` for detailed setup instructions
- Review `SECURITY.md` for security guidelines
- See `FIXES_APPLIED.md` for resolved issues

## 🔄 Updates

Regular security updates and dependency maintenance:
- Monthly dependency updates
- Quarterly security audits
- Continuous monitoring and improvements
=======
# CircleBuy Server

Backend API for CircleBuy marketplace application.

## Deployment

This server is configured for Railway deployment.

### Environment Variables Required:
- `GOOGLE_APPLICATION_CREDENTIALS` - Firebase service account JSON
- `SUPERADMIN_EMAIL` - Super admin email address
- `PORT` - Server port (default: 8000)

### Build Commands:
- Build: `npm run build`
- Start: `npm start`
- Development: `npm run dev`
>>>>>>> 455ac077de6ca9e4040fc43db46e2144624e1e5d
