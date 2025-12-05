import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Cached connection to prevent multiple connections in serverless environment
 */
let cachedConnection: typeof mongoose | null = null;

/**
 * Active connection promise to prevent concurrent connection attempts
 */
let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Wait for connection to be ready (readyState === 1)
 * @param timeoutMs Maximum time to wait in milliseconds
 * @returns Promise that resolves when connection is ready
 */
const waitForConnection = (timeoutMs: number = 10000): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // If already connected, resolve immediately
    if (mongoose.connection.readyState === 1) {
      resolve();
      return;
    }

    // If disconnected, reject immediately
    if (mongoose.connection.readyState === 0) {
      reject(new Error('Connection is disconnected'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error(`Connection timeout after ${timeoutMs}ms. Current state: ${mongoose.connection.readyState}`));
    }, timeoutMs);

    const onConnected = () => {
      clearTimeout(timeout);
      mongoose.connection.removeListener('error', onError);
      resolve();
    };

    const onError = (error: Error) => {
      clearTimeout(timeout);
      mongoose.connection.removeListener('connected', onConnected);
      reject(error);
    };

    mongoose.connection.once('connected', onConnected);
    mongoose.connection.once('error', onError);
  });
};

/**
 * Connects to MongoDB database
 * Uses connection caching for serverless environments (Vercel)
 * Handles concurrent connection attempts and connection state properly
 * @returns Promise<typeof mongoose>
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    // Return cached connection if available and fully connected (serverless optimization)
    if (cachedConnection && mongoose.connection.readyState === 1) {
      logger.info('Using cached MongoDB connection');
      return cachedConnection;
    }

    // If connection is in progress (readyState === 2), wait for it
    if (mongoose.connection.readyState === 2 && connectionPromise) {
      logger.info('Connection in progress, waiting for existing connection...');
      try {
        await connectionPromise;
        // Wait for connection to be fully ready
        await waitForConnection();
        const currentReadyState = mongoose.connection.readyState as number;
        if (cachedConnection && currentReadyState === 1) {
          return cachedConnection;
        }
      } catch (error) {
        logger.warn('Waiting for connection failed, will create new connection', error);
        connectionPromise = null;
      }
    }

    // If there's an active connection promise, reuse it
    if (connectionPromise) {
      logger.info('Reusing existing connection promise...');
      try {
        const result = await connectionPromise;
        // Ensure connection is ready
        await waitForConnection();
        return result;
      } catch (error) {
        logger.warn('Existing connection promise failed, creating new one', error);
        connectionPromise = null;
      }
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Create connection promise to prevent concurrent attempts
    connectionPromise = (async () => {
      try {
        // Close existing connection if any (cleanup) - but not if connecting
        if (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 2) {
          logger.info('Closing existing connection before reconnecting...');
          await mongoose.connection.close();
        }

        // Connect to MongoDB
        logger.info('Establishing MongoDB connection...');
        cachedConnection = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        });

        // Wait for connection to be fully ready
        await waitForConnection();

        logger.info('MongoDB connected successfully');

        // Set up event listeners (only once)
        mongoose.connection.on('error', (error) => {
          logger.error('MongoDB connection error', error);
          cachedConnection = null;
          connectionPromise = null;
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
          cachedConnection = null;
          connectionPromise = null;
        });

        return cachedConnection;
      } catch (error) {
        cachedConnection = null;
        connectionPromise = null;
        throw error;
      }
    })();

    const result = await connectionPromise;

    // Verify connection is ready before returning
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const readyState = mongoose.connection.readyState as number;
    if (readyState !== 1) {
      throw new Error(`Connection not ready. Current state: ${readyState}`);
    }

    return result;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    cachedConnection = null;
    connectionPromise = null;
    
    // Only exit process in non-serverless environments
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    
    throw error;
  }
};

