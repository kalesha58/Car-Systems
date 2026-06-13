// CRITICAL: Load environment variables FIRST, before ANY other imports
// This ensures env vars are available when logger module is loaded
import './config/env';

// Now import everything else
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';
import { errorHandler, IAppError } from './utils/errorHandler';
import { swaggerSpec } from './config/swagger';
import { initializeSocket } from './services/socket/socketService';
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/user/vehicleRoutes';
import postRoutes from './routes/user/postRoutes';
import storyRoutes from './routes/user/storyRoutes';
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
import notificationRoutes from './routes/user/notificationRoutes';
import blockRoutes from './routes/user/blockRoutes';
import reportRoutes from './routes/user/reportRoutes';
import serviceSlotRoutes from './routes/user/serviceSlotRoutes';
import cartRoutes from './routes/user/cartRoutes';
import couponRoutes from './routes/user/couponRoutes';
import dealerInfoRoutes from './routes/user/dealerRoutes';
import testDriveRoutes from './routes/user/testDriveRoutes';
import preBookingRoutes from './routes/user/preBookingRoutes';
import { refreshTokenController } from './controllers/authController';
import adminRoutes from './routes/admin';
import dropdownRoutes from './routes/dropdownRoutes';
import appConfigRoutes from './routes/user/appConfigRoutes';
import webhookRoutes, { razorpayWebhookHandler } from './routes/webhookRoutes';
import { getServiceCategoriesController } from './controllers/serviceCategoryController';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Include custom headers used by admin-panel / clients (preflight must echo these or the browser blocks the request)
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
      'x-skip-toast',
      'Accept',
    ],
    credentials: true,
  }),
);

// Razorpay webhook requires raw body for signature verification
app.post(
  '/api/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  razorpayWebhookHandler,
);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


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
      stories: '/api/stories',
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

// Web redirect helper for custom deep links
const getRedirectHtml = (deepLink: string, title: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Opening Moto Node...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f7fafc;
            color: #2d3748;
            text-align: center;
            padding: 20px;
          }
          .card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 400px;
            width: 100%;
          }
          .logo {
            font-size: 36px;
            font-weight: bold;
            color: #0d8320;
            margin-bottom: 20px;
          }
          .btn {
            background-color: #0d8320;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
            display: inline-block;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #0a6418;
          }
          h1 { margin-bottom: 10px; font-size: 22px; }
          p { color: #718096; margin-bottom: 20px; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">motonode</div>
          <h1>Opening ${title}</h1>
          <p>We are redirecting you to the Moto Node app. If nothing happens, tap the button below.</p>
          <a class="btn" href="${deepLink}">Open Moto Node</a>
        </div>
        <script>
          // Auto-redirect attempt on load
          window.onload = function() {
            window.location.href = "${deepLink}";
          };
        </script>
      </body>
    </html>
  `;
};

// Mount deep link web redirects (both root and /api prefixed routes for robustness)
app.get('/store/:dealerId', (req: Request, res: Response) => {
  res.send(getRedirectHtml(`motonode://store/${req.params.dealerId}`, 'Storefront'));
});
app.get('/api/store/:dealerId', (req: Request, res: Response) => {
  res.send(getRedirectHtml(`motonode://store/${req.params.dealerId}`, 'Storefront'));
});

app.get('/product/:productId', (req: Request, res: Response) => {
  res.send(getRedirectHtml(`motonode://product/${req.params.productId}`, 'Product'));
});
app.get('/api/product/:productId', (req: Request, res: Response) => {
  res.send(getRedirectHtml(`motonode://product/${req.params.productId}`, 'Product'));
});

app.get('/category/:categoryName', (req: Request, res: Response) => {
  res.send(getRedirectHtml(`motonode://category/${req.params.categoryName}`, 'Category'));
});
app.get('/api/category/:categoryName', (req: Request, res: Response) => {
  res.send(getRedirectHtml(`motonode://category/${req.params.categoryName}`, 'Category'));
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
// Mount refresh-token at root level to match client expectation (/api/refresh-token)
app.post('/api/refresh-token', refreshTokenController);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/posts', postRoutes);
logger.info('[Routes] Post routes mounted at /api/posts');
app.use('/api/stories', storyRoutes);
logger.info('[Routes] Story routes mounted at /api/stories');
app.use('/api/upload', uploadRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/dealer', dealerApiRoutes);
app.use('/api/services', serviceRoutes);
// Public service category config endpoint (no auth)
app.get('/api/service-categories', getServiceCategoriesController);
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
app.use('/api/user/cart', cartRoutes);
logger.info('[Routes] User cart routes mounted at /api/user/cart');
app.use('/api/user/coupons', couponRoutes);
logger.info('[Routes] User coupon routes mounted at /api/user/coupons');
app.use('/api/user/test-drives', testDriveRoutes);
logger.info('[Routes] User test drive routes mounted at /api/user/test-drives');
app.use('/api/user/pre-bookings', preBookingRoutes);
logger.info('[Routes] User pre-booking routes mounted at /api/user/pre-bookings');
app.use('/api/user/services', serviceSlotRoutes);
logger.info('[Routes] User service slot routes mounted at /api/user/services');
// Mount dealer info routes BEFORE other /api/user routes to ensure proper matching
app.use('/api/user/dealer', dealerInfoRoutes);
logger.info('[Routes] User dealer info routes mounted at /api/user/dealer');
// Log all registered routes for debugging
logger.info('[Routes] Dealer routes registered:', {
  path: '/api/user/dealer',
  routes: ['/:dealerId/info', '/:dealerId/verify'],
});
// Mount notification routes after dealer routes to avoid route conflicts
app.use('/api/user', notificationRoutes);
app.use('/api/user/blocks', blockRoutes);
app.use('/api/user/reports', reportRoutes);
logger.info('[Routes] User notification route mounted at /api/user/fcm-token');
app.use('/api/addresses', addressRoutes);
logger.info('[Routes] Addresses route mounted at /api/addresses');
app.use('/api/dropdowns', dropdownRoutes);
logger.info('[Routes] Dropdowns route mounted at /api/dropdowns');
app.use('/api/app', appConfigRoutes);
logger.info('[Routes] App config route mounted at /api/app');
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

const initializeServices = (): void => {
  try {
    initializeFirebase();
    logger.info('Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('Failed to initialize Firebase', error);
    // Don't exit - Firebase is not critical for server startup
  }
};

initializeDatabase()
  .then(() => {
    // Initialize Firebase
    initializeServices();

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
