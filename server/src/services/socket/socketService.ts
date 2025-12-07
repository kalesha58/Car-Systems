import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import axios from 'axios';
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

    // Handle joinRoom event
    socket.on('joinRoom', (orderId: string) => {
      if (!orderId) {
        logger.warn(`Invalid orderId for joinRoom from socket ${socket.id}`);
        return;
      }

      const roomName = `order:${orderId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room: ${roomName}`);
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
 * Supports both direct socket emission (local dev) and HTTP emission to Render (serverless)
 */
export const emitToOrderRoom = async (
  orderId: string,
  event: string,
  data?: any,
): Promise<void> => {
  if (!orderId) {
    logger.warn('Cannot emit to order room: orderId is required');
    return;
  }

  const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL;
  const SOCKET_API_KEY = process.env.SOCKET_API_KEY;

  // If SOCKET_SERVER_URL is set, use HTTP emission to Render socket server (serverless mode)
  if (SOCKET_SERVER_URL) {
    try {
      const roomName = `order:${orderId}`;
      const requestBody: any = {
        room: roomName,
        event,
        data,
      };

      // Include API key if configured
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (SOCKET_API_KEY) {
        headers['x-api-key'] = SOCKET_API_KEY;
      }

      await axios.post(`${SOCKET_SERVER_URL}/emit`, requestBody, {
        headers,
        timeout: 5000, // 5 second timeout
      });

      logger.info(`Emitted ${event} to room ${roomName} via HTTP (Render)`);
    } catch (error) {
      logger.error(
        `Error emitting ${event} to Render socket server for order ${orderId}:`,
        error instanceof Error ? error.message : error,
      );
      // Don't throw - graceful degradation
    }
    return;
  }

  // Fallback to direct socket emission (local development)
  if (!io) {
    logger.warn('Socket.io not initialized and SOCKET_SERVER_URL not set, cannot emit event');
    return;
  }

  try {
    const roomName = `order:${orderId}`;
    io.to(roomName).emit(event, data);
    logger.info(`Emitted ${event} to room: ${roomName} (direct socket)`);
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

