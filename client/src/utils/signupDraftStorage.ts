import { storage } from '@state/storage';

const PENDING_SIGNUP_DRAFT_KEY = 'pendingSignupDraft:v1';

export interface IPendingSignupDraft {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: 'user' | 'dealer';
  termsVersion: string;
  privacyVersion: string;
}

export const savePendingSignupDraft = (draft: IPendingSignupDraft): void => {
  storage.set(PENDING_SIGNUP_DRAFT_KEY, JSON.stringify(draft));
};

export const getPendingSignupDraft = (): IPendingSignupDraft | null => {
  const raw = storage.getString(PENDING_SIGNUP_DRAFT_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as IPendingSignupDraft;
  } catch {
    return null;
  }
};

export const clearPendingSignupDraft = (): void => {
  storage.delete(PENDING_SIGNUP_DRAFT_KEY);
};
