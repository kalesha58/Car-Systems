import { cashfreeClient, CASHFREE_WEBHOOK_SECRET, isCashfreeEnabled } from '../../config/cashfree';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

export interface IPaymentIntentRequest {
  orderId: string;
  amount: number; // in paise
  currency?: string;
  notes?: Record<string, string>;
}

export interface IPaymentIntentResponse {
  order_id: string;
  payment_session_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  notes?: Record<string, string>;
}

export interface IPayoutRequest {
  amount: number; // in paise
  currency?: string;
  accountNumber?: string;
  ifsc?: string;
  fundAccount?: {
    account_type: string;
    bank_account?: {
      name: string;
      ifsc: string;
      account_number: string;
    };
    vpa?: {
      address: string;
    };
  };
  mode?: string;
  purpose?: string;
  queueIfLowBalance?: boolean;
  referenceId?: string;
  notes?: Record<string, string>;
}

export interface IPayoutResponse {
  id: string;
  entity: string;
  fund_account_id?: string;
  amount: number;
  currency: string;
  fees: number;
  tax: number;
  status: string;
  utr?: string;
  mode: string;
  reference_id: string;
  notes?: Record<string, string>;
  created_at: number;
}

/**
 * Create payment order and session
 */
export const createPaymentIntent = async (
  request: IPaymentIntentRequest,
): Promise<IPaymentIntentResponse> => {
  if (!isCashfreeEnabled()) {
    throw new Error('Cashfree is not configured');
  }

  try {
    const xApiVersion = '2023-08-01';
    const orderRequest = {
      order_amount: request.amount / 100, // Cashfree expects amount in rupees
      order_currency: request.currency || 'INR',
      customer_details: {
        customer_id: request.orderId,
      },
      order_meta: {
        return_url: `${process.env.APP_URL || 'https://test.cashfree.com'}/payment/return?order_id=${request.orderId}`,
      },
      order_note: JSON.stringify({
        orderId: request.orderId,
        ...request.notes,
      }),
    };

    const response = await cashfreeClient!.PGCreateOrder(xApiVersion, orderRequest);

    if (!response.data) {
      throw new Error('Failed to create order: No data in response');
    }

    const orderData = response.data;

    logger.info(`Payment intent created for order ${request.orderId}`, {
      cashfreeOrderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
    });

    return {
      order_id: orderData.order_id || '',
      payment_session_id: orderData.payment_session_id || '',
      amount: request.amount,
      currency: orderData.order_currency || request.currency || 'INR',
      status: orderData.order_status || 'ACTIVE',
      method: 'upi',
      notes: request.notes,
    };
  } catch (error: any) {
    logger.error('Error creating payment intent:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
    throw new Error(`Failed to create payment intent: ${errorMessage}`);
  }
};

/**
 * Verify webhook signature
 * Cashfree uses SHA256 HMAC with the webhook secret
 */
export const verifyWebhookSignature = (
  payload: string | object,
  signature: string,
): boolean => {
  if (!CASHFREE_WEBHOOK_SECRET) {
    logger.warn('Webhook secret not configured, skipping signature verification');
    return true; // In development, allow if secret not set
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      logger.warn('Webhook signature verification failed', {
        expected: expectedSignature,
        received: signature,
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Get payment status from Cashfree
 */
export const getPaymentStatus = async (
  orderId: string,
): Promise<IPaymentIntentResponse | null> => {
  if (!isCashfreeEnabled()) {
    throw new Error('Cashfree is not configured');
  }

  try {
    const xApiVersion = '2023-08-01';
    const response = await cashfreeClient!.PGFetchOrder(xApiVersion, orderId);

    if (!response.data) {
      return null;
    }

    const orderData = response.data;

    return {
      order_id: orderData.order_id || orderId,
      payment_session_id: orderData.payment_session_id || '',
      amount: (orderData.order_amount || 0) * 100, // Convert to paise
      currency: orderData.order_currency || 'INR',
      status: orderData.order_status || 'UNKNOWN',
      method: 'upi',
      notes: orderData.order_note ? JSON.parse(orderData.order_note) : undefined,
    };
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.statusCode === 404) {
      return null;
    }
    logger.error('Error fetching payment status:', error);
    throw new Error(`Failed to fetch payment status: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Get payment details by payment ID
 */
export const getPaymentDetails = async (paymentId: string): Promise<any> => {
  if (!isCashfreeEnabled()) {
    throw new Error('Cashfree is not configured');
  }

  try {
    const xApiVersion = '2023-08-01';
    const response = await cashfreeClient!.PGFetchPayment(xApiVersion, paymentId);
    return response.data;
  } catch (error: any) {
    logger.error('Error fetching payment details:', error);
    throw new Error(`Failed to fetch payment details: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Create payout to dealer
 * Note: Cashfree payouts require appropriate account setup
 */
export const createPayout = async (request: IPayoutRequest): Promise<IPayoutResponse> => {
  if (!isCashfreeEnabled()) {
    throw new Error('Cashfree is not configured');
  }

  try {
    // Note: Cashfree payout API structure may vary
    // For now, return a manual payout record that can be processed later
    // In production, implement based on Cashfree payout API documentation
    logger.warn('Payouts API not fully implemented. Using manual payout process.');
    return {
      id: `manual_${Date.now()}`,
      entity: 'payout',
      amount: request.amount,
      currency: request.currency || 'INR',
      fees: 0,
      tax: 0,
      status: 'pending',
      mode: request.mode || 'NEFT',
      reference_id: request.referenceId || `payout_${Date.now()}`,
      notes: request.notes,
      created_at: Math.floor(Date.now() / 1000),
    };

    if (!payoutResponse.data) {
      throw new Error('Failed to create payout: No data in response');
    }

    const payoutData = payoutResponse.data;

    logger.info('Payout created', {
      payoutId: payoutData.reference_id,
      amount: payoutData.amount,
    });

    return {
      id: payoutData.reference_id || `payout_${Date.now()}`,
      entity: 'payout',
      amount: (payoutData.amount || 0) * 100, // Convert to paise
      currency: payoutData.currency || 'INR',
      fees: (payoutData.fees || 0) * 100,
      tax: 0,
      status: payoutData.status || 'PENDING',
      utr: payoutData.utr || '',
      mode: payoutData.mode || request.mode || 'NEFT',
      reference_id: payoutData.reference_id || request.referenceId || `payout_${Date.now()}`,
      notes: request.notes,
      created_at: Math.floor(Date.now() / 1000),
    };
  } catch (error: any) {
    logger.error('Error creating payout:', error);
    // If payouts API not available, return a mock response
    if (error?.response?.status === 404 || error?.message?.includes('payout')) {
      logger.warn('Payouts API not available. Using manual payout process.');
      return {
        id: `manual_${Date.now()}`,
        entity: 'payout',
        amount: request.amount,
        currency: request.currency || 'INR',
        fees: 0,
        tax: 0,
        status: 'pending',
        mode: request.mode || 'NEFT',
        reference_id: request.referenceId || `payout_${Date.now()}`,
        notes: request.notes,
        created_at: Math.floor(Date.now() / 1000),
      };
    }
    throw new Error(`Failed to create payout: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>,
): Promise<any> => {
  if (!isCashfreeEnabled()) {
    throw new Error('Cashfree is not configured');
  }

  try {
    const xApiVersion = '2023-08-01';
    const refundRequest: any = {
      refund_amount: amount ? amount / 100 : undefined, // Cashfree expects amount in rupees
      refund_note: JSON.stringify(notes || {}),
      refund_id: `refund_${Date.now()}`,
    };

    const response = await cashfreeClient!.PGCreateRefund(xApiVersion, paymentId, refundRequest);

    if (!response.data) {
      throw new Error('Failed to create refund: No data in response');
    }

    const refundData = response.data;

    logger.info('Refund created', {
      refundId: refundData.refund_id,
      paymentId,
      amount: refundData.refund_amount,
    });

    return refundData;
  } catch (error: any) {
    logger.error('Error creating refund:', error);
    throw new Error(`Failed to create refund: ${error?.message || 'Unknown error'}`);
  }
};

