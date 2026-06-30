import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';

let messaging: admin.messaging.Messaging | null = null;
let firebaseInitialized = false;
let configuredProjectId: string | null = null;

export interface FirebaseDiagnostics {
  initialized: boolean;
  appsCount: number;
  projectId: string | null;
  credentialSource: 'env_json' | 'file' | 'none';
  hasEnvJson: boolean;
  hasEnvPath: boolean;
}

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): void => {
  try {
    if (admin.apps.length > 0) {
      logger.info('Firebase Admin SDK already initialized');
      messaging = admin.messaging();
      firebaseInitialized = true;
      configuredProjectId = admin.app().options.projectId ?? configuredProjectId;
      return;
    }

    let credential: admin.credential.Credential;
    let credentialSource: FirebaseDiagnostics['credentialSource'] = 'none';

    const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (firebaseServiceAccountJson) {
      try {
        const serviceAccount = JSON.parse(firebaseServiceAccountJson) as admin.ServiceAccount & {
          project_id?: string;
        };
        credential = admin.credential.cert(serviceAccount);
        configuredProjectId = serviceAccount.project_id ?? null;
        credentialSource = 'env_json';
        logger.info(
          `Firebase credentials loaded from FIREBASE_SERVICE_ACCOUNT_JSON (project_id=${configuredProjectId ?? 'unknown'})`,
        );
      } catch (parseError) {
        const preview = firebaseServiceAccountJson.slice(0, 80).replace(/\s+/g, ' ');
        logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseError);
        logger.error(`FIREBASE_SERVICE_ACCOUNT_JSON preview (first 80 chars): ${preview}...`);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
      }
    } else {
      const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const candidatePaths: string[] = [];

      if (envPath) {
        candidatePaths.push(
          path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath),
        );
      }

      candidatePaths.push(
        path.join(process.cwd(), 'motonode-admin.json'),
        path.join(__dirname, 'motonode-admin.json'),
      );

      const resolvedPath = candidatePaths.find((p) => fs.existsSync(p));

      if (resolvedPath) {
        credential = admin.credential.cert(resolvedPath);
        credentialSource = 'file';
        try {
          const raw = fs.readFileSync(resolvedPath, 'utf8');
          const parsed = JSON.parse(raw) as { project_id?: string };
          configuredProjectId = parsed.project_id ?? null;
        } catch {
          configuredProjectId = null;
        }
        logger.info(
          `Firebase credentials loaded from ${resolvedPath} (project_id=${configuredProjectId ?? 'unknown'})`,
        );
      } else {
        logger.warn(
          `Firebase service account not found. On Vercel set FIREBASE_SERVICE_ACCOUNT_JSON (project: motonode-final). Tried paths: ${candidatePaths.join(', ')}`,
        );
        logger.warn('Server will continue without Firebase. Custom tokens and push will not work.');
        return;
      }
    }

    admin.initializeApp({
      credential,
    });

    messaging = admin.messaging();
    firebaseInitialized = true;
    configuredProjectId = admin.app().options.projectId ?? configuredProjectId;

    logger.info(
      `Firebase Admin SDK initialized successfully (source=${credentialSource}, project_id=${configuredProjectId ?? 'unknown'}, apps=${admin.apps.length})`,
    );

    if (configuredProjectId && configuredProjectId !== 'motonode-final') {
      logger.warn(
        `Firebase project_id is "${configuredProjectId}" but mobile app uses "motonode-final" — custom auth may fail`,
      );
    }
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    logger.warn('Server will continue without Firebase. Custom tokens and push will not work.');
  }
};

export const getFirebaseDiagnostics = (): FirebaseDiagnostics => {
  const hasEnvJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
  const hasEnvPath = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim());

  return {
    initialized: firebaseInitialized && admin.apps.length > 0,
    appsCount: admin.apps.length,
    projectId:
      firebaseInitialized && admin.apps.length > 0
        ? admin.app().options.projectId ?? configuredProjectId
        : configuredProjectId,
    credentialSource: hasEnvJson ? 'env_json' : hasEnvPath ? 'file' : 'none',
    hasEnvJson,
    hasEnvPath,
  };
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

/**
 * Get Firebase Auth instance for custom token minting
 */
export const getAuth = (): admin.auth.Auth => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!firebaseInitialized || admin.apps.length === 0) {
    throw new Error('Firebase Auth not initialized. Check Firebase configuration.');
  }
  return admin.auth();
};

export const isFirebaseInitialized = (): boolean =>
  firebaseInitialized && admin.apps.length > 0;
