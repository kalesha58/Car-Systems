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
  const { user } = useAuthStore();
  const { orderId, paymentAction } = route.params;

  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const paymentInProgress = useRef(false);
  const razorpayPromiseRef = useRef<Promise<any> | null>(null);
  const checkStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check payment status from server
  const checkPaymentStatusFromServer = async () => {
    try {
      const response = await appAxios.get(`/user/orders/${orderId}/status`);
      const orderStatus = response.data?.data;
      
      if (orderStatus) {
        setPaymentStatus(orderStatus.paymentStatus);
        if (orderStatus.paymentStatus === 'paid') {
          setStatus('success');
          paymentInProgress.current = false;
          setTimeout(() => {
            handlePaymentSuccess(orderId, navigation);
          }, 2000);
          return true;
        } else if (orderStatus.paymentStatus === 'failed' || orderStatus.status === 'PAYMENT_FAILED') {
          setStatus('failed');
          setError('Payment failed');
          paymentInProgress.current = false;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
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
        console.log('📱 [Payment] App returned to foreground - checking payment status');
        
        // Wait a bit for Razorpay callback, then check server status as fallback
        setTimeout(async () => {
          if (paymentInProgress.current && status === 'processing') {
            console.log('📱 [Payment] Checking payment status from server (fallback)');
            const isPaid = await checkPaymentStatusFromServer();
            if (!isPaid) {
              // If still processing, start polling
              console.log('📱 [Payment] Starting polling as fallback');
              try {
                await pollPaymentStatus(
                  orderId,
                  (newStatus: string, newPaymentStatus: string) => {
                    setPaymentStatus(newPaymentStatus);
                    if (newPaymentStatus === 'paid') {
                      setStatus('success');
                      paymentInProgress.current = false;
                      setTimeout(() => {
                        handlePaymentSuccess(orderId, navigation);
                      }, 2000);
                    } else if (newPaymentStatus === 'failed') {
                      setStatus('failed');
                      paymentInProgress.current = false;
                    }
                  },
                  60000, // 1 minute max for fallback polling
                );
              } catch (pollError) {
                console.error('Fallback polling error:', pollError);
              }
            }
          }
        }, 2000); // Wait 2 seconds for Razorpay callback
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (checkStatusTimeoutRef.current) {
        clearTimeout(checkStatusTimeoutRef.current);
      }
    };
  }, [orderId, navigation, status]);

  useEffect(() => {
    // Initiate Payment when screen loads
    const startPayment = async () => {
      paymentInProgress.current = true;
      try {
        console.log('🚀 [Payment] Starting Razorpay checkout', {
          orderId,
          paymentIntentId: paymentAction.paymentIntentId,
          amount: paymentAction.amount,
        });

        // Start a backup polling mechanism in case Razorpay callback doesn't fire
        const backupPolling = setTimeout(async () => {
          if (paymentInProgress.current && status === 'processing') {
            console.log('⏰ [Payment] Backup polling started - Razorpay callback may not have fired');
            try {
              await pollPaymentStatus(
                orderId,
                (newStatus: string, newPaymentStatus: string) => {
                  setPaymentStatus(newPaymentStatus);
                  if (newPaymentStatus === 'paid') {
                    setStatus('success');
                    paymentInProgress.current = false;
                    setTimeout(() => {
                      handlePaymentSuccess(orderId, navigation);
                    }, 2000);
                  } else if (newPaymentStatus === 'failed') {
                    setStatus('failed');
                    paymentInProgress.current = false;
                  }
                },
                60000, // 1 minute
              );
            } catch (pollError) {
              console.error('Backup polling error:', pollError);
            }
          }
        }, 10000); // Start backup polling after 10 seconds

        // Open Razorpay Checkout
        razorpayPromiseRef.current = RazorpayService.openCheckout({
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
        });

        // Clear backup polling since we got the callback
        clearTimeout(backupPolling);

        console.log('✅ [Payment] Razorpay checkout successful', paymentResponse);
        paymentInProgress.current = false;

        // Extract payment response fields (already validated in RazorpayService)
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;

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

        // If verification succeeds, poll for final status update
        try {
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
            120000, // 2 minutes max
          );

          // Payment successful
          setStatus('success');
          setTimeout(() => {
            handlePaymentSuccess(orderId, navigation);
          }, 2000);
        } catch (pollError: any) {
          // Even if polling fails, if verification succeeded, payment is likely successful
          // But we'll show success since verification passed
          setStatus('success');
          setTimeout(() => {
            handlePaymentSuccess(orderId, navigation);
          }, 2000);
        }
      } catch (error: any) {
        // Payment cancelled or failed at Razorpay level
        paymentInProgress.current = false;
        console.error('❌ [Payment] Razorpay error:', error);
        
        // Check if payment actually succeeded on server (in case callback failed but payment went through)
        const serverStatus = await checkPaymentStatusFromServer();
        if (serverStatus) {
          // Payment succeeded on server, ignore the error
          return;
        }
        
        setStatus('failed');
        // Razorpay error description - handle both PaymentFailureResponse and generic errors
        const errorMsg = error?.description || error?.reason || error?.message || 'Payment cancelled';
        setError(errorMsg);
        
        // If user cancelled, don't show as error - just go back
        if (error?.reason === 'user_cancelled' || error?.code === 0) {
          // User cancelled - navigate back after a short delay
          setTimeout(() => {
            navigation.goBack();
          }, 1500);
        }
      }
    };

    startPayment();

    // Cleanup on unmount
    return () => {
      paymentInProgress.current = false;
      if (checkStatusTimeoutRef.current) {
        clearTimeout(checkStatusTimeoutRef.current);
      }
    };
  }, [orderId, paymentAction, navigation, user, colors.secondary]);

  const handleRetry = () => {
    setStatus('processing');
    setError(null);
    // Re-initiate payment
    const retryPayment = async () => {
      try {
        const paymentResponse = await RazorpayService.openCheckout({
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
        });

        // Extract payment response fields (already validated in RazorpayService)
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;

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

