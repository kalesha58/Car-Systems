// CRITICAL: Load environment variables FIRST
import './config/env';

import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const SOCKET_API_KEY = process.env.SOCKET_API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// CORS configuration
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
);

// Middleware
app.use(express.json());

// Health check endpoint (required for Render)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Socket.io server is running',
    timestamp: new Date().toISOString(),
  });
});

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = new SocketServer(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Handle socket connections
io.on('connection', (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle joinRoom event
  socket.on('joinRoom', (orderId: string) => {
    if (!orderId) {
      console.warn(`Invalid orderId for joinRoom from socket ${socket.id}`);
      return;
    }

    const roomName = `order:${orderId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error: Error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// HTTP POST endpoint to receive emission requests from Vercel API
app.post('/emit', (req: Request, res: Response) => {
  // Optional API key authentication
  if (SOCKET_API_KEY) {
    const providedKey = req.headers['x-api-key'] || req.body.apiKey;
    if (providedKey !== SOCKET_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid API key',
      });
    }
  }

  const { room, event, data } = req.body;

  if (!room || !event) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: room and event are required',
    });
  }

  try {
    io.to(room).emit(event, data);
    console.log(`Emitted ${event} to room: ${room}`);
    res.status(200).json({
      success: true,
      message: `Event ${event} emitted to room ${room}`,
    });
  } catch (error) {
    console.error(`Error emitting ${event} to room ${room}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to emit event',
    });
  }
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origin: ${CORS_ORIGIN}`);
  console.log(`API Key Authentication: ${SOCKET_API_KEY ? 'Enabled' : 'Disabled'}`);
});

// Handle server errors
httpServer.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please change the PORT in environment variables.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

