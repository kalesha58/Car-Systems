import { MMKV } from 'react-native-mmkv'

export const tokenStorage = new MMKV({
    id: 'token-storage',
    encryptionKey: "some_secret_key"
})

export const storage = new MMKV({
    id: 'my-app-storage',
    encryptionKey: "some_secret_key"
})

/** Key prefix for business registration draft. Use getBusinessRegistrationDraftKey(userId) for per-user key. */
export const BR_DRAFT_STORAGE_KEY_PREFIX = 'business-registration:draft:v1';

export const getBusinessRegistrationDraftKey = (userId: string): string =>
  `${BR_DRAFT_STORAGE_KEY_PREFIX}:${userId}`;

/** Clears business registration draft (legacy global key and, if provided, per-user key). Call on logout. */
export const clearBusinessRegistrationDraft = (userId?: string | null): void => {
  try {
    storage.delete(BR_DRAFT_STORAGE_KEY_PREFIX);
    if (userId) {
      storage.delete(getBusinessRegistrationDraftKey(userId));
    }
  } catch { /* no-op */ }
};

export const mmkvStorage = {
    setItem: (key: string, value: string) => {
        storage.set(key, value)
    },
    getItem: (key: string) => {
        const value = storage.getString(key)
        return value ?? null;
    },
    removeItem: (key: string) => {
        storage.delete(key)
    }
}