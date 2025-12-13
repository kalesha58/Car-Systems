declare module 'react-native-razorpay' {
    export interface CheckoutOptions {
        key: string;
        amount: number | string;
        currency: string;
        name: string;
        description?: string;
        image?: string;
        order_id: string;
        prefill?: {
            email?: string;
            contact?: string;
            name?: string;
        };
        notes?: Record<string, string>;
        theme?: {
            color?: string;
            backdrop_color?: string;
        };
        modal?: {
            backdropclose?: boolean;
            escape?: boolean;
            handleback?: boolean;
            confirm_close?: boolean;
            ondismiss?: () => void;
            animation?: boolean;
        };
        subscription_id?: string;
        retry?: {
            enabled: boolean;
            max_count: number;
        };
        [key: string]: any;
    }

    export interface PaymentSuccessResponse {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }

    export interface PaymentFailureResponse {
        code: number;
        description: string;
        source: string;
        step: string;
        reason: string;
        metadata: any;
    }

    const RazorpayCheckout: {
        open(options: CheckoutOptions): Promise<PaymentSuccessResponse>;
        onExternalWalletSelection(callback: (walletName: string) => void): void;
    };

    export default RazorpayCheckout;
}
