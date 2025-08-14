import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { upsertUserProfile } from '../firestore/usersRepo';

export class RealtimeConnection {
  private static instance: RealtimeConnection;
  private isConnected = false;
  private listeners: (() => void)[] = [];

  static getInstance(): RealtimeConnection {
    if (!RealtimeConnection.instance) {
      RealtimeConnection.instance = new RealtimeConnection();
    }
    return RealtimeConnection.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Set up auth state listener
      const unsubAuth = auth().onAuthStateChanged(async (user) => {
        if (user) {
          try {
            await upsertUserProfile();
            this.isConnected = true;
          } catch (error) {
            console.error('Error updating user profile:', error);
          }
        } else {
          this.isConnected = false;
        }
      });

      this.listeners.push(unsubAuth);
    } catch (error) {
      console.error('Error initializing realtime connection:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  cleanup(): void {
    this.listeners.forEach(unsub => {
      try {
        unsub();
      } catch (error) {
        console.warn('Error cleaning up listener:', error);
      }
    });
    this.listeners = [];
    this.isConnected = false;
  }
}

export const realtimeConnection = RealtimeConnection.getInstance();