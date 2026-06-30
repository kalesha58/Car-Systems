import auth from '@react-native-firebase/auth';

import { api } from './api';

const MAX_SYNC_ATTEMPTS = 5;
const SYNC_RETRY_MS = 500;

let syncPromise: Promise<void> | null = null;
let expectedBackendUserId: string | null = null;

async function fetchFirebaseCustomToken(): Promise<string> {
  const response = await api.get<{ success: boolean; token: string }>('/auth/firebase-token');
  const token = response.data?.token;
  if (!token) {
    throw new Error('Firebase custom token missing from server response');
  }
  return token;
}

async function signInWithBackendToken(backendUserId: string): Promise<void> {
  const customToken = await fetchFirebaseCustomToken();
  await auth().signInWithCustomToken(customToken);

  const currentUid = auth().currentUser?.uid;
  if (currentUid !== backendUserId) {
    throw new Error(`Firebase UID mismatch: expected ${backendUserId}, got ${currentUid ?? 'none'}`);
  }
}

/**
 * Exchange backend JWT for a Firebase custom token (uid = Mongo user ID).
 */
export async function syncFirebaseAuthWithBackend(backendUserId: string): Promise<void> {
  if (auth().currentUser?.uid === backendUserId) {
    return;
  }

  if (syncPromise && expectedBackendUserId === backendUserId) {
    return syncPromise;
  }

  expectedBackendUserId = backendUserId;
  syncPromise = signInWithBackendToken(backendUserId)
    .catch((error) => {
      console.error('Firebase auth bridge sync failed:', error);
      throw error;
    })
    .finally(() => {
      syncPromise = null;
    });

  return syncPromise;
}

/**
 * Ensure Firebase Auth is ready and UID matches backend user before chat operations.
 */
export async function ensureFirebaseReady(backendUserId: string): Promise<void> {
  for (let attempt = 0; attempt < MAX_SYNC_ATTEMPTS; attempt += 1) {
    if (auth().currentUser?.uid === backendUserId) {
      return;
    }

    await syncFirebaseAuthWithBackend(backendUserId);

    if (auth().currentUser?.uid === backendUserId) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, SYNC_RETRY_MS));
  }

  throw new Error('Firebase is not ready. Please try again.');
}

export function clearFirebaseAuthBridgeState(): void {
  expectedBackendUserId = null;
  syncPromise = null;
}
