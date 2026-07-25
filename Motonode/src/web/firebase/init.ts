import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';

import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from '@config/env';

function readViteEnv(key: string): string | undefined {
  try {
    return (import.meta as { env?: Record<string, string> }).env?.[key];
  } catch {
    return undefined;
  }
}

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }

  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  app = initializeApp({
    apiKey: readViteEnv('VITE_FIREBASE_API_KEY') || FIREBASE_API_KEY,
    authDomain: readViteEnv('VITE_FIREBASE_AUTH_DOMAIN') || FIREBASE_AUTH_DOMAIN,
    projectId: readViteEnv('VITE_FIREBASE_PROJECT_ID') || FIREBASE_PROJECT_ID,
    storageBucket: readViteEnv('VITE_FIREBASE_STORAGE_BUCKET') || FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      readViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || FIREBASE_MESSAGING_SENDER_ID,
    appId: readViteEnv('VITE_FIREBASE_APP_ID') || FIREBASE_APP_ID,
  });

  return app;
}
