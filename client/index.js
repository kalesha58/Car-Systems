/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background message handler
// This must be called outside of your application logic, as early as possible
// It handles messages when the app is in background or quit state
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);

  // You can perform network requests, update local storage, etc.
  // But you cannot update UI (e.g., via state) in this handler
  
  // Handle different notification types
  if (remoteMessage.data) {
    const { type, orderId, status, chatId } = remoteMessage.data;

    if (type === 'order_update' && orderId) {
      console.log('Background: Order update received', { orderId, status });
      // You can update local storage, sync data, etc.
      // Example: Update cached order status
    } else if (type === 'payment' && orderId) {
      console.log('Background: Payment notification received', { orderId });
      // Handle payment-related background tasks
    } else if (type === 'chat' && chatId) {
      console.log('Background: Chat message received', { chatId });
      // Handle chat-related background tasks
    }
  }

  // The handler must return a promise once logic is completed
  return Promise.resolve();
});

AppRegistry.registerComponent(appName, () => App);
