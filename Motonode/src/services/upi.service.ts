import { api } from './api';

const UPI_REGEX = /^[\w.-]+@[\w]+$/;

export function validateUpiFormat(upiId: string): boolean {
  return UPI_REGEX.test(upiId.trim());
}

export interface InitiateUpiVerificationResult {
  verificationId: string;
  testAmount: number;
  status: string;
}

export interface ConfirmUpiVerificationResult {
  success: boolean;
  verified: boolean;
  accountHolderName: string;
  upiId: string;
}

export async function initiateUpiVerification(
  upiId: string,
): Promise<InitiateUpiVerificationResult> {
  const response = await api.post<{ success: boolean; data: InitiateUpiVerificationResult }>(
    '/dealer/verify-upi/initiate',
    { upiId: upiId.trim() },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error('Failed to initiate UPI verification');
  }

  return response.data.data;
}

export async function confirmUpiVerification(params: {
  verificationId: string;
  amount: number;
  upiId: string;
}): Promise<ConfirmUpiVerificationResult> {
  const response = await api.post<{ success: boolean; data: ConfirmUpiVerificationResult }>(
    '/dealer/verify-upi/confirm',
    {
      verificationId: params.verificationId,
      amount: params.amount,
      upiId: params.upiId.trim(),
    },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error('Failed to confirm UPI verification');
  }

  return response.data.data;
}
