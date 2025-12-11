// CRITICAL: Load environment variables FIRST, before ANY other imports
// This ensures env vars are available when logger module is loaded
import './config/env';

// Now import everything else
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import { errorHandler, IAppError } from './utils/errorHandler';
import { swaggerSpec } from './config/swagger';
import { initializeSocket } from './services/socket/socketService';
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/user/vehicleRoutes';
import postRoutes from './routes/user/postRoutes';
import uploadRoutes from './routes/user/uploadRoutes';
import dealerRoutes from './routes/dealerRoutes';
import dealerApiRoutes from './routes/dealer';
import serviceRoutes from './routes/serviceRoutes';
import profileRoutes from './routes/user/profileRoutes';
import productRoutes from './routes/user/productRoutes';
import groupRoutes from './routes/user/groupRoutes';
import chatRoutes from './routes/user/chatRoutes';
import joinRequestRoutes from './routes/user/joinRequestRoutes';
import orderRoutes from './routes/user/orderRoutes';
import dealerVehicleRoutes from './routes/user/dealerVehicleRoutes';
import supportChatRoutes from './routes/user/supportChatRoutes';
import userRoutes from './routes/user/userRoutes';
import addressRoutes from './routes/user/addressRoutes';
import adminRoutes from './routes/admin';
import dropdownRoutes from './routes/dropdownRoutes';
import webhookRoutes from './routes/webhookRoutes';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true,
  }),
);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Base route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Car Connect API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
      endpoints: {
      health: '/health',
      apiDocs: '/api/api-docs',
      auth: '/api/auth',
      vehicles: '/api/vehicles',
      posts: '/api/posts',
      upload: '/api/upload',
      dealers: '/api/dealers',
      services: '/api/services',
      profile: '/api/profile',
      addresses: '/api/addresses',
      support: '/api/support',
      admin: '/admin',
    },
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Swagger JSON endpoint
app.get('/api/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger API Documentation
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Car Connect API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  },
};

// Serve Swagger UI assets and setup
app.use('/api/api-docs', swaggerUi.serve);
app.get('/api/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api/api-docs/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/dealer', dealerApiRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/user/products', productRoutes);
logger.info('[Routes] User products route mounted at /api/user/products');
app.use('/api/groups', groupRoutes);
logger.info('[Routes] Groups route mounted at /api/groups');
app.use('/api/chats', chatRoutes);
logger.info('[Routes] Chats route mounted at /api/chats');
app.use('/api/join-requests', joinRequestRoutes);
logger.info('[Routes] Join requests route mounted at /api/join-requests');
app.use('/api/user/orders', orderRoutes);
logger.info('[Routes] User orders route mounted at /api/user/orders');
app.use('/api/user/dealer-vehicles', dealerVehicleRoutes);
logger.info('[Routes] User dealer vehicles route mounted at /api/user/dealer-vehicles');
app.use('/api/addresses', addressRoutes);
logger.info('[Routes] Addresses route mounted at /api/addresses');
app.use('/api/dropdowns', dropdownRoutes);
logger.info('[Routes] Dropdowns route mounted at /api/dropdowns');
app.use('/api/support', supportChatRoutes);
logger.info('[Routes] Support chat route mounted at /api/support');
app.use('/api/users', userRoutes);
logger.info('[Routes] Users route mounted at /api/users');

// Webhook Routes (no auth required - called by payment gateway)
app.use('/api/webhooks', webhookRoutes);
logger.info('[Routes] Webhook routes mounted at /api/webhooks');

// Admin Routes (all prefixed with /admin)
app.use('/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware (must be last)
app.use((err: IAppError, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, res);
});

const initializeDatabase = async (): Promise<void> => {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error('Failed to initialize database', error);
    process.exit(1);
  }
};

initializeDatabase()
  .then(() => {
    // Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    initializeSocket(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please stop the other process or change the PORT in .env file`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });
  })
  .catch((error) => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });

export default app;
