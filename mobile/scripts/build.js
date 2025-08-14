#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 CircleBuy Build Script');
console.log('========================');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please copy .env.sample to .env and configure it.');
  process.exit(1);
}

// Check if Firebase config files exist
const androidConfigPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
const iosConfigPath = path.join(__dirname, '..', 'ios', 'GoogleService-Info.plist');

if (!fs.existsSync(androidConfigPath)) {
  console.warn('⚠️  Android Firebase config (google-services.json) not found.');
}

if (!fs.existsSync(iosConfigPath)) {
  console.warn('⚠️  iOS Firebase config (GoogleService-Info.plist) not found.');
}

// Read and validate .env file
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const envVars = {};
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  // Check required environment variables
  const requiredVars = ['FIREBASE_WEB_CLIENT_ID', 'SERVER_URL'];
  const missingVars = requiredVars.filter(varName => !envVars[varName] || envVars[varName] === 'your-firebase-web-client-id-here');
  
  if (missingVars.length > 0) {
    console.error('❌ Missing or invalid environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('Please update your .env file with valid values.');
    process.exit(1);
  }

  console.log('✅ Environment configuration validated');
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  process.exit(1);
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Run security audit
console.log('🔒 Running security audit...');
try {
  execSync('npm audit --audit-level moderate', { stdio: 'inherit' });
  console.log('✅ Security audit passed');
} catch (error) {
  console.warn('⚠️  Security audit found issues. Please review and fix them.');
}

// Build for platform
const platform = process.argv[2];
if (platform === 'android') {
  console.log('🤖 Building for Android...');
  try {
    execSync('cd android && .\\gradlew assembleRelease', { stdio: 'inherit' });
    console.log('✅ Android build completed');
  } catch (error) {
    console.error('❌ Android build failed');
    process.exit(1);
  }
} else if (platform === 'ios') {
  console.log('🍎 Building for iOS...');
  try {
    execSync('npx react-native run-ios --configuration Release', { stdio: 'inherit' });
    console.log('✅ iOS build completed');
  } catch (error) {
    console.error('❌ iOS build failed');
    process.exit(1);
  }
} else {
  console.log('✅ Build script completed. Run with "android" or "ios" argument to build for specific platform.');
}

console.log('🎉 Build process completed successfully!');