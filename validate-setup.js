#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 CircleBuy Setup Validation');
console.log('============================\n');

let hasErrors = false;

// Check server configuration
console.log('📋 Checking Server Configuration...');
const serverEnvPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(serverEnvPath)) {
  console.error('❌ Server .env file missing');
  hasErrors = true;
} else {
  const serverEnv = fs.readFileSync(serverEnvPath, 'utf8');
  if (!serverEnv.includes('GOOGLE_APPLICATION_CREDENTIALS=') || 
      serverEnv.includes('GOOGLE_APPLICATION_CREDENTIALS=\n')) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not configured in server/.env');
    hasErrors = true;
  } else {
    console.log('✅ Server environment configured');
  }
}

// Check mobile configuration
console.log('\n📱 Checking Mobile Configuration...');
const mobileEnvPath = path.join(__dirname, 'mobile', '.env');
if (!fs.existsSync(mobileEnvPath)) {
  console.error('❌ Mobile .env file missing');
  hasErrors = true;
} else {
  const mobileEnv = fs.readFileSync(mobileEnvPath, 'utf8');
  if (!mobileEnv.includes('FIREBASE_WEB_CLIENT_ID=') || 
      mobileEnv.includes('FIREBASE_WEB_CLIENT_ID=your-firebase-web-client-id-here')) {
    console.error('❌ FIREBASE_WEB_CLIENT_ID not configured in mobile/.env');
    hasErrors = true;
  } else {
    console.log('✅ Mobile environment configured');
  }
}

// Check Firebase configuration files
console.log('\n🔥 Checking Firebase Configuration...');
const androidConfigPath = path.join(__dirname, 'mobile', 'android', 'app', 'google-services.json');
const iosConfigPath = path.join(__dirname, 'mobile', 'ios', 'GoogleService-Info.plist');

if (!fs.existsSync(androidConfigPath)) {
  console.warn('⚠️  Android Firebase config missing (google-services.json)');
}

if (!fs.existsSync(iosConfigPath)) {
  console.warn('⚠️  iOS Firebase config missing (GoogleService-Info.plist)');
}

if (fs.existsSync(androidConfigPath) || fs.existsSync(iosConfigPath)) {
  console.log('✅ Firebase configuration files found');
}

// Check dependencies
console.log('\n📦 Checking Dependencies...');
const serverPackageJson = path.join(__dirname, 'server', 'package.json');
const mobilePackageJson = path.join(__dirname, 'mobile', 'package.json');

if (fs.existsSync(serverPackageJson) && fs.existsSync(mobilePackageJson)) {
  console.log('✅ Package.json files found');
} else {
  console.error('❌ Missing package.json files');
  hasErrors = true;
}

// Final result
console.log('\n🎯 Validation Results');
console.log('====================');

if (hasErrors) {
  console.error('❌ Setup validation failed. Please fix the errors above.');
  console.log('\n📖 Setup Guide:');
  console.log('1. Copy server/.env.sample to server/.env and configure');
  console.log('2. Copy mobile/.env.sample to mobile/.env and configure');
  console.log('3. Add Firebase configuration files');
  console.log('4. Run npm install in both server/ and mobile/ directories');
  process.exit(1);
} else {
  console.log('✅ Setup validation passed! Ready to start development.');
  console.log('\n🚀 To start the app:');
  console.log('- Run: start.bat (Windows) or follow setup.md instructions');
  console.log('- Server will be available at http://localhost:8000');
  console.log('- Mobile app will connect automatically');
}