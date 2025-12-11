import { Router, Request, Response } from 'express';
import { handlePaymentWebhook } from '../services/payment/paymentService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Razorpay webhook endpoint
 * This endpoint receives webhook events from Razorpay
 * Note: This endpoint should NOT require authentication as Razorpay calls it directly
 */
router.post('/razorpay', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get signature from header
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Prepare webhook data with signature
    const webhookData = {
      ...req.body,
      signature,
    };

    // Process webhook asynchronously
    // Always return 200 quickly to Razorpay
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
    logger.error('Error in webhook endpoint:', error);
    // Still return 200 to Razorpay to prevent retries
    // The webhook will be stored and can be processed later
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
    });
  }
});

export default router;

