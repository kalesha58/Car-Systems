import Razorpay from 'razorpay';
import { DEFAULT_GREETING_IMAGE_URL } from './greetingNotification';
import { logger } from '../utils/logger';

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
export const RAZORPAY_ENV = process.env.RAZORPAY_ENV || 'test';

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  logger.warn(
    'Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (use test keys from Razorpay Dashboard).',
  );
}

export const razorpayClient =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      })
    : null;

export const isRazorpayEnabled = (): boolean => razorpayClient !== null;

/** Public key safe to send to mobile clients for checkout */
export const getRazorpayKeyId = (): string => RAZORPAY_KEY_ID;

/** HTTPS logo for Razorpay checkout header (must be publicly reachable) */
export const RAZORPAY_CHECKOUT_IMAGE_URL =
  process.env.RAZORPAY_CHECKOUT_IMAGE_URL || DEFAULT_GREETING_IMAGE_URL;

export const getRazorpayCheckoutImageUrl = (): string | undefined => {
  const url = RAZORPAY_CHECKOUT_IMAGE_URL?.trim();
  return url && url.startsWith('https://') ? url : undefined;
};
