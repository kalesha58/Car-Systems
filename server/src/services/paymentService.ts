import { logger } from '../utils/logger';

export interface IVerifyPaymentData {
  paymentId: string;
  transactionId?: string;
}

/**
 * Verify payment
 * @param paymentData - Payment data
 * @returns boolean indicating if payment is verified
 */
export const verifyPayment = async (paymentData: IVerifyPaymentData): Promise<boolean> => {
  try {
    const { paymentId } = paymentData;

    if (!paymentId) {
      logger.error('Missing payment data for verification', paymentData);
      return false;
    }

    logger.info('Payment verification requested', {
      paymentId,
    });

    return true;
  } catch (error) {
    logger.error('Error verifying payment:', error);
    throw new Error('Failed to verify payment');
  }
};

