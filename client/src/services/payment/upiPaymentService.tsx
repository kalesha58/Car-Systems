import {Linking, Alert} from 'react-native';
import {getOrderById} from '../orderService';
import {appAxios} from '../apiInterceptors';
import {useAuthStore} from '../../state/authStore';

export interface IPaymentAction {
  type: 'UPI_INTENT' | 'DEEP_LINK' | 'QR';
  paymentIntentId: string;
  amount: number;
  currency: string;
  deeplink?: string;
  qrCode?: string;
  expiresAt?: string;
}

/**
 * Initiate UPI payment
 */
export const initiateUPIPayment = async (paymentAction: IPaymentAction): Promise<boolean> => {
  try {
    // For Razorpay, we need to construct the UPI deeplink
    // Format: razorpay://pay?amount={amount}&currency={currency}&order_id={order_id}
    if (paymentAction.type === 'UPI_INTENT' || paymentAction.type === 'DEEP_LINK') {
      const deeplink = paymentAction.deeplink || 
        `razorpay://pay?amount=${paymentAction.amount}&currency=${paymentAction.currency}&order_id=${paymentAction.paymentIntentId}`;
      
      // Try to open UPI app
      const canOpen = await Linking.canOpenURL(deeplink);
      if (canOpen) {
        await Linking.openURL(deeplink);
        return true;
      } else {
        // Fallback: try common UPI apps
        const upiApps = [
          `phonepe://pay?pa=merchant@ybl&pn=Merchant&am=${paymentAction.amount / 100}&cu=INR`,
          `paytmmp://pay?pa=merchant@paytm&pn=Merchant&am=${paymentAction.amount / 100}&cu=INR`,
          `gpay://pay?pa=merchant@okaxis&pn=Merchant&am=${paymentAction.amount / 100}&cu=INR`,
        ];
        
        for (const appLink of upiApps) {
          const canOpenApp = await Linking.canOpenURL(appLink);
          if (canOpenApp) {
            await Linking.openURL(appLink);
            return true;
          }
        }
        
        Alert.alert(
          'UPI App Not Found',
          'Please install a UPI app (PhonePe, GPay, Paytm) to complete payment.',
        );
        return false;
      }
    } else if (paymentAction.type === 'QR' && paymentAction.qrCode) {
      // Show QR code - handled by PaymentStatusScreen
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initiating UPI payment:', error);
    Alert.alert('Error', 'Failed to open UPI app. Please try again.');
    return false;
  }
};

/**
 * Poll payment status with exponential backoff
 */
export const pollPaymentStatus = async (
  orderId: string,
  onStatusUpdate: (status: string, paymentStatus: string) => void,
  maxDuration: number = 120000, // 2 minutes
): Promise<{status: string; paymentStatus: string} | null> => {
  const startTime = Date.now();
  let pollInterval = 3000; // Start with 3 seconds
  const maxInterval = 10000; // Max 10 seconds

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        if (Date.now() - startTime > maxDuration) {
          reject(new Error('Payment timeout'));
          return;
        }

        const response = await appAxios.get(`/user/orders/${orderId}/status`);
        const orderStatus = response.data?.data;

        if (orderStatus) {
          onStatusUpdate(orderStatus.status, orderStatus.paymentStatus);

          if (orderStatus.paymentStatus === 'paid') {
            resolve({
              status: orderStatus.status,
              paymentStatus: orderStatus.paymentStatus,
            });
            return;
          }

          if (orderStatus.paymentStatus === 'failed' || orderStatus.status === 'PAYMENT_FAILED') {
            reject(new Error('Payment failed'));
            return;
          }
        }

        // Exponential backoff
        setTimeout(poll, pollInterval);
        pollInterval = Math.min(pollInterval * 1.5, maxInterval);
      } catch (error: any) {
        // On error, continue polling with backoff
        setTimeout(poll, pollInterval);
        pollInterval = Math.min(pollInterval * 1.5, maxInterval);
      }
    };

    poll();
  });
};

/**
 * Handle payment success
 */
export const handlePaymentSuccess = async (orderId: string, navigation: any) => {
  try {
    // Fetch updated order from server after payment verification
    const orderData = await getOrderById(orderId);
    if (orderData) {
      // Set in auth store so LiveTracking can access it
      const { setCurrentOrder } = useAuthStore.getState();
      setCurrentOrder(orderData);
    }
    // Navigate to order success screen
    navigation.navigate('OrderSuccess', {orderId});
  } catch (error) {
    console.error('Error fetching order after payment:', error);
    // Still navigate even if fetch fails
    navigation.navigate('OrderSuccess', {orderId});
  }
};

/**
 * Handle payment failure
 */
export const handlePaymentFailure = (orderId: string, error: string, navigation: any) => {
  Alert.alert(
    'Payment Failed',
    error || 'Payment could not be completed. Please try again or choose COD.',
    [
      {
        text: 'Retry Payment',
        onPress: () => {
          // Navigate back to cart or retry
          navigation.goBack();
        },
      },
      {
        text: 'Choose COD',
        onPress: () => {
          navigation.navigate('Cart');
        },
      },
    ],
  );
};

