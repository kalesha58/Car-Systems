import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';

let messaging: admin.messaging.Messaging | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): void => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      logger.info('Firebase Admin SDK already initialized');
      messaging = admin.messaging();
      return;
    }

    let credential: admin.credential.Credential;

    // Option 1: Try loading from environment variable (recommended for production)
    const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (firebaseServiceAccountJson) {
      try {
        const serviceAccount = JSON.parse(firebaseServiceAccountJson);
        credential = admin.credential.cert(serviceAccount);
        logger.info('Firebase credentials loaded from environment variable');
      } catch (parseError) {
        logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseError);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
      }
    } else {
      // Option 2: Try loading from file path
      const serviceAccountPath = path.join(
        __dirname,
        'motonode-d7ed1-firebase-adminsdk-fbsvc-f5e6115b0b.json',
      );

      // Check if file exists in dist directory
      if (!fs.existsSync(serviceAccountPath)) {
        // Try alternative path (source directory)
        const altPath = path.join(
          process.cwd(),
          'server',
          'src',
          'config',
          'motonode-d7ed1-firebase-adminsdk-fbsvc-f5e6115b0b.json',
        );
        
        if (fs.existsSync(altPath)) {
          credential = admin.credential.cert(altPath);
          logger.info('Firebase credentials loaded from alternative path');
        } else {
          logger.warn(`Firebase service account file not found at ${serviceAccountPath} or ${altPath}`);
          logger.warn('Server will continue without Firebase. Push notifications will not be available.');
          return; // Don't throw, allow server to continue
        }
      } else {
        credential = admin.credential.cert(serviceAccountPath);
        logger.info('Firebase credentials loaded from file');
      }
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential,
    });

    messaging = admin.messaging();
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    // Don't throw error - allow server to continue without Firebase
    logger.warn('Server will continue without Firebase. Push notifications will not be available.');
  }
};

/**
 * Get Firebase Messaging instance
 */
export const getMessaging = (): admin.messaging.Messaging => {
  if (!messaging) {
    initializeFirebase();
  }
  if (!messaging) {
    throw new Error('Firebase Messaging not initialized. Check Firebase configuration.');
  }
  return messaging;
};



