jest.mock('../../../config/razorpay', () => ({
  isRazorpayEnabled: () => true,
  getRazorpayKeyId: () => 'rzp_test_mock_key_id',
  getRazorpayCheckoutImageUrl: () => 'https://example.com/motonode-logo.png',
}));

import {
  buildRazorpayPaymentAction,
  assertRazorpayPaymentAction,
} from '../orderService';

describe('Razorpay payment action', () => {
  it('builds RAZORPAY_CHECKOUT with keyId and order_ id', () => {
    const action = buildRazorpayPaymentAction(
      { order_id: 'order_test123', amount: 20000, currency: 'INR' },
      { name: 'Test', email: 't@test.com', phone: '9999999999' },
    );

    expect(action.type).toBe('RAZORPAY_CHECKOUT');
    expect(action.keyId).toBe('rzp_test_mock_key_id');
    expect(action.paymentIntentId).toBe('order_test123');
    expect(action.amount).toBe(20000);
    expect(action.image).toBe('https://example.com/motonode-logo.png');
    assertRazorpayPaymentAction(action);
  });

  it('rejects legacy UPI_INTENT shape', () => {
    expect(() =>
      assertRazorpayPaymentAction({
        type: 'UPI_INTENT',
        paymentIntentId: '6a11acdc314a90657570df9a',
        amount: 200,
        currency: 'INR',
      }),
    ).toThrow(/legacy format/i);
  });
});
