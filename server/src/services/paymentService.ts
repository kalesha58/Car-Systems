import { logger } from '../utils/logger';
import crypto from 'crypto';
import { RAZORPAY_KEY_SECRET } from '../config/razorpay';

export interface IVerifyPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  order_id: string; // Server-side order_id from paymentIntentId
  paymentId?: string; // Keep for backward compatibility
  transactionId?: string;
}

/**
 * Verify payment signature using HMAC SHA256
 * @param paymentData - Payment data including signature
 * @returns boolean indicating if payment signature is verified
 */
export const verifyPayment = async (paymentData: IVerifyPaymentData): Promise<boolean> => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order_id } = paymentData;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !order_id) {
      logger.error('Missing required payment data for verification', {
        hasPaymentId: !!razorpay_payment_id,
        hasOrderId: !!razorpay_order_id,
        hasSignature: !!razorpay_signature,
        hasServerOrderId: !!order_id,
      });
      return false;
    }

    if (!RAZORPAY_KEY_SECRET) {
      logger.error('Razorpay key secret not configured');
      return false;
    }

    // Generate signature: hmac_sha256(order_id + "|" + razorpay_payment_id, key_secret)
    // Use order_id from server (paymentIntentId), NOT razorpay_order_id from client
    const message = `${order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(message)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      logger.warn('Payment signature verification failed', {
        order_id,
        razorpay_payment_id,
        expected: generatedSignature,
        received: razorpay_signature,
      });
    } else {
      logger.info('Payment signature verified successfully', {
        order_id,
        razorpay_payment_id,
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying payment signature:', error);
    return false;
  }
};

