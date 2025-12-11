import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@hooks/useTheme';
import {
  initiateUPIPayment,
  pollPaymentStatus,
  handlePaymentSuccess,
  handlePaymentFailure,
  IPaymentAction,
} from '@services/payment/upiPaymentService';

type PaymentStatusRouteParams = {
  PaymentStatus: {
    orderId: string;
    paymentAction: IPaymentAction;
  };
};

const PaymentStatusScreen: React.FC = () => {
  const route = useRoute<RouteProp<PaymentStatusRouteParams, 'PaymentStatus'>>();
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {orderId, paymentAction} = route.params;

  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initiate UPI payment when screen loads
    const startPayment = async () => {
      try {
        const initiated = await initiateUPIPayment(paymentAction);
        if (!initiated) {
          setStatus('failed');
          setError('Failed to open UPI app');
          return;
        }

        // Start polling for payment status
        try {
          await pollPaymentStatus(
            orderId,
            (newStatus, newPaymentStatus) => {
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
          setStatus('failed');
          setError(pollError.message || 'Payment timeout or failed');
        }
      } catch (error: any) {
        setStatus('failed');
        setError(error.message || 'Failed to initiate payment');
      }
    };

    startPayment();
  }, [orderId, paymentAction, navigation]);

  const handleRetry = () => {
    setStatus('processing');
    setError(null);
    // Re-initiate payment
    initiateUPIPayment(paymentAction).catch((err) => {
      setStatus('failed');
      setError(err.message);
    });
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <CustomHeader title="Payment" />
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color={colors.secondary} />
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.title}>
              Processing Payment
            </CustomText>
            <CustomText variant="h8" style={styles.subtitle}>
              Please complete the payment in your UPI app
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
            <TouchableOpacity style={[styles.retryButton, {backgroundColor: colors.secondary}]} onPress={handleRetry}>
              <CustomText variant="h7" fontFamily={Fonts.Medium} style={{color: '#fff'}}>
                Retry Payment
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.codButton, {borderColor: colors.secondary}]}
              onPress={() => {
                handlePaymentFailure(orderId, error || '', navigation);
              }}>
              <CustomText variant="h7" fontFamily={Fonts.Medium} style={{color: colors.secondary}}>
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

