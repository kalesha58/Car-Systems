import crypto from 'crypto';
import {
  razorpayClient,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  isRazorpayEnabled,
} from '../../config/razorpay';
import { logger } from '../../utils/logger';

export interface IPaymentIntentRequest {
  orderId: string;
  amount: number; // in paise
  currency?: string;
  notes?: Record<string, string>;
  receipt?: string;
}

export interface IPaymentIntentResponse {
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  notes?: Record<string, string>;
}

export interface IPayoutRequest {
  amount: number;
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
 * Create Razorpay order for checkout
 */
export const createPaymentIntent = async (
  request: IPaymentIntentRequest,
): Promise<IPaymentIntentResponse> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const receipt = request.receipt || request.orderId.slice(-40);
    const order = await razorpayClient!.orders.create({
      amount: request.amount,
      currency: request.currency || 'INR',
      receipt,
      notes: {
        mongoOrderId: request.orderId,
        ...request.notes,
      },
    });

    logger.info(`Razorpay order created for ${request.orderId}`, {
      razorpayOrderId: order.id,
    });

    return {
      order_id: order.id,
      amount: typeof order.amount === 'number' ? order.amount : request.amount,
      currency: order.currency || request.currency || 'INR',
      status: order.status || 'created',
      method: 'upi',
      notes: request.notes,
    };
  } catch (error: any) {
    logger.error('Error creating Razorpay order:', error);
    const errorMessage = error?.error?.description || error?.message || 'Unknown error';
    throw new Error(`Failed to create payment intent: ${errorMessage}`);
  }
};

/**
 * Verify Razorpay payment signature (order_id|payment_id)
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string,
): boolean => {
  if (!RAZORPAY_KEY_SECRET) {
    logger.error('Razorpay key secret not configured for signature verification');
    return false;
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      logger.warn('Payment signature verification failed', { orderId, paymentId });
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Verify Razorpay webhook signature (raw body)
 */
export const verifyWebhookSignature = (payload: string | Buffer, signature: string): boolean => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    logger.warn('Webhook secret not configured, skipping signature verification');
    return process.env.NODE_ENV !== 'production';
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      logger.warn('Webhook signature verification failed');
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Fetch Razorpay order status
 */
export const getPaymentStatus = async (razorpayOrderId: string): Promise<IPaymentIntentResponse | null> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const order = await razorpayClient!.orders.fetch(razorpayOrderId);

    return {
      order_id: order.id,
      amount: typeof order.amount === 'number' ? order.amount : 0,
      currency: order.currency || 'INR',
      status: order.status || 'unknown',
      method: 'upi',
      notes: order.notes as Record<string, string> | undefined,
    };
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.error?.code === 'BAD_REQUEST_ERROR') {
      return null;
    }
    logger.error('Error fetching Razorpay order status:', error);
    throw new Error(`Failed to fetch payment status: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Fetch payment details from Razorpay
 */
export const getPaymentDetails = async (paymentId: string): Promise<any> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    return await razorpayClient!.payments.fetch(paymentId);
  } catch (error: any) {
    logger.error('Error fetching payment details:', error);
    throw new Error(`Failed to fetch payment details: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Create payout to dealer (stub — manual process until Route API is integrated)
 */
export const createPayout = async (request: IPayoutRequest): Promise<IPayoutResponse> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

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
};

/**
 * Refund a captured payment
 */
export const refundPayment = async (
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>,
): Promise<any> => {
  if (!isRazorpayEnabled()) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const refundRequest: { amount?: number; notes?: Record<string, string> } = {};
    if (amount) {
      refundRequest.amount = amount;
    }
    if (notes) {
      refundRequest.notes = notes;
    }

    const refund = await razorpayClient!.payments.refund(paymentId, refundRequest);

    logger.info('Refund created', {
      refundId: refund.id,
      paymentId,
      amount: refund.amount,
    });

    return refund;
  } catch (error: any) {
    logger.error('Error creating refund:', error);
    throw new Error(`Failed to create refund: ${error?.message || 'Unknown error'}`);
  }
};
