import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import { Fonts } from '@utils/Constants';
import EnhancedOrderList from '@features/order/EnhancedOrderList';
import CustomText from '@components/ui/CustomText';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import EnhancedBillDetails from '@features/order/EnhancedBillDetails';
import RelatedProducts from '../cart/RelatedProducts';
import DeliveryInstructions, {DeliveryPreference} from '../cart/DeliveryInstructions';
import { useCartStore } from '@state/cartStore';
import { useAuthStore } from '@state/authStore';
import { hocStyles } from '@styles/GlobalStyles';
import ArrowButton from '@components/ui/ArrowButton';
import { createOrder } from '@service/orderService';
import { appAxios } from '@service/apiInterceptors';
import { navigate } from '@utils/NavigationUtils';
import {
  isValidRazorpayPaymentAction,
  getInvalidPaymentActionMessage,
} from '@utils/paymentAction';
import {
  syncCurrentOrderBeforeCheckout,
  refreshCurrentOrderFromServer,
} from '@utils/syncCurrentOrder';
import { ICreateOrderRequest, IShippingAddress } from '../../types/order/IOrder';
import { IAddress } from '../../types/address/IAddress';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import CouponModal from '@components/coupon/CouponModal';
import { ICoupon } from '@types/coupon/ICoupon';
import { getSavedAddresses } from '@service/addressService';
import { getDealerById, getBusinessRegistrationById } from '@service/dealerService';
import ThemedModal from '@components/ui/ThemedModal';
import { withAuth } from '@utils/AuthGuard';

// Generate idempotency key
const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

interface RouteParams {
  selectedAddress?: IAddress;
}

