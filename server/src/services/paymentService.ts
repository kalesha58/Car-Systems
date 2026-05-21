import { logger } from '../utils/logger';
import { isRazorpayEnabled } from '../config/razorpay';
import {
  verifyPaymentSignature,
  getPaymentStatus,
  getPaymentDetails,
} from './payment/gatewayService';

export interface IVerifyPaymentData {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  // Aliases for client compatibility
  payment_id?: string;
  order_id?: string;
  signature?: string;
}

/**
 * Verify Razorpay payment using HMAC signature and optional order status fallback
 */
export const verifyPayment = async (paymentData: IVerifyPaymentData): Promise<boolean> => {
  try {
    const paymentId =
      paymentData.razorpay_payment_id || paymentData.payment_id;
    const orderId =
      paymentData.razorpay_order_id || paymentData.order_id;
    const signature =
      paymentData.razorpay_signature || paymentData.signature;

    if (!orderId) {
      logger.error('Missing razorpay_order_id for verification');
      return false;
    }

    if (!isRazorpayEnabled()) {
      logger.error('Razorpay is not configured');
      return false;
    }

    // Primary: HMAC signature verification
    if (paymentId && signature) {
      const isValid = verifyPaymentSignature(orderId, paymentId, signature);
      if (isValid) {
        logger.info('Payment verified via signature', { orderId, paymentId });
        return true;
      }
      return false;
    }

    // Fallback: check Razorpay order / payment status when signature not sent (e.g. polling)
    if (paymentId) {
      try {
        const payment = await getPaymentDetails(paymentId);
        if (
          payment.order_id === orderId &&
          (payment.status === 'captured' || payment.status === 'authorized')
        ) {
          logger.info('Payment verified via payment fetch', { orderId, paymentId });
          return true;
        }
      } catch (error) {
        logger.warn('Could not fetch payment for verification', { paymentId, orderId, error });
      }
    }

    const orderStatus = await getPaymentStatus(orderId);
    if (orderStatus && (orderStatus.status === 'paid' || orderStatus.status === 'attempted')) {
      // Razorpay order status 'paid' means all payments captured
      if (orderStatus.status === 'paid') {
        logger.info('Payment verified via order status', { orderId });
        return true;
      }
    }

    logger.warn('Payment verification failed', { orderId, hasPaymentId: !!paymentId, hasSignature: !!signature });
    return false;
  } catch (error) {
    logger.error('Error verifying payment:', error);
    return false;
  }
};
