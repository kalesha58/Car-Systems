import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { tokenStorage } from '@state/storage';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const token = tokenStorage.getString('accessToken');
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
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
  if (socket) {
    socket.emit('joinChat', chatId);
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
  }
};

export const offNewMessage = (): void => {
  if (socket) {
    socket.off('newMessage');
  }
};

export const onUserTyping = (callback: (data: { chatId: string; userId: string; userName?: string }) => void): void => {
  if (socket) {
    socket.on('userTyping', callback);
  }
};

export const offUserTyping = (): void => {
  if (socket) {
    socket.off('userTyping');
  }
};

export const onUserStoppedTyping = (callback: (data: { chatId: string; userId: string }) => void): void => {
  if (socket) {
    socket.on('userStoppedTyping', callback);
  }
};

export const offUserStoppedTyping = (): void => {
  if (socket) {
    socket.off('userStoppedTyping');
  }
};

export const emitTyping = (chatId: string, userId: string, userName?: string): void => {
  if (socket) {
    socket.emit('typing', { chatId, userId, userName });
  }
};

export const emitStopTyping = (chatId: string, userId: string): void => {
  if (socket) {
    socket.emit('stopTyping', { chatId, userId });
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};