const CartScreen: React.FC = () => {
  const { getTotalPrice, cart, clearCart, selectedCoupon, getCouponDiscount, setSelectedCoupon } = useCartStore();
  const { user, setCurrentOrder, currentOrder } = useAuthStore();
  const totalItemPrice = getTotalPrice();
  const couponDiscount = getCouponDiscount(totalItemPrice);
  const deliveryCharge = 29;
  const handlingCharge = 2;
  const otherCharges = deliveryCharge + handlingCharge;
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'cash_on_delivery' | null>(null);
  const [dealerInfo, setDealerInfo] = useState<{
    name: string;
    businessName: string;
    status: string;
    hasPayout: boolean;
    upiAvailable: boolean;
  } | null>(null);
  const [upiDisabledReason, setUpiDisabledReason] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [deliveryPreference, setDeliveryPreference] = useState<DeliveryPreference>({
    leaveAtDoor: false,
    contactBeforeDelivery: true,
  });

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('Notice');
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [infoModalVariant, setInfoModalVariant] =
    useState<React.ComponentProps<typeof ThemedModal>['variant']>('info');
  const [infoModalPrimaryText, setInfoModalPrimaryText] = useState('OK');
  const infoModalPrimaryActionRef = useRef<(() => void) | undefined>(undefined);

  const closeInfoModal = () => {
    setInfoModalVisible(false);
    infoModalPrimaryActionRef.current = undefined;
    setInfoModalPrimaryText('OK');
  };

  const showInfoModal = (
    title: string,
    message: string,
    variant: React.ComponentProps<typeof ThemedModal>['variant'] = 'info',
    options?: { primaryText?: string; onPrimaryPress?: () => void },
  ) => {
    setInfoModalTitle(title);
    setInfoModalMessage(message);
    setInfoModalVariant(variant);
    setInfoModalPrimaryText(options?.primaryText ?? 'OK');
    infoModalPrimaryActionRef.current = options?.onPrimaryPress;
    setInfoModalVisible(true);
  };

  const handleInfoModalPrimary = () => {
    if (infoModalPrimaryActionRef.current) {
      infoModalPrimaryActionRef.current();
      return;
    }
    closeInfoModal();
  };

  const showSelectDeliveryAddressModal = () => {
    showInfoModal(
      t('cart.selectAddressTitle'),
      t('cart.selectAddressMessage'),
      'warning',
      {
        primaryText: t('cart.selectAddressAction'),
        onPrimaryPress: () => {
          closeInfoModal();
          navigate('SavedAddresses', { selectMode: true });
        },
      },
    );
  };

  const showAcceptTermsModal = () => {
    showInfoModal(
      t('cart.acceptTermsTitle'),
      t('cart.acceptTermsMessage'),
      'warning',
      {
        primaryText: t('cart.acceptTermsAction'),
        onPrimaryPress: () => {
          setAcceptedTerms(true);
          closeInfoModal();
        },
      },
    );
  };

  const showSelectPaymentMethodModal = () => {
    showInfoModal(
      t('cart.selectPaymentTitle'),
      t('cart.selectPaymentMessage'),
      'warning',
      {
        primaryText: t('cart.selectPaymentAction'),
        onPrimaryPress: closeInfoModal,
      },
    );
  };

  const estimatedCodCharge = selectedPaymentMethod === 'cash_on_delivery' ? 5 : 0;
  const estimatedGrandTotal = totalItemPrice - couponDiscount + otherCharges + estimatedCodCharge;

  useEffect(() => {
    const fetchLatestAddress = async () => {
      try {
        setIsLoadingAddress(true);
        const addresses = await getSavedAddresses();
        if (addresses && addresses.length > 0) {
          setSelectedAddress(addresses[0]);
        }
      } catch (error) {
        console.log('Failed to fetch addresses:', error);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    fetchLatestAddress();
  }, []);

  useEffect(() => {
    const fetchDealerInfo = async () => {
      if (cart.length === 0) {
        setDealerInfo(null);
        setUpiDisabledReason(null);
        return;
      }

      try {
        const firstItem = cart[0];
        const dealerId = firstItem?.item?.dealerId;

        if (!dealerId) {
          setDealerInfo(null);
          setSelectedPaymentMethod('cash_on_delivery');
          setUpiDisabledReason('Dealer information not available');
          return;
        }

        const businessReg = await getBusinessRegistrationById(dealerId);

        if (!businessReg) {
          setDealerInfo(null);
          setSelectedPaymentMethod('cash_on_delivery');
          setUpiDisabledReason('Business registration not found');
          return;
        }

        if (businessReg.status !== 'approved') {
          setDealerInfo({
            name: businessReg.type || 'Dealer',
            businessName: businessReg.businessName || '',
            status: businessReg.status,
            hasPayout: false,
            upiAvailable: false,
          });
          setSelectedPaymentMethod('cash_on_delivery');
          setUpiDisabledReason('Dealer registration not approved yet');
          return;
        }

        const hasPayout = !!(businessReg.payout && (businessReg.payout.upiId || businessReg.payout.bank));

        setDealerInfo({
          name: businessReg.type || 'Dealer',
          businessName: businessReg.businessName || '',
          status: businessReg.status,
          hasPayout,
          upiAvailable: hasPayout,
        });

        if (!hasPayout) {
          setSelectedPaymentMethod('cash_on_delivery');
          setUpiDisabledReason('Dealer has no payment credentials configured');
        } else {
          setUpiDisabledReason(null);
        }
      } catch (error: any) {
        setDealerInfo(null);
        setSelectedPaymentMethod('cash_on_delivery');
        setUpiDisabledReason('Failed to verify dealer information');
      }
    };

    fetchDealerInfo();
  }, [cart]);

  useFocusEffect(
    React.useCallback(() => {
      const params = route.params as RouteParams | undefined;
      if (params?.selectedAddress) {
        setSelectedAddress(params.selectedAddress);
        navigation.setParams({ selectedAddress: undefined } as never);
      }
    }, [route.params, navigation]),
  );

  useFocusEffect(
    useCallback(() => {
      if (currentOrder) {
        refreshCurrentOrderFromServer();
      }
    }, [currentOrder]),
  );

  const parseAddressToShippingAddress = (
    address: IAddress | null,
  ): IShippingAddress => {
    if (!address || !address.fullAddress) {
      return {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
      };
    }

    const parts = address.fullAddress.split(',').map(part => part.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode: parts[3] || '',
      country: 'India',
    };
  };

  const handlePlaceOrder = async () => {
    withAuth(async () => {
      const { canPlaceNewOrder } = await syncCurrentOrderBeforeCheckout();
      if (!canPlaceNewOrder) {
        showInfoModal(
          'Order in Progress',
          'Please wait for your current order to be delivered before placing a new order.',
          'warning',
        );
        return;
      }

      if (cart.length === 0) {
        Alert.alert('Add any items to place order');
        return;
      }

      if (!selectedAddress) {
        showSelectDeliveryAddressModal();
        return;
      }

      const shippingAddress = parseAddressToShippingAddress(selectedAddress);

      const orderItems = cart.map(item => ({
        productId: item.item?.id || item._id.toString(),
        name: item.item?.name || '',
        quantity: item.count,
        price: item.item?.price || 0,
        total: item.count * (item.item?.price || 0),
      }));

      if (!selectedPaymentMethod) {
        showSelectPaymentMethodModal();
        return;
      }

      if (!acceptedTerms) {
        showAcceptTermsModal();
        return;
      }

      if (selectedPaymentMethod === 'upi' && dealerInfo && !dealerInfo.upiAvailable) {
        Alert.alert(
          'UPI Payment Unavailable',
          upiDisabledReason || 'UPI payment is not available for this dealer.',
        );
        return;
      }

      const orderData: ICreateOrderRequest = {
        items: orderItems,
        shippingAddress,
        paymentMethod: selectedPaymentMethod,
        dealerId: cart[0]?.item?.dealerId,
        ...(deliveryInstructions && {deliveryInstructions}),
        ...(deliveryPreference && Object.keys(deliveryPreference).length > 0 && {deliveryPreference}),
      };

      const idempotencyKey = generateIdempotencyKey();

      setLoading(true);
      try {
        const headers = {
          'Idempotency-Key': idempotencyKey,
        };

        const response = await appAxios.post('/user/orders', orderData, { headers });
        const data = response.data?.data;

        if (data !== null) {
          setCurrentOrder(data);
          if (selectedPaymentMethod === 'upi' && data.paymentAction) {
            if (!isValidRazorpayPaymentAction(data.paymentAction)) {
              Alert.alert(
                'Payment unavailable',
                getInvalidPaymentActionMessage(data.paymentAction),
              );
              return;
            }
            clearCart();
            navigate('PaymentStatus', {
              orderId: data.id,
              paymentAction: data.paymentAction,
            });
          } else {
            clearCart();
            navigate('OrderSuccess', { ...data });
          }
        } else {
          Alert.alert('There was an error');
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.Response?.ReturnMessage || error?.message || 'Failed to create order';
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    }, 'Please login to place an order.');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      overflow: 'hidden',
    },
    scrollContainer: {
      backgroundColor: colors.backgroundSecondary,
      padding: 10,
      paddingBottom: 250,
    },
    flexRowBetween: {
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      flexDirection: 'row',
      borderRadius: 15,
      marginBottom: 15,
      marginHorizontal: 10,
      minHeight: 60,
    },
    couponTextContainer: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
      minWidth: 0,
    },
    arrowContainer: {
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: 4,
      minWidth: 24,
    },
    flexRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    addressContainer: {
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderBottomWidth: 0.7,
      borderColor: colors.border,
      marginHorizontal: 10,
      backgroundColor: colors.cardBackground,
      borderRadius: 15,
      marginBottom: 15,
    },
    addressTextContainer: {
      flex: 1,
      marginRight: 8,
      minWidth: 0,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyText: {
      color: colors.text,
      marginTop: 20,
      textAlign: 'center',
    },
    emptySubText: {
      color: colors.disabled,
      marginTop: 6,
      textAlign: 'center',
    },
    paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      marginHorizontal: 10,
      minHeight: 70,
    },
    paymentOptionSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.backgroundSecondary,
    },
    paymentOptionDisabled: {
      opacity: 0.5,
    },
    paymentIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentTextContainer: {
      marginLeft: 12,
      flex: 1,
      marginRight: 8,
      minWidth: 0,
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginHorizontal: 10,
      marginTop: 4,
      marginBottom: 15,
      padding: 14,
      backgroundColor: colors.cardBackground,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: acceptedTerms ? colors.secondary : colors.border,
    },
    termsTextBlock: {
      flex: 1,
      marginLeft: 10,
      minWidth: 0,
    },
    termsLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 4,
    },
  });

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
        <CustomHeader 
          title={t('cart.title')} 
          backgroundColor={colors.secondary}
          titleColor={colors.white}
          iconColor={colors.white}
          showNotificationIcon={true}
        />
        <View style={styles.contentContainer}>
          <View style={styles.emptyContainer}>
            <IconIonicons
              name="bag-outline"
              size={RFValue(120)}
              color={colors.disabled}
            />
            <CustomText
              fontSize={RFValue(16)}
              fontFamily={Fonts.Medium}
              style={styles.emptyText}>
              {t('cart.emptyCart')}
            </CustomText>
            <CustomText
              fontSize={RFValue(12)}
              fontFamily={Fonts.Medium}
              style={styles.emptySubText}>
              {t('cart.addItems')}
            </CustomText>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      <ThemedModal
        visible={infoModalVisible}
        title={infoModalTitle}
        message={infoModalMessage}
        variant={infoModalVariant}
        primaryText={infoModalPrimaryText}
        onPrimaryPress={handleInfoModalPrimary}
        onClose={closeInfoModal}
      />
      <CustomHeader 
        title="Cart" 
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
        showNotificationIcon={true}
      />
      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <EnhancedOrderList />

          <TouchableOpacity
            style={styles.flexRowBetween}
            onPress={() => setCouponModalVisible(true)}
            activeOpacity={0.7}>
            <View style={styles.flexRow}>
              <Image
                source={require('@assets/icons/coupon.png')}
                style={{ width: 25, height: 25 }}
              />
              <View style={styles.couponTextContainer}>
                <CustomText 
                  variant="h6" 
                  fontFamily={Fonts.SemiBold}
                  numberOfLines={1}>
                  {selectedCoupon ? `Coupon Applied: ${selectedCoupon.code}` : 'Use Coupons'}
                </CustomText>
                {selectedCoupon && (
                  <CustomText
                    variant="h9"
                    style={{ color: colors.secondary, marginTop: 2 }}
                    fontFamily={Fonts.Regular}
                    numberOfLines={1}>
                    Save ₹{getCouponDiscount(totalItemPrice).toFixed(0)}
                  </CustomText>
                )}
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <Icon name="chevron-right" size={RFValue(16)} color={colors.text} />
            </View>
          </TouchableOpacity>

          <EnhancedBillDetails 
            totalItemPrice={totalItemPrice} 
            codCharge={estimatedCodCharge}
            deliveryCharge={deliveryCharge}
            handlingCharge={handlingCharge}
            showSavings={true}
            freeDeliveryThreshold={500}
          />

          <DeliveryInstructions
            onInstructionsChange={setDeliveryInstructions}
            onPreferenceChange={setDeliveryPreference}
            initialInstructions={deliveryInstructions}
            initialPreference={deliveryPreference}
          />

          <RelatedProducts
            currentProductIds={cart.map(item => item.item?.id || item._id)}
            limit={5}
          />

          <View style={{ marginBottom: 15 }}>
            <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={{ marginBottom: 15 }}>
              Payment Method
            </CustomText>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'upi' && styles.paymentOptionSelected,
                !dealerInfo?.upiAvailable && styles.paymentOptionDisabled,
                { marginBottom: 12 },
              ]}
              onPress={() => {
                if (dealerInfo?.upiAvailable) {
                  setSelectedPaymentMethod('upi');
                } else {
                  Alert.alert(
                    'UPI Unavailable',
                    upiDisabledReason || 'UPI payment is not available for this dealer.',
                  );
                }
              }}
              disabled={!dealerInfo?.upiAvailable}
              activeOpacity={0.7}>
              <View style={styles.flexRow}>
                <View
                  style={[
                    styles.paymentIconContainer,
                    selectedPaymentMethod === 'upi' && {
                      backgroundColor: colors.secondary + '20',
                    },
                  ]}>
                  <Icon
                    name="wallet"
                    size={RFValue(22)}
                    color={
                      !dealerInfo?.upiAvailable
                        ? colors.disabled || '#999'
                        : selectedPaymentMethod === 'upi'
                          ? colors.secondary
                          : colors.text
                    }
                  />
                </View>
                <View style={styles.paymentTextContainer}>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Medium}
                    numberOfLines={1}
                    style={{
                      color:
                        !dealerInfo?.upiAvailable
                          ? colors.disabled || '#999'
                          : selectedPaymentMethod === 'upi'
                            ? colors.secondary
                            : colors.text,
                    }}>
                    Pay now (UPI)
                  </CustomText>
                  {!dealerInfo?.upiAvailable ? (
                    <CustomText 
                      variant="h9" 
                      numberOfLines={2}
                      style={{ color: colors.disabled || '#999', marginTop: 2 }}>
                      {upiDisabledReason || 'Dealer payment setup pending'}
                    </CustomText>
                  ) : (
                    <CustomText variant="h9" style={{ opacity: 0.6, marginTop: 2 }} numberOfLines={1}>
                      Pay instantly via UPI
                    </CustomText>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'cash_on_delivery' && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('cash_on_delivery')}
              activeOpacity={0.7}>
              <View style={styles.flexRow}>
                <View
                  style={[
                    styles.paymentIconContainer,
                    selectedPaymentMethod === 'cash_on_delivery' && {
                      backgroundColor: colors.secondary + '20',
                    },
                  ]}>
                  <Icon
                    name="cash"
                    size={RFValue(22)}
                    color={
                      selectedPaymentMethod === 'cash_on_delivery'
                        ? colors.secondary
                        : colors.text
                    }
                  />
                </View>
                <View style={styles.paymentTextContainer}>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Medium}
                    numberOfLines={1}
                    style={{
                      color:
                        selectedPaymentMethod === 'cash_on_delivery'
                          ? colors.secondary
                          : colors.text,
                    }}>
                    Cash on Delivery
                  </CustomText>
                  <CustomText variant="h9" style={{ color: colors.secondary, marginTop: 2 }} numberOfLines={1}>
                    ₹5 extra charge
                  </CustomText>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel={t('cart.termsAgreement')}>
            <IconIonicons
              name={acceptedTerms ? 'checkbox' : 'square-outline'}
              color={colors.secondary}
              size={RFValue(22)}
              style={{ marginTop: 1 }}
            />
            <View style={styles.termsTextBlock}>
              <CustomText variant="h8" fontFamily={Fonts.Medium} style={{ color: colors.text }}>
                {t('cart.termsAgreement')}
              </CustomText>
              <View style={styles.termsLinkRow}>
                <TouchableOpacity
                  onPress={() => navigate('TermsAndConditions')}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  activeOpacity={0.7}>
                  <CustomText
                    variant="h9"
                    fontFamily={Fonts.SemiBold}
                    style={{ color: colors.secondary }}>
                    {t('cart.viewTerms')}
                  </CustomText>
                </TouchableOpacity>
                <CustomText variant="h9" style={{ color: colors.textSecondary, marginHorizontal: 6 }}>
                  |
                </CustomText>
                <TouchableOpacity
                  onPress={() => navigate('SignupPolicies', { initialTab: 'privacy' })}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  activeOpacity={0.7}>
                  <CustomText
                    variant="h9"
                    fontFamily={Fonts.SemiBold}
                    style={{ color: colors.secondary }}>
                    {t('cart.viewPrivacy')}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <ArrowButton
          loading={loading}
          price={estimatedGrandTotal}
          title="Place Order"
          onPress={handlePlaceOrder}
        />
      </View>
    </View>
  );
};

export default CartScreen;
