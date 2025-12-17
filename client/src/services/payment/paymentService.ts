import { appAxios } from '../apiInterceptors';

export interface IRazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Verify Razorpay payment with server
 * @param orderId - Order ID
 * @param paymentResponse - Payment response from Razorpay checkout
 * @returns Promise resolving to verification result
 */
export const verifyRazorpayPayment = async (
  orderId: string,
  paymentResponse: IRazorpayPaymentResponse,
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('🔐 [PaymentService] Starting payment verification', {
      orderId,
      payment_id: paymentResponse.razorpay_payment_id,
      order_id: paymentResponse.razorpay_order_id,
      signature: paymentResponse.razorpay_signature ? `${paymentResponse.razorpay_signature.substring(0, 20)}...` : 'missing',
    });

    const verificationPayload = {
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_signature: paymentResponse.razorpay_signature,
    };

    console.log('📤 [PaymentService] Sending verification request to:', `/user/orders/${orderId}/verify-payment`);
    console.log('📤 [PaymentService] Verification payload:', JSON.stringify(verificationPayload, null, 2));

    const response = await appAxios.post(`/user/orders/${orderId}/verify-payment`, verificationPayload);

    console.log('📥 [PaymentService] Verification response:', JSON.stringify(response.data, null, 2));

    const result = {
      success: response.data?.success || false,
      data: response.data?.data,
    };

    console.log('✅ [PaymentService] Verification result:', result);

    return result;
  } catch (error: any) {
    console.error('❌ [PaymentService] Verification error:', error);
    console.error('❌ [PaymentService] Error details:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      fullError: JSON.stringify(error?.response?.data || error, null, 2),
    });

    const errorMessage =
      error?.response?.data?.Response?.ReturnMessage ||
      error?.response?.data?.message ||
      error?.message ||
      'Payment verification failed';

    console.error('❌ [PaymentService] Error message:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
};

