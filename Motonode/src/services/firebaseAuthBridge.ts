import auth from '@react-native-firebase/auth';
import axios from 'axios';

import { api } from './api';

const MAX_SYNC_ATTEMPTS = 5;
const SYNC_RETRY_MS = 500;

let syncPromise: Promise<void> | null = null;
let expectedBackendUserId: string | null = null;

function formatBridgeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { message?: string; hint?: string; code?: string }
      | undefined;
    const parts = [
      status ? `HTTP ${status}` : null,
      data?.message,
      data?.hint,
      data?.code ? `code: ${data.code}` : null,
      error.message,
    ].filter(Boolean);
    return parts.join(' — ') || 'Firebase auth bridge request failed';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Firebase auth bridge sync failed';
}

async function fetchFirebaseCustomToken(): Promise<string> {
  try {
    const response = await api.get<{
      success: boolean;
      token: string;
      message?: string;
      hint?: string;
    }>('/auth/firebase-token');
    const token = response.data?.token;
    if (!token) {
      throw new Error(
        response.data?.message ||
          response.data?.hint ||
          'Firebase custom token missing from server response',
      );
    }
    return token;
  } catch (error) {
    throw new Error(formatBridgeError(error));
  }
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
      const message = error instanceof Error ? error.message : formatBridgeError(error);
      console.error('Firebase auth bridge sync failed:', message);
      throw error instanceof Error ? error : new Error(message);
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
