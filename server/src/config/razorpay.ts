import Razorpay from 'razorpay';
import { logger } from '../utils/logger';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_ENV = process.env.RAZORPAY_ENV || 'sandbox';

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  logger.warn(
    'Razorpay credentials not configured. Payment features will not work. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.',
  );
}

export const razorpayClient = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    })
  : null;

export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const isRazorpayEnabled = () => {
  return razorpayClient !== null;
};

export const getRazorpayEnv = () => RAZORPAY_ENV;

