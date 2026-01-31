import { Request, Response } from 'express';
import { handlePaymentWebhook } from '../services/payment/paymentService';
import { logger } from '../utils/logger';

/**
 * Cashfree webhook controller
 */
export const cashfreeWebhookController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Get signature from header (Cashfree uses x-cashfree-signature)
    const signature = req.headers['x-cashfree-signature'] as string;

    // Prepare webhook data with signature
    const webhookData = {
      ...req.body,
      signature,
    };

    // Process webhook asynchronously
    // Always return 200 quickly to Cashfree
    handlePaymentWebhook(webhookData).catch((error) => {
      logger.error('Error processing webhook asynchronously:', error);
      // Webhook is already stored, can be retried later
    });

    // Return 200 immediately
    res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error: any) {
    logger.error('Error in webhook controller:', error);
    // Still return 200 to Cashfree to prevent retries
    // The webhook will be stored and can be processed later
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
    });
  }
};




