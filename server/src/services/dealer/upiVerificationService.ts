import crypto from 'crypto';
import { AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

const UPI_REGEX = /^[\w.-]+@[\w]+$/;
const TEST_AMOUNT = 1.0;
const SESSION_TTL_MS = 15 * 60 * 1000;

interface UpiVerificationSession {
  verificationId: string;
  userId: string;
  upiId: string;
  testAmount: number;
  accountHolderName: string;
  status: 'processing' | 'completed';
  createdAt: number;
}

const sessions = new Map<string, UpiVerificationSession>();

function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

const validateUPIId = (upiId: string): boolean => UPI_REGEX.test(upiId.trim());

const deriveAccountHolderName = (upiId: string): string => {
  const localPart = upiId.split('@')[0] ?? 'Dealer';
  return localPart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

export const initiateUpiVerification = async (
  userId: string,
  upiIdInput: string,
): Promise<{ verificationId: string; testAmount: number; status: string }> => {
  pruneExpiredSessions();

  const upiId = upiIdInput.trim().toLowerCase();
  if (!validateUPIId(upiId)) {
    throw new AppError('Invalid UPI ID. Please check and try again.', 400);
  }

  const verificationId = crypto.randomUUID();
  const accountHolderName = deriveAccountHolderName(upiId);

  sessions.set(verificationId, {
    verificationId,
    userId,
    upiId,
    testAmount: TEST_AMOUNT,
    accountHolderName,
    status: 'processing',
    createdAt: Date.now(),
  });

  logger.info(`UPI verification initiated for user ${userId}, upi ending ${upiId.slice(-8)}`);

  return {
    verificationId,
    testAmount: TEST_AMOUNT,
    status: 'processing',
  };
};

export const confirmUpiVerification = async (
  userId: string,
  verificationId: string,
  upiIdInput: string,
  amount: number,
): Promise<{ success: boolean; verified: boolean; accountHolderName: string; upiId: string }> => {
  pruneExpiredSessions();

  const session = sessions.get(verificationId);
  if (!session) {
    throw new AppError('Verification session expired. Please try again.', 400);
  }

  if (session.userId !== userId) {
    throw new AppError('Unauthorized verification session', 403);
  }

  const upiId = upiIdInput.trim().toLowerCase();
  if (session.upiId !== upiId) {
    throw new AppError('UPI ID does not match verification session', 400);
  }

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(verificationId);
    throw new AppError('Verification session expired. Please try again.', 400);
  }

  if (Math.abs(amount - session.testAmount) > 0.001) {
    throw new AppError('Incorrect amount. Please enter the exact amount received.', 400);
  }

  session.status = 'completed';
  sessions.delete(verificationId);

  logger.info(`UPI verified for user ${userId}: ${upiId}`);

  return {
    success: true,
    verified: true,
    accountHolderName: session.accountHolderName,
    upiId: session.upiId,
  };
};
