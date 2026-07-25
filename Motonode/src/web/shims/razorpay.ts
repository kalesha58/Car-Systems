type CheckoutOptions = {
  key: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id?: string;
  prefill?: Record<string, string>;
  theme?: { color?: string };
};

type SuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay Checkout'));
    document.head.appendChild(script);
  });
}

const RazorpayCheckout = {
  open: async (options: CheckoutOptions): Promise<SuccessPayload> => {
    await loadRazorpayScript();
    if (!window.Razorpay) {
      throw { code: 500, description: 'Razorpay unavailable', reason: 'initialization_error' };
    }

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay!({
        ...options,
        handler: (response: SuccessPayload) => resolve(response),
        modal: {
          ondismiss: () =>
            reject({
              code: 0,
              description: 'Payment cancelled',
              reason: 'user_cancelled',
            }),
        },
      });
      rzp.open();
    });
  },
};

export default RazorpayCheckout;
