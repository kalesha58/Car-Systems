import RazorpayCheckout, { CheckoutOptions, PaymentSuccessResponse, PaymentFailureResponse } from 'react-native-razorpay';

interface RazorpayPaymentOptions extends Omit<CheckoutOptions, 'key'> {
    key?: string; // Optional here, can be injected or taken from env/constants
}

class RazorpayService {
    private static instance: RazorpayService;
    // TODO: Move to environment variable or config file
    private defaultKeyId: string = 'MGBJFMEsaHTT34GQpUU1XNtv';

    private constructor() { }

    public static getInstance(): RazorpayService {
        if (!RazorpayService.instance) {
            RazorpayService.instance = new RazorpayService();
        }
        return RazorpayService.instance;
    }

    /**
     * Open Razorpay checkout
     * @param options - Checkout options
     * @returns Promise resolving to payment success response
     * @throws PaymentFailureResponse if payment fails or is cancelled
     */
    public openCheckout(options: RazorpayPaymentOptions): Promise<PaymentSuccessResponse> {
        return new Promise((resolve, reject) => {
            // Spread options first to ensure required fields (amount, order_id) are present
            // Then apply defaults which can be overridden by options
            const checkoutOptions = {
                ...options,
                key: options.key || this.defaultKeyId,
                currency: options.currency || 'INR',
                name: options.name || 'Car Connect',
                theme: options.theme || { color: '#53a20e' },
            } as CheckoutOptions;

            RazorpayCheckout.open(checkoutOptions)
                .then((data: PaymentSuccessResponse) => {
                    // Validate response has required fields
                    if (!data.razorpay_payment_id || !data.razorpay_order_id || !data.razorpay_signature) {
                        console.error('Invalid payment response:', data);
                        reject({
                            code: 500,
                            description: 'Invalid payment response from Razorpay',
                            source: 'client',
                            step: 'payment',
                            reason: 'missing_fields',
                            metadata: data,
                        } as PaymentFailureResponse);
                        return;
                    }
                    console.log(`Payment successful: ${data.razorpay_payment_id}`);
                    resolve(data);
                })
                .catch((error: PaymentFailureResponse) => {
                    // handle failure
                    console.error(`Payment failed: ${error.code} | ${error.description}`);
                    reject(error);
                });
        });
    }
}

export default RazorpayService.getInstance();
