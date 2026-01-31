import { logger } from '../utils/logger';
import { cashfreeClient, isCashfreeEnabled } from '../config/cashfree';
import { getPaymentDetails } from './payment/gatewayService';

export interface IVerifyPaymentData {
  payment_id: string;
  order_id: string;
  payment_session_id?: string;
  // Legacy fields for backward compatibility
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

/**
 * Verify payment using Cashfree API
 * Cashfree uses server-side payment verification instead of HMAC signature
 * @param paymentData - Payment data including payment_id and order_id
 * @returns boolean indicating if payment is verified and successful
 */
export const verifyPayment = async (paymentData: IVerifyPaymentData): Promise<boolean> => {
  try {
    let paymentId = paymentData.payment_id || paymentData.razorpay_payment_id;
    const orderId = paymentData.order_id || paymentData.razorpay_order_id;

    // Validate required fields
    if (!orderId) {
      logger.error('Missing required payment data for verification', {
        hasPaymentId: !!paymentId,
        hasOrderId: !!orderId,
      });
      return false;
    }

    if (!isCashfreeEnabled()) {
      logger.error('Cashfree is not configured');
      return false;
    }

    // If payment_id is not provided, fetch order details from Cashfree to get payment_id
    let paymentDetails;
    if (!paymentId) {
      // Fetch order details to get payment information
      const xApiVersion = '2023-08-01';
      try {
        const orderResponse = await cashfreeClient!.PGFetchOrder(xApiVersion, orderId);
        if (orderResponse.data?.payments && orderResponse.data.payments.length > 0) {
          paymentId = orderResponse.data.payments[0].cf_payment_id || 
                     orderResponse.data.payments[0].payment_id ||
                     orderResponse.data.payments[0].id;
        }
        // If still no payment_id, check order status directly
        if (!paymentId && orderResponse.data?.order_status === 'PAID') {
          logger.info('Order is paid but payment_id not available', { orderId });
          return true;
        }
      } catch (error) {
        logger.warn('Could not fetch order details from Cashfree', { orderId, error });
        return false;
      }
    }

    if (!paymentId) {
      logger.warn('Payment ID not available for verification', { orderId });
      // Try to verify using order status
      const { getPaymentStatus } = await import('./payment/gatewayService');
      const orderStatus = await getPaymentStatus(orderId);
      if (orderStatus && (orderStatus.status === 'PAID' || orderStatus.status === 'SUCCESS')) {
        logger.info('Payment verified using order status', { orderId });
        return true;
      }
      return false;
    }

    // Fetch payment details from Cashfree to verify payment status
    try {
      paymentDetails = await getPaymentDetails(paymentId);
    } catch (error) {
      logger.warn('Could not fetch payment details, verifying using order status', { paymentId, orderId, error });
      // Fallback to order status verification
      const { getPaymentStatus } = await import('./payment/gatewayService');
      const orderStatus = await getPaymentStatus(orderId);
      if (orderStatus && (orderStatus.status === 'PAID' || orderStatus.status === 'SUCCESS')) {
        return true;
      }
      return false;
    }

    if (!paymentDetails) {
      logger.warn('Payment not found in Cashfree', {
        paymentId,
        orderId,
      });
      return false;
    }

    // Verify payment status and order match
    const isPaymentSuccess = paymentDetails.payment_status === 'SUCCESS' || 
                            paymentDetails.payment_status === 'PAID' ||
                            paymentDetails.payment_status === 'COMPLETED';
    
    const orderMatches = paymentDetails.order_id === orderId || 
                        paymentDetails.order?.order_id === orderId;

    if (!orderMatches) {
      logger.warn('Payment order ID mismatch', {
        paymentId,
        expectedOrderId: orderId,
        actualOrderId: paymentDetails.order_id || paymentDetails.order?.order_id,
      });
      return false;
    }

    if (!isPaymentSuccess) {
      logger.warn('Payment not successful', {
        paymentId,
        orderId,
        paymentStatus: paymentDetails.payment_status,
      });
      return false;
    }

    logger.info('Payment verified successfully', {
      paymentId,
      orderId,
      paymentStatus: paymentDetails.payment_status,
    });

    return true;
  } catch (error) {
    logger.error('Error verifying payment:', error);
    return false;
  }
};

