/**
 * Verifies Razorpay env vars before deploy. Run: npm run verify:razorpay
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

let failed = false;

if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
  console.error('❌ RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_');
  failed = true;
} else {
  console.log(`✓ RAZORPAY_KEY_ID (${keyId.slice(0, 12)}...)`);
}

if (!keySecret) {
  console.error('❌ RAZORPAY_KEY_SECRET is required');
  failed = true;
} else {
  console.log('✓ RAZORPAY_KEY_SECRET is set');
}

if (!webhookSecret) {
  console.warn('⚠ RAZORPAY_WEBHOOK_SECRET is empty — webhooks will not verify');
} else {
  console.log('✓ RAZORPAY_WEBHOOK_SECRET is set');
}

if (failed) {
  process.exit(1);
}

console.log('\nRazorpay config OK. Deploy server and set the same vars on api.motonode.in.');
console.log('Webhook URL: POST https://api.motonode.in/api/webhooks/razorpay');
console.log('Events: payment.captured, payment.failed, order.paid');
