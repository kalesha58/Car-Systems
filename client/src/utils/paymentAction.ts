import { IPaymentAction } from '../types/order/IOrder';

const RAZORPAY_ORDER_PREFIX = 'order_';
const RAZORPAY_KEY_PREFIX = 'rzp_';

export function isValidRazorpayPaymentAction(
  action?: IPaymentAction | null,
): action is IPaymentAction & { keyId: string } {
  return !!(
    action &&
    action.type === 'RAZORPAY_CHECKOUT' &&
    typeof action.keyId === 'string' &&
    action.keyId.startsWith(RAZORPAY_KEY_PREFIX) &&
    typeof action.paymentIntentId === 'string' &&
    action.paymentIntentId.startsWith(RAZORPAY_ORDER_PREFIX) &&
    action.amount > 0
  );
}

export function getInvalidPaymentActionMessage(action?: IPaymentAction | null): string {
  if (!action) {
    return 'Payment could not be started. Please try placing the order again.';
  }
  if (action.type === 'UPI_INTENT' || action.type === 'DEEP_LINK' || action.type === 'QR') {
    return (
      'Online payment is being updated on our servers. Please update the app and try again in a few minutes, or choose Cash on Delivery.'
    );
  }
  if (!action.keyId) {
    return 'Payment gateway is not configured on the server. Please try again later or contact support.';
  }
  if (!action.paymentIntentId?.startsWith(RAZORPAY_ORDER_PREFIX)) {
    return 'Payment session is invalid. Tap Retry or place the order again.';
  }
  return 'Payment could not be started. Please try again.';
}
