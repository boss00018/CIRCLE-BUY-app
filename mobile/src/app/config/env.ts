/**
 * Environment configuration for CircleBuy Mobile App
 * Pre-configured with Firebase settings
 */
export interface EnvConfig {
  FIREBASE_WEB_CLIENT_ID?: string;
  SERVER_URL?: string;
  NODE_ENV?: string;
}

export const ENV: EnvConfig = {
  FIREBASE_WEB_CLIENT_ID: '999994603165-q9dh53nltumv8sbj6lnbv4loe8q0j4q7.apps.googleusercontent.com',
  SERVER_URL: 'http://192.168.0.8:8000',
  NODE_ENV: 'development'
};