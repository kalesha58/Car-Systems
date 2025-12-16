import * as admin from 'firebase-admin';
import * as path from 'path';
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

    // Path to service account key
    const serviceAccountPath = path.join(
      __dirname,
      'motonode-d7ed1-firebase-adminsdk-fbsvc-f5e6115b0b.json',
    );

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });

    messaging = admin.messaging();
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    throw error;
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
    throw new Error('Firebase Messaging not initialized');
  }
  return messaging;
};



