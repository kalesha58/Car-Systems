import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { CFSession, CFEnvironment } from 'cashfree-pg-api-contract';

export interface CashfreePaymentOptions {
    payment_session_id: string;
    order_id: string;
    environment?: 'SANDBOX' | 'PRODUCTION';
}

export interface CashfreePaymentSuccessResponse {
    order_id: string;
    payment_id?: string;
}

export interface CashfreePaymentFailureResponse {
    code: number;
    description: string;
    reason?: string;
    source?: string;
    step?: string;
    metadata?: any;
}

class CashfreeService {
    private static instance: CashfreeService;
    private defaultEnvironment: CFEnvironment = CFEnvironment.SANDBOX;

    private constructor() { }

    public static getInstance(): CashfreeService {
        if (!CashfreeService.instance) {
            CashfreeService.instance = new CashfreeService();
        }
        return CashfreeService.instance;
    }

    /**
     * Check if in test mode
     */
    public isTestMode(): boolean {
        return this.defaultEnvironment === CFEnvironment.SANDBOX;
    }

    /**
     * Initiate Cashfree payment
     * @param options - Payment options with payment_session_id and order_id
     * @returns Promise resolving to payment success response
     * @throws CashfreePaymentFailureResponse if payment fails or is cancelled
     */
    public initiatePayment(options: CashfreePaymentOptions): Promise<CashfreePaymentSuccessResponse> {
        return new Promise((resolve, reject) => {
            try {
                const environment = options.environment === 'PRODUCTION' 
                    ? CFEnvironment.PRODUCTION 
                    : CFEnvironment.SANDBOX;

                console.log('🔧 [CashfreeService] Initiating payment with options:', JSON.stringify(options, null, 2));
                console.log('🔑 [CashfreeService] Order ID:', options.order_id);
                console.log('🔑 [CashfreeService] Payment Session ID:', options.payment_session_id);
                console.log('🌍 [CashfreeService] Environment:', environment === CFEnvironment.SANDBOX ? 'SANDBOX' : 'PRODUCTION');

                // Create Cashfree session
                const session = new CFSession(
                    options.payment_session_id,
                    options.order_id,
                    environment
                );

                // Set callbacks
                CFPaymentGatewayService.setCallback({
                    onVerify: (orderID: string) => {
                        console.log('✅ [CashfreeService] Payment verified - Order ID:', orderID);
                        resolve({
                            order_id: orderID,
                        });
                    },
                    onError: (error: any, orderID: string) => {
                        console.error('❌ [CashfreeService] Payment error:', {
                            error: JSON.stringify(error, null, 2),
                            orderID,
                        });

                        const errorResponse: CashfreePaymentFailureResponse = {
                            code: error?.code || 500,
                            description: error?.message || error?.description || 'Payment failed',
                            reason: error?.reason || 'unknown',
                            source: error?.source || 'cashfree',
                            step: error?.step || 'payment',
                            metadata: error,
                        };

                        reject(errorResponse);
                    },
                });

                // Initiate payment
                CFPaymentGatewayService.doWebPayment(session);
            } catch (error: any) {
                console.error('❌ [CashfreeService] Error initiating payment:', error);
                reject({
                    code: 500,
                    description: error?.message || 'Failed to initiate payment',
                    reason: 'initialization_error',
                    source: 'client',
                    step: 'initialization',
                    metadata: error,
                } as CashfreePaymentFailureResponse);
            }
        });
    }

    /**
     * Remove event subscribers (cleanup)
     */
    public removeEventSubscriber(): void {
        try {
            CFPaymentGatewayService.removeEventSubscriber();
        } catch (error) {
            console.error('Error removing event subscriber:', error);
        }
    }
}

export default CashfreeService.getInstance();
