import { getAuth } from '../config/firebase';

export interface FirebaseCustomTokenClaims {
  admin?: boolean;
}

/**
 * Mint a Firebase custom token with uid = MongoDB user ID.
 */
export async function createFirebaseCustomToken(
  userId: string,
  claims: FirebaseCustomTokenClaims = {},
): Promise<string> {
  const auth = getAuth();
  const customClaims = claims.admin ? { admin: true } : undefined;
  return auth.createCustomToken(userId, customClaims);
}
