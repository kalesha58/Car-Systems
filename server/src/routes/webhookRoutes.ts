import { Router, Request, Response } from 'express';
import { handlePaymentWebhook } from '../services/payment/paymentService';
import { verifyWebhookSignature } from '../services/payment/gatewayService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Razorpay webhook endpoint
 * Requires raw body — mount with express.raw() in index.ts before JSON parser
 */
export const razorpayWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody =
      typeof req.body === 'string'
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body
          : JSON.stringify(req.body);

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Razorpay webhook signature verification failed');
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    const payload =
      typeof req.body === 'object' && !Buffer.isBuffer(req.body)
        ? req.body
        : JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));

    const webhookData = {
      ...payload,
      signature,
      rawBody: typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'),
    };

    handlePaymentWebhook(webhookData).catch((error) => {
      logger.error('Error processing Razorpay webhook asynchronously:', error);
    });

    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    logger.error('Error in Razorpay webhook endpoint:', error);
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
    });
  }
};

export default router;
