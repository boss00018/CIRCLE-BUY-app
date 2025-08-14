/**
 * Environment configuration sample for CircleBuy Mobile App
 * Copy this to env.ts and configure with your actual values
 */
export interface EnvConfig {
  FIREBASE_WEB_CLIENT_ID?: string;
  SERVER_URL?: string;
  NODE_ENV?: string;
}

export const ENV: EnvConfig = {
  FIREBASE_WEB_CLIENT_ID: "your-firebase-web-client-id-here",
  SERVER_URL: "https://circlebuy-server.onrender.com",
  NODE_ENV: "development"
};