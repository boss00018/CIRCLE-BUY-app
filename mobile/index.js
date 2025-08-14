import {AppRegistry, LogBox} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

// Suppress all console warnings and logs in production
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}

// Suppress specific React Native warnings
LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs([
  'Warning:',
  'Error:',
  'Failed to get ID token',
  'permission-denied',
  'firestore/permission-denied',
  'FCM',
  'Google Sign-In',
  'Play Services',
  'Firebase',
  'Network request failed',
  'Possible Unhandled Promise Rejection',
  'Remote debugger',
  'Setting a timer',
  'componentWillReceiveProps',
  'componentWillMount',
  'VirtualizedLists should never be nested',
]);

// Global error handler to prevent crashes
global.ErrorUtils.setGlobalHandler((error, isFatal) => {
  // Silently handle all errors
  if (__DEV__) {
    console.log('Global error caught:', error);
  }
});

// Suppress unhandled promise rejections
const originalHandler = global.Promise.prototype.catch;
global.Promise.prototype.catch = function(onRejected) {
  return originalHandler.call(this, (error) => {
    // Silently handle promise rejections
    if (__DEV__) {
      console.log('Promise rejection caught:', error);
    }
    if (onRejected) {
      return onRejected(error);
    }
  });
};

AppRegistry.registerComponent(appName, () => App);