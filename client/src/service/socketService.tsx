import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { tokenStorage } from '@state/storage';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (socket?.connected) {
    return socket;
  }

  // If socket exists but not connected, disconnect it first
  if (socket && !socket.connected) {
    socket.disconnect();
    socket = null;
  }

  const token = tokenStorage.getString('accessToken');
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChatRoom = (chatId: string): void => {
  if (socket && socket.connected) {
    socket.emit('joinChat', chatId);
    console.log('Joined chat room:', chatId);
  } else {
    console.warn('Cannot join chat room: socket not connected');
    // Try to initialize if not connected
    if (!socket) {
      initializeSocket();
    }
  }
};

export const leaveChatRoom = (chatId: string): void => {
  if (socket) {
    socket.emit('leaveChat', chatId);
  }
};

export const onNewMessage = (callback: (message: any) => void): void => {
  if (socket) {
    socket.on('newMessage', callback);
    console.log('Added newMessage listener');
  } else {
    console.warn('Cannot add newMessage listener: socket not initialized');
  }
};

export const offNewMessage = (): void => {
  if (socket) {
    socket.off('newMessage');
    console.log('Removed newMessage listeners');
  }
};

export const onUserTyping = (callback: (data: { chatId: string; userId: string; userName?: string }) => void): void => {
  if (socket) {
    socket.on('userTyping', callback);
    console.log('Added userTyping listener');
  } else {
    console.warn('Cannot add userTyping listener: socket not initialized');
  }
};

export const offUserTyping = (): void => {
  if (socket) {
    socket.off('userTyping');
    console.log('Removed userTyping listeners');
  }
};

export const onUserStoppedTyping = (callback: (data: { chatId: string; userId: string }) => void): void => {
  if (socket) {
    socket.on('userStoppedTyping', callback);
    console.log('Added userStoppedTyping listener');
  } else {
    console.warn('Cannot add userStoppedTyping listener: socket not initialized');
  }
};

export const offUserStoppedTyping = (): void => {
  if (socket) {
    socket.off('userStoppedTyping');
    console.log('Removed userStoppedTyping listeners');
  }
};

export const emitTyping = (chatId: string, userId: string, userName?: string): void => {
  if (socket && socket.connected) {
    socket.emit('typing', { chatId, userId, userName });
  } else {
    console.warn('Cannot emit typing: socket not connected');
  }
};

export const emitStopTyping = (chatId: string, userId: string): void => {
  if (socket && socket.connected) {
    socket.emit('stopTyping', { chatId, userId });
  } else {
    console.warn('Cannot emit stopTyping: socket not connected');
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Join user notification room for real-time notifications
 */
export const joinUserNotificationRoom = (userId: string): void => {
  if (socket && socket.connected) {
    socket.emit('joinUserNotifications', userId);
    console.log('Joined user notification room:', userId);
  } else {
    console.warn('Cannot join user notification room: socket not connected');
    // Try to initialize if not connected
    if (!socket) {
      initializeSocket();
    }
  }
};

/**
 * Listen for new notifications
 */
export const onNewNotification = (callback: (notification: any) => void): void => {
  if (socket) {
    socket.on('newNotification', callback);
    console.log('Added newNotification listener');
  } else {
    console.warn('Cannot add newNotification listener: socket not initialized');
  }
};

/**
 * Remove new notification listener
 */
export const offNewNotification = (): void => {
  if (socket) {
    socket.off('newNotification');
    console.log('Removed newNotification listeners');
  }
};



