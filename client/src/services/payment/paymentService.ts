import { appAxios } from '../../service/apiInterceptors';

export interface ICashfreePaymentResponse {
  order_id: string;
  payment_id?: string;
  payment_session_id?: string;
}

/**
 * Verify Cashfree payment with server
 * @param orderId - Order ID (internal order ID)
 * @param paymentResponse - Payment response from Cashfree (contains order_id from Cashfree)
 * @returns Promise resolving to verification result
 */
export const verifyCashfreePayment = async (
  orderId: string,
  paymentResponse: ICashfreePaymentResponse,
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('🔐 [PaymentService] Starting payment verification', {
      orderId,
      cashfree_order_id: paymentResponse.order_id,
      payment_id: paymentResponse.payment_id,
      payment_session_id: paymentResponse.payment_session_id,
    });

    const verificationPayload = {
      payment_id: paymentResponse.payment_id || '',
      order_id: paymentResponse.order_id,
      payment_session_id: paymentResponse.payment_session_id,
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

// Legacy function name for backward compatibility
export const verifyRazorpayPayment = verifyCashfreePayment;
