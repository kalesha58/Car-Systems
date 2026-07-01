import RazorpayCheckout from 'react-native-razorpay';

export interface IRazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface IRazorpayPaymentFailure {
  code: number;
  description?: string;
  reason?: string;
  source?: string;
  step?: string;
  metadata?: unknown;
}

export interface IPaymentAction {
  type: 'RAZORPAY_CHECKOUT' | 'UPI_INTENT' | 'DEEP_LINK' | 'QR';
  keyId?: string;
  paymentIntentId?: string;
  amount: number;
  currency?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export const RAZORPAY_CHECKOUT_IMAGE_URL =
  'https://res.cloudinary.com/dzguxkrky/image/upload/v1779389686/motonode/notifications/rcggfm3pp5gpcvgzn9n0.jpg';

const isTestKey = (keyId: string): boolean => keyId.startsWith('rzp_test_');

class RazorpayService {
  private static instance: RazorpayService;

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  public isTestMode(keyId?: string): boolean {
    return keyId ? isTestKey(keyId) : true;
  }

  /**
   * Open Razorpay checkout for a server-created order
   */
  public openCheckout(paymentAction: IPaymentAction): Promise<IRazorpayPaymentSuccess> {
    return new Promise((resolve, reject) => {
      const keyId = paymentAction.keyId;
      if (!keyId || !paymentAction.paymentIntentId) {
        reject({
          code: 500,
          description: 'Payment configuration missing',
          reason: 'initialization_error',
          source: 'client',
        } as IRazorpayPaymentFailure);
        return;
      }

      const options = {
        key: keyId,
        amount: paymentAction.amount,
        currency: paymentAction.currency || 'INR',
        name: 'Motonode',
        description: 'Order payment',
        image: paymentAction.image || RAZORPAY_CHECKOUT_IMAGE_URL,
        order_id: paymentAction.paymentIntentId,
        prefill: paymentAction.prefill || {},
        theme: { color: '#E60012' }, // Motonode branding color
      };

      RazorpayCheckout.open(options)
        .then((data: IRazorpayPaymentSuccess) => {
          resolve({
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
          });
        })
        .catch((error: { code?: number; description?: string; reason?: string }) => {
          const failure: IRazorpayPaymentFailure = {
            code: error?.code ?? 500,
            description: error?.description || 'Payment failed',
            reason:
              error?.code === 0 || error?.description?.toLowerCase().includes('cancel')
                ? 'user_cancelled'
                : error?.reason || 'payment_failed',
            source: 'razorpay',
            step: 'payment',
            metadata: error,
          };
          reject(failure);
        });
    });
  }
}

export default RazorpayService.getInstance();
