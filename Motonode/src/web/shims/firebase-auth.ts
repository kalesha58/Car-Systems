import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithCustomToken as fbSignInWithCustomToken,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';

import { getFirebaseApp } from '../firebase/init';

type AuthStateListener = (user: User | null) => void;

/**
 * RN Firebase-compatible auth() default export for web.
 */
function auth() {
  const instance = getAuth(getFirebaseApp());

  return {
    get currentUser() {
      return instance.currentUser;
    },
    signInWithCustomToken: (token: string) => fbSignInWithCustomToken(instance, token),
    signOut: () => fbSignOut(instance),
    onAuthStateChanged: (listener: AuthStateListener) =>
      fbOnAuthStateChanged(instance, listener),
  };
}

export default auth;
export type { User as FirebaseAuthTypes };
