import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@hooks/useTheme';
import {
  pollPaymentStatus,
  handlePaymentSuccess,
  handlePaymentFailure,
  IPaymentAction,
} from '@services/payment/upiPaymentService';
import RazorpayService from '@services/payment/RazorpayService';
import { verifyRazorpayPayment } from '@services/payment/paymentService';
import { useAuthStore } from '@state/authStore';
import { appAxios } from '@service/apiInterceptors';

type PaymentStatusRouteParams = {
  PaymentStatus: {
    orderId: string;
    paymentAction: IPaymentAction;
  };
};

const PaymentStatusScreen: React.FC = () => {
  const route = useRoute<RouteProp<PaymentStatusRouteParams, 'PaymentStatus'>>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, setCurrentOrder } = useAuthStore();
  const { orderId, paymentAction } = route.params;

  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const paymentInProgress = useRef(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const verifyAndNavigateRef = useRef(false);

  // Function to check payment status from server
  const checkPaymentStatusFromServer = async (): Promise<
    | { handled: true; paid: boolean }
    | { handled: false; paid: false }
  > => {
    try {
      const response = await appAxios.get(`/user/orders/${orderId}/status`);
      const orderStatus = response.data?.data;
      
      if (orderStatus) {
        setPaymentStatus(orderStatus.paymentStatus);
        if (orderStatus.paymentStatus === 'paid') {
          return { handled: true, paid: true };
        } else if (orderStatus.paymentStatus === 'failed' || orderStatus.status === 'PAYMENT_FAILED') {
          return { handled: true, paid: false };
        }
      }
      return { handled: false, paid: false };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { handled: false, paid: false };
    }
  };

  const finalizeSuccess = () => {
    if (verifyAndNavigateRef.current) {
      return;
    }
    verifyAndNavigateRef.current = true;
    paymentInProgress.current = false;
    setStatus('success');
    setTimeout(() => {
      handlePaymentSuccess(orderId, navigation);
    }, 300);
  };

  const finalizeFailure = (msg?: string) => {
    paymentInProgress.current = false;
    setStatus('failed');
    setError(msg || 'Payment failed');
  };

  // Listen for app state changes to detect when returning from Razorpay
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        paymentInProgress.current
      ) {
        // App came to foreground - might be returning from Razorpay
        // Do a quick server status check as a fallback (no long polling here).
        setTimeout(async () => {
          if (!paymentInProgress.current || status !== 'processing') {
            return;
          }
          const res = await checkPaymentStatusFromServer();
          if (res.handled && res.paid) {
            finalizeSuccess();
          } else if (res.handled && !res.paid) {
            finalizeFailure('Payment failed');
          }
        }, 1200);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [orderId, navigation, status]);

  useEffect(() => {
    // Initiate Payment when screen loads
    const startPayment = async () => {
      paymentInProgress.current = true;
      verifyAndNavigateRef.current = false;
      try {
        console.log('🚀 [Payment] Starting Razorpay checkout', {
          orderId,
          paymentIntentId: paymentAction.paymentIntentId,
          amount: paymentAction.amount,
          currency: paymentAction.currency,
          type: paymentAction.type,
          deeplink: paymentAction.deeplink,
          fullPaymentAction: JSON.stringify(paymentAction, null, 2),
        });
        console.log('👤 [Payment] User info:', {
          email: user?.email,
          phone: user?.phone,
          name: user?.name,
        });

        // Single fallback: if callback/verification doesn't happen, start polling once after 10s.
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
        }
        fallbackTimerRef.current = setTimeout(async () => {
          if (!paymentInProgress.current || status !== 'processing') {
            return;
          }
          try {
            await pollPaymentStatus(
              orderId,
              (_newStatus: string, newPaymentStatus: string) => {
                setPaymentStatus(newPaymentStatus);
                if (newPaymentStatus === 'paid') {
                  finalizeSuccess();
                } else if (newPaymentStatus === 'failed') {
                  finalizeFailure('Payment failed');
                }
              },
              60000,
            );
          } catch {
            // If polling fails, keep user on processing; AppState fallback can still resolve.
          }
        }, 10000);

        // Prepare Razorpay checkout options
        const checkoutOptions = {
          description: `Payment for Order #${orderId.slice(-6)}`,
          image: 'https://i.imgur.com/3g7nmJC.png', // Placeholder logo
          currency: paymentAction.currency,
          amount: paymentAction.amount,
          order_id: paymentAction.paymentIntentId,
          prefill: {
            email: user?.email || undefined,
            contact: user?.phone || undefined,
            name: user?.name || undefined,
          },
          theme: { color: colors.secondary },
          notes: {
            orderId: orderId,
            orderNumber: `ORDER-${orderId.slice(-6)}`,
          },
        };

        console.log('📤 [Payment] Sending to Razorpay:', JSON.stringify(checkoutOptions, null, 2));
        console.log('🔑 [Payment] Payment Intent ID:', paymentAction.paymentIntentId);
        console.log('💰 [Payment] Amount (paise):', paymentAction.amount);
        console.log('💰 [Payment] Amount (₹):', paymentAction.amount / 100);

        console.log('⏳ [Payment] Waiting for Razorpay response...');
        const paymentResponse = await RazorpayService.openCheckout(checkoutOptions);

        console.log('📥 [Payment] Received from Razorpay:', JSON.stringify(paymentResponse, null, 2));

        // Clear fallback timer since we got the callback
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }

        console.log('✅ [Payment] Razorpay checkout successful', paymentResponse);

        // Extract payment response fields (already validated in RazorpayService)
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;

        console.log('🔍 [Payment] Extracted payment data:', {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature: razorpay_signature ? `${razorpay_signature.substring(0, 20)}...` : 'missing',
        });

        // Verify payment with server
        console.log('🔐 [Payment] Verifying payment with server...');
        console.log('🔐 [Payment] Order ID for verification:', orderId);
        
        let verificationResult;
        try {
          verificationResult = await verifyRazorpayPayment(orderId, {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
          });
        } catch (verifyError) {
          console.error('❌ [Payment] Verification threw an error:', verifyError);
          setStatus('failed');
          setError('Payment verification failed. Please contact support.');
          return;
        }

        console.log('✅ [Payment] Verification result:', {
          success: verificationResult.success,
          error: verificationResult.error,
          data: verificationResult.data,
        });

        if (!verificationResult.success) {
          console.error('❌ [Payment] Verification failed:', verificationResult.error);
          finalizeFailure(verificationResult.error || 'Payment verification failed');
          return;
        }

        // Verification succeeded; backend has marked payment as paid.
        // Navigate immediately for a faster UX (LiveTracking will refetch order).
        setPaymentStatus('paid');
        finalizeSuccess();
      } catch (error: any) {
        // Payment cancelled or failed at Razorpay level
        console.error('❌ [Payment] Razorpay error:', error);
        console.error('❌ [Payment] Error details:', {
          code: error?.code,
          description: error?.description,
          reason: error?.reason,
          source: error?.source,
          step: error?.step,
          metadata: error?.metadata,
          fullError: JSON.stringify(error, null, 2),
        });
        console.error('❌ [Payment] Error stack:', error?.stack);

        // If user cancelled/backed out, do not show "failed" UI; just go back.
        const isUserCancelled = error?.reason === 'user_cancelled' || error?.code === 0;
        if (isUserCancelled) {
          paymentInProgress.current = false;
          setStatus('processing');
          setError(null);
          setTimeout(() => {
            navigation.goBack();
          }, 300);
          return;
        }
        
        // Check if payment actually succeeded on server (in case callback failed but payment went through)
        const serverStatus = await checkPaymentStatusFromServer();
        if (serverStatus.handled && serverStatus.paid) {
          finalizeSuccess();
          return;
        }
        if (serverStatus.handled && !serverStatus.paid) {
          finalizeFailure('Payment failed');
          return;
        }

        // Razorpay error description - handle both PaymentFailureResponse and generic errors
        const errorMsg = error?.description || error?.reason || error?.message || 'Payment cancelled';
        finalizeFailure(errorMsg);
      }
    };

    startPayment();

    // Cleanup on unmount
    return () => {
      paymentInProgress.current = false;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [orderId, paymentAction, navigation, user, colors.secondary]);

  const handleRetry = () => {
    setStatus('processing');
    setError(null);
    // Re-initiate payment
    const retryPayment = async () => {
      try {
        console.log('🔄 [Payment] Retry payment - Opening Razorpay checkout');
        const retryCheckoutOptions = {
          description: `Payment for Order #${orderId.slice(-6)}`,
          image: 'https://i.imgur.com/3g7nmJC.png',
          currency: paymentAction.currency,
          amount: paymentAction.amount,
          order_id: paymentAction.paymentIntentId,
          prefill: {
            email: user?.email || undefined,
            contact: user?.phone || undefined,
            name: user?.name || undefined,
          },
          theme: { color: colors.secondary },
        };
        console.log('📤 [Payment] Retry - Sending to Razorpay:', JSON.stringify(retryCheckoutOptions, null, 2));
        
        const paymentResponse = await RazorpayService.openCheckout(retryCheckoutOptions);
        
        console.log('📥 [Payment] Retry - Received from Razorpay:', JSON.stringify(paymentResponse, null, 2));

        // Extract payment response fields (already validated in RazorpayService)
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
        
        console.log('🔍 [Payment] Retry - Extracted payment data:', {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature: razorpay_signature ? `${razorpay_signature.substring(0, 20)}...` : 'missing',
        });

        // Verify payment with server
        const verificationResult = await verifyRazorpayPayment(orderId, {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
        });

        if (!verificationResult.success) {
          setStatus('failed');
          setError(verificationResult.error || 'Payment verification failed');
          return;
        }

        // After successful verification, fetch updated order and set in store
        try {
          const updatedOrder = await getOrderById(orderId);
          if (updatedOrder) {
            setCurrentOrder(updatedOrder);
            console.log('✅ [Payment] Order updated in store after retry payment verification');
          }
        } catch (orderError) {
          console.error('⚠️ [Payment] Error fetching order after retry verification:', orderError);
          // Continue even if order fetch fails - handlePaymentSuccess will try again
        }

        // Poll again for final status
        await pollPaymentStatus(
          orderId,
          (newStatus: string, newPaymentStatus: string) => {
            setPaymentStatus(newPaymentStatus);
            if (newPaymentStatus === 'paid') {
              setStatus('success');
            } else if (newPaymentStatus === 'failed') {
              setStatus('failed');
            }
          },
          120000
        );

        setStatus('success');
        setTimeout(() => {
          handlePaymentSuccess(orderId, navigation);
        }, 2000);
      } catch (err: any) {
        setStatus('failed');
        // Handle both PaymentFailureResponse and generic errors
        setError(err?.description || err?.reason || err?.message || 'Payment retry failed');
      }
    };

    retryPayment();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader title="Payment" />
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color={colors.secondary} />
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.title}>
              Processing Payment
            </CustomText>
            <CustomText variant="h8" style={styles.subtitle}>
              Please complete the payment
            </CustomText>
            <CustomText variant="h9" style={styles.amount}>
              Amount: ₹{paymentAction.amount / 100}
            </CustomText>
            {RazorpayService.isTestMode() && (
              <View style={[styles.testHintBox, { borderColor: colors.secondary }]}>
                <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={{ textAlign: 'center' }}>
                  Test mode UPI
                </CustomText>
                <CustomText variant="h9" style={{ opacity: 0.8, textAlign: 'center', marginTop: 6 }}>
                  In Razorpay checkout, enter UPI ID: success@razorpay (success) or failure@razorpay (fail)
                </CustomText>
              </View>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <Icon name="check-circle" size={RFValue(80)} color={colors.secondary} />
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.title}>
              Payment Successful!
            </CustomText>
            <CustomText variant="h8" style={styles.subtitle}>
              Your order has been confirmed
            </CustomText>
          </>
        )}

        {status === 'failed' && (
          <>
            <Icon name="close-circle" size={RFValue(80)} color={colors.error || '#ff0000'} />
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.title}>
              Payment Failed
            </CustomText>
            <CustomText variant="h8" style={styles.subtitle}>
              {error || 'Payment could not be completed'}
            </CustomText>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.secondary }]} onPress={handleRetry}>
              <CustomText variant="h7" fontFamily={Fonts.Medium} style={{ color: '#fff' }}>
                Retry Payment
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.codButton, { borderColor: colors.secondary }]}
              onPress={() => {
                handlePaymentFailure(orderId, error || '', navigation);
              }}>
              <CustomText variant="h7" fontFamily={Fonts.Medium} style={{ color: colors.secondary }}>
                Choose COD Instead
              </CustomText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
  amount: {
    marginTop: 20,
    fontSize: RFValue(18),
    fontFamily: Fonts.SemiBold,
  },
  testHintBox: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 320,
  },
  retryButton: {
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  codButton: {
    marginTop: 15,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});

export default PaymentStatusScreen;

