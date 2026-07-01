import { api } from './api';

export interface IRazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Verify Razorpay payment with server (HMAC signature check)
 */
export const verifyRazorpayPayment = async (
  orderId: string,
  paymentResponse: IRazorpayPaymentResponse,
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const verificationPayload = {
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_signature: paymentResponse.razorpay_signature,
    };

    const response = await api.post(
      `/user/orders/${orderId}/verify-payment`,
      verificationPayload,
    );

    return {
      success: response.data?.success || false,
      data: response.data?.data,
    };
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.Response?.ReturnMessage ||
      error?.response?.data?.message ||
      error?.message ||
      'Payment verification failed';

    return {
      success: false,
      error: errorMessage,
    };
  }
};
