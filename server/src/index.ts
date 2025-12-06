// CRITICAL: Load environment variables FIRST, before ANY other imports
// This ensures env vars are available when logger module is loaded
import './config/env';

// Now import everything else
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import { errorHandler, IAppError } from './utils/errorHandler';
import { swaggerSpec } from './config/swagger';
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
import orderRoutes from './routes/user/orderRoutes';
import dealerVehicleRoutes from './routes/user/dealerVehicleRoutes';
import supportChatRoutes from './routes/user/supportChatRoutes';
import addressRoutes from './routes/user/addressRoutes';
import adminRoutes from './routes/admin';
import dropdownRoutes from './routes/dropdownRoutes';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;
const isServerless = process.env.VERCEL === '1';

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
      apiDocs: '/api-docs',
      auth: '/api/auth',
      vehicles: '/api/vehicles',
      posts: '/api/posts',
      upload: '/api/upload',
      dealers: '/api/dealers',
      services: '/api/services',
      profile: '/api/profile',
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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Car Connect API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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
    if (!isServerless) {
      process.exit(1);
    }
  }
};

if (!isServerless) {
  initializeDatabase()
    .then(() => {
      const server = app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
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
}

// Export app for serverless use
export default app;
