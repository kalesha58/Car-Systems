import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

let io: SocketServer | null = null;

/**
 * Initialize Socket.io server
 */
export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  if (io) {
    logger.warn('Socket.io already initialized');
    return io;
  }

  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Handle connection
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Handle joinRoom event (for orders)
    socket.on('joinRoom', (orderId: string) => {
      if (!orderId) {
        logger.warn(`Invalid orderId for joinRoom from socket ${socket.id}`);
        return;
      }

      const roomName = `order:${orderId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room: ${roomName}`);
    });

    // Handle joinChat event (for chat rooms)
    socket.on('joinChat', (chatId: string) => {
      if (!chatId) {
        logger.warn(`Invalid chatId for joinChat from socket ${socket.id}`);
        return;
      }

      const roomName = `chat:${chatId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined chat room: ${roomName}`);
    });

    // Handle leaveChat event
    socket.on('leaveChat', (chatId: string) => {
      if (!chatId) {
        logger.warn(`Invalid chatId for leaveChat from socket ${socket.id}`);
        return;
      }

      const roomName = `chat:${chatId}`;
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left chat room: ${roomName}`);
    });

    // Handle typing event
    socket.on('typing', (data: { chatId: string; userId: string; userName?: string }) => {
      if (!data.chatId || !data.userId) {
        logger.warn(`Invalid data for typing event from socket ${socket.id}`);
        return;
      }

      const roomName = `chat:${data.chatId}`;
      socket.to(roomName).emit('userTyping', {
        chatId: data.chatId,
        userId: data.userId,
        userName: data.userName,
      });
    });

    // Handle stopTyping event
    socket.on('stopTyping', (data: { chatId: string; userId: string }) => {
      if (!data.chatId || !data.userId) {
        logger.warn(`Invalid data for stopTyping event from socket ${socket.id}`);
        return;
      }

      const roomName = `chat:${data.chatId}`;
      socket.to(roomName).emit('userStoppedTyping', {
        chatId: data.chatId,
        userId: data.userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};

/**
 * Get Socket.io instance
 */
export const getSocketIO = (): SocketServer | null => {
  return io;
};

/**
 * Emit event to specific order room
 * Uses direct socket emission (socket.io is always available on Render)
 */
export const emitToOrderRoom = (
  orderId: string,
  event: string,
  data?: any,
): void => {
  if (!orderId) {
    logger.warn('Cannot emit to order room: orderId is required');
    return;
  }

  if (!io) {
    logger.warn('Socket.io not initialized, cannot emit event');
    return;
  }

  try {
    const roomName = `order:${orderId}`;
    io.to(roomName).emit(event, data);
    logger.info(`Emitted ${event} to room: ${roomName}`);
  } catch (error) {
    logger.error(`Error emitting ${event} to order room ${orderId}:`, error);
  }
};

/**
 * Check if Socket.io is initialized
 */
export const isSocketInitialized = (): boolean => {
  return io !== null;
};

/**
 * Emit event to specific chat room
 */
export const emitToChatRoom = (
  chatId: string,
  event: string,
  data?: any,
): void => {
  if (!chatId) {
    logger.warn('Cannot emit to chat room: chatId is required');
    return;
  }

  if (!io) {
    logger.warn('Socket.io not initialized, cannot emit event');
    return;
  }

  try {
    const roomName = `chat:${chatId}`;
    io.to(roomName).emit(event, data);
    logger.info(`Emitted ${event} to chat room: ${roomName}`);
  } catch (error) {
    logger.error(`Error emitting ${event} to chat room ${chatId}:`, error);
  }
};

