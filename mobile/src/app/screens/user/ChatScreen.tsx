import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function ChatScreen({ route, navigation }: any) {
  const { productId, sellerId, productName } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const user = auth().currentUser;
  const chatId = `${productId}_${user?.uid}_${sellerId}`;

  useEffect(() => {
    if (!user) return;

    // Check message count and cooldown
    const checkLimits = async () => {
      const chatDoc = await firestore().collection('chats').doc(chatId).get();
      if (chatDoc.exists) {
        const data = chatDoc.data();
        const lastReset = data?.lastReset?.toDate();
        const now = new Date();
        
        // Reset count if more than 1 hour passed
        if (!lastReset || (now.getTime() - lastReset.getTime()) > 3600000) {
          await firestore().collection('chats').doc(chatId).update({
            messageCount: 0,
            lastReset: firestore.FieldValue.serverTimestamp(),
          });
          setMessageCount(0);
        } else {
          setMessageCount(data?.messageCount || 0);
          if (data?.messageCount >= 10) {
            const cooldownTime = new Date(lastReset.getTime() + 3600000);
            setCooldownEnd(cooldownTime);
          }
        }
      }
    };

    checkLimits();

    // Listen to messages
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const messageList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          setMessages(messageList);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching messages:', error);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [chatId, user]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    if (messageCount >= 10) {
      Alert.alert('Message Limit', 'You have reached the 10 messages per hour limit. Please wait for cooldown.');
      return;
    }

    try {
      const messageRef = firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc();

      await messageRef.set({
        text: newMessage.trim(),
        senderId: user.uid,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      // Update chat metadata
      await firestore().collection('chats').doc(chatId).set({
        productId,
        participants: [user.uid, sellerId],
        lastMessage: newMessage.trim(),
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        messageCount: messageCount + 1,
        lastReset: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      setNewMessage('');
      setMessageCount(prev => prev + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const deleteChat = () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This will remove all messages and connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            // Delete all messages
            const messagesSnap = await firestore()
              .collection('chats')
              .doc(chatId)
              .collection('messages')
              .get();
            
            const batch = firestore().batch();
            messagesSnap.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            
            // Delete chat document
            batch.delete(firestore().collection('chats').doc(chatId));
            
            await batch.commit();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete chat');
          }
        }}
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMyMessage ? styles.myMessageText : styles.otherMessageText
        ]}>
          {item.text}
        </Text>
      </View>
    );
  };

  const canSendMessage = messageCount < 10 && (!cooldownEnd || new Date() > cooldownEnd);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.productName}>{productName}</Text>
        <Pressable onPress={deleteChat} style={styles.deleteButton}>
          <Text style={styles.deleteText}>🗑️</Text>
        </Pressable>
      </View>
      
      <Text style={styles.messageLimit}>
        Messages: {messageCount}/10 per hour
        {cooldownEnd && new Date() < cooldownEnd && (
          <Text style={styles.cooldown}> (Cooldown until {cooldownEnd.toLocaleTimeString()})</Text>
        )}
      </Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        inverted
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading messages...</Text>
          ) : (
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          )
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={canSendMessage ? "Type a message..." : "Message limit reached"}
          style={[styles.textInput, !canSendMessage && styles.textInputDisabled]}
          placeholderTextColor="#9ca3af"
          editable={canSendMessage}
          multiline
        />
        <Pressable
          onPress={sendMessage}
          disabled={!canSendMessage || !newMessage.trim()}
          style={[
            styles.sendButton,
            (!canSendMessage || !newMessage.trim()) && styles.sendButtonDisabled
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
  messageLimit: {
    padding: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
  },
  cooldown: {
    color: '#dc2626',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#111827',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textInputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});