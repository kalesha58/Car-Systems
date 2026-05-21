/**
 * Payment Gateway Service Tests — Razorpay
 */

import crypto from 'crypto';
import { verifyPaymentSignature, verifyWebhookSignature } from '../gatewayService';

jest.mock('../../../config/razorpay', () => ({
  RAZORPAY_KEY_SECRET: 'test_secret',
  RAZORPAY_WEBHOOK_SECRET: 'whsec_test',
  isRazorpayEnabled: () => true,
  razorpayClient: null,
}));

describe('Gateway Service', () => {
  describe('verifyPaymentSignature', () => {
    it('should verify valid payment signature', () => {
      const orderId = 'order_test123';
      const paymentId = 'pay_test456';
      const signature = crypto
        .createHmac('sha256', 'test_secret')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      expect(verifyPaymentSignature(orderId, paymentId, signature)).toBe(true);
    });

    it('should reject invalid payment signature', () => {
      expect(verifyPaymentSignature('order_a', 'pay_b', 'invalid_sig')).toBe(false);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"event":"payment.captured"}';
      const signature = crypto
        .createHmac('sha256', 'whsec_test')
        .update(payload)
        .digest('hex');

      expect(verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      expect(verifyWebhookSignature('{}', 'bad_signature')).toBe(false);
    });
  });
});
