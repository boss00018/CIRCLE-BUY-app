import AsyncStorage from '@react-native-async-storage/async-storage';
import authRN from '@react-native-firebase/auth';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image';
}

class P2PMessaging {
  private localMessages: Message[] = [];
  private messageCallbacks: ((message: Message) => void)[] = [];

  constructor() {
    this.loadLocalMessages();
  }

  // Send message with local storage
  async sendMessage(receiverId: string, content: string, type: 'text' | 'image' = 'text') {
    const currentUserId = authRN().currentUser?.uid || 'anonymous';
    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId,
      content,
      timestamp: Date.now(),
      type
    };

    await this.storeMessageLocally(message);
    this.localMessages.push(message);
    this.notifyMessageCallbacks(message);
  }

  private async storeMessageLocally(message: Message) {
    try {
      const key = `messages_${message.senderId}_${message.receiverId}`;
      const existing = await AsyncStorage.getItem(key);
      const messages = existing ? JSON.parse(existing) : [];
      messages.push(message);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('Error storing message:', error);
    }
  }

  private async loadLocalMessages() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const messageKeys = keys.filter(key => key.startsWith('messages_'));
      
      for (const key of messageKeys) {
        const messages = await AsyncStorage.getItem(key);
        if (messages) {
          this.localMessages.push(...JSON.parse(messages));
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  getMessages(userId1: string, userId2: string): Message[] {
    return this.localMessages.filter(msg => 
      (msg.senderId === userId1 && msg.receiverId === userId2) ||
      (msg.senderId === userId2 && msg.receiverId === userId1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
  }

  private notifyMessageCallbacks(message: Message) {
    this.messageCallbacks.forEach(callback => callback(message));
  }
}

export default new P2PMessaging();