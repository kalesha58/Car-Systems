import RazorpayCheckout, { CheckoutOptions, PaymentSuccessResponse, PaymentFailureResponse } from 'react-native-razorpay';

interface RazorpayPaymentOptions extends Omit<CheckoutOptions, 'key'> {
    key?: string; // Optional here, can be injected or taken from env/constants
}

class RazorpayService {
    private static instance: RazorpayService;
    // TODO: Move to environment variable or config file
    private defaultKeyId: string = 'rzp_test_Rq1SVXAeLdbM98';

    private constructor() { }

    public static getInstance(): RazorpayService {
        if (!RazorpayService.instance) {
            RazorpayService.instance = new RazorpayService();
        }
        return RazorpayService.instance;
    }

    /**
     * Returns the key id that will be used by default.
     * Useful for UI hints (e.g., test mode instructions).
     */
    public getDefaultKeyId(): string {
        return this.defaultKeyId;
    }

    /**
     * Best-effort check for test mode based on key prefix.
     */
    public isTestMode(): boolean {
        return (this.defaultKeyId || '').startsWith('rzp_test_');
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
                // Configure modal options for better UX
                modal: {
                    backdropclose: false, // Prevent accidental dismissal
                    escape: false, // Prevent escape key dismissal
                    handleback: true, // Handle back button
                    confirm_close: true, // Confirm before closing
                    ...options.modal,
                },
            } as CheckoutOptions;

            console.log('🔧 [RazorpayService] Opening checkout with options:', JSON.stringify(checkoutOptions, null, 2));
            console.log('🔑 [RazorpayService] Using Razorpay Key:', checkoutOptions.key);
            console.log('💰 [RazorpayService] Amount (paise):', checkoutOptions.amount);
            console.log('💰 [RazorpayService] Amount (₹):', Number(checkoutOptions.amount) / 100);
            console.log('📋 [RazorpayService] Order ID:', checkoutOptions.order_id);
            console.log('👤 [RazorpayService] Prefill data:', JSON.stringify(checkoutOptions.prefill, null, 2));

            RazorpayCheckout.open(checkoutOptions)
                .then((data: PaymentSuccessResponse) => {
                    console.log('✅ [RazorpayService] Payment success response received:', JSON.stringify(data, null, 2));
                    // Validate response has required fields
                    if (!data.razorpay_payment_id || !data.razorpay_order_id || !data.razorpay_signature) {
                        console.error('❌ [RazorpayService] Invalid payment response - missing required fields:', {
                            hasPaymentId: !!data.razorpay_payment_id,
                            hasOrderId: !!data.razorpay_order_id,
                            hasSignature: !!data.razorpay_signature,
                            fullResponse: JSON.stringify(data, null, 2),
                        });
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
                    console.log(`✅ [RazorpayService] Payment successful - Payment ID: ${data.razorpay_payment_id}`);
                    resolve(data);
                })
                .catch((error: PaymentFailureResponse) => {
                    // handle failure
                    console.error('❌ [RazorpayService] Payment failed:', {
                        code: error?.code,
                        description: error?.description,
                        reason: error?.reason,
                        source: error?.source,
                        step: error?.step,
                        metadata: error?.metadata,
                        fullError: JSON.stringify(error, null, 2),
                    });
                    reject(error);
                });
        });
    }
}

export default RazorpayService.getInstance();
