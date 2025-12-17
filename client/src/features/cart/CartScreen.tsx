import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
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
import { ICreateOrderRequest, IShippingAddress } from '../../types/order/IOrder';
import { IAddress } from '../../types/address/IAddress';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import CouponModal from '@components/coupon/CouponModal';
import { ICoupon } from '@types/coupon/ICoupon';
import { getSavedAddresses } from '@service/addressService';
import { getDealerById, getBusinessRegistrationById } from '@service/dealerService';

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
  const { colors } = useTheme();

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

  // COD charge will be added by backend - we show estimated total here
  // Final total will come from backend response
  const estimatedCodCharge = selectedPaymentMethod === 'cash_on_delivery' ? 5 : 0;
  const estimatedGrandTotal = totalItemPrice - couponDiscount + otherCharges + estimatedCodCharge;

  // Fetch latest address on mount
  useEffect(() => {
    const fetchLatestAddress = async () => {
      try {
        setIsLoadingAddress(true);
        const addresses = await getSavedAddresses();
        // Addresses are sorted by createdAt descending (newest first)
        if (addresses && addresses.length > 0) {
          setSelectedAddress(addresses[0]); // Set the latest address as default
        }
      } catch (error) {
        // Error handling - no fallback per rules
        console.log('Failed to fetch addresses:', error);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    fetchLatestAddress();
  }, []);

  // Fetch dealer info if cart has items
  useEffect(() => {
    const fetchDealerInfo = async () => {
      console.log('🔍 [Dealer Validation] Starting dealer info fetch...');

      if (cart.length === 0) {
        console.log('⚠️ [Dealer Validation] Cart is empty');
        setDealerInfo(null);
        setUpiDisabledReason(null);
        return;
      }

      try {
        // Get dealerId from first cart item
        const firstItem = cart[0];
        const dealerId = firstItem?.item?.dealerId;

        console.log('📦 [Dealer Validation] Cart first item:', {
          itemName: firstItem?.item?.name,
          dealerId: dealerId,
        });

        if (!dealerId) {
          console.log('❌ [Dealer Validation] No dealer ID found in cart item');
          setDealerInfo(null);
          setSelectedPaymentMethod('cash_on_delivery');
          setUpiDisabledReason('Dealer information not available');
          return;
        }

        console.log('🌐 [Dealer Validation] Fetching business registration by ID:', dealerId);
        // dealerId is actually the Business Registration _id
        const businessReg = await getBusinessRegistrationById(dealerId);

        console.log('📡 [Dealer Validation] API Response:', {
          found: !!businessReg,
          registrationType: businessReg ? typeof businessReg : 'null',
        });

        if (!businessReg) {
          console.log('❌ [Dealer Validation] Business registration not found');
          setDealerInfo(null);
          setSelectedPaymentMethod('cash_on_delivery');
          setUpiDisabledReason('Business registration not found');
          return;
        }

        console.log('👤 [Dealer Validation] FULL Business Registration RAW DATA:', JSON.stringify(businessReg, null, 2));

        console.log('👤 [Dealer Validation] Parsed Data Check:', {
          businessName: businessReg.businessName,
          type: businessReg.type,
          status: businessReg.status,
          hasPayout: !!businessReg.payout,
          payoutType: businessReg.payout?.type,
          hasUpiId: !!businessReg.payout?.upiId,
          hasBank: !!businessReg.payout?.bank,
        });

        // Check 1: Business registration status
        if (businessReg.status !== 'approved') {
          console.log('⚠️ [Dealer Validation] Business registration not approved. Status:', businessReg.status);
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

        // Check 2: Payout credentials
        const hasPayout = !!(businessReg.payout && (businessReg.payout.upiId || businessReg.payout.bank));

        console.log('💳 [Dealer Validation] Payout check:', {
          hasPayout: hasPayout,
          upiId: businessReg.payout?.upiId,
          bankAccountNumber: businessReg.payout?.bank?.accountNumber ? '***' + businessReg.payout.bank.accountNumber.slice(-4) : null,
        });

        setDealerInfo({
          name: businessReg.type || 'Dealer',
          businessName: businessReg.businessName || '',
          status: businessReg.status,
          hasPayout,
          upiAvailable: hasPayout,
        });

        // Auto-select COD if UPI not available
        if (!hasPayout) {
          console.log('⚠️ [Dealer Validation] UPI unavailable - no payout credentials');
          setSelectedPaymentMethod('cash_on_delivery');
          setUpiDisabledReason('Dealer has no payment credentials configured');
        } else {
          console.log('✅ [Dealer Validation] UPI available!');
          setUpiDisabledReason(null);
        }
      } catch (error: any) {
        console.error('❌ [Dealer Validation] Error fetching dealer info:', error);
        console.error('Error details:', {
          message: error?.message || 'Unknown error',
          response: error?.response?.data || 'No response data',
          status: error?.response?.status || 'No status',
        });
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

  const getAddressIcon = (iconType: string) => {
    switch (iconType) {
      case 'home':
        return 'home-outline';
      case 'building':
        return 'business-outline';
      case 'location':
        return 'location-outline';
      default:
        return 'location-outline';
    }
  };

  const handleAddAddress = () => {
    navigate('SavedAddresses', { selectMode: true });
  };

  const handleChangeAddress = () => {
    if (selectedAddress?._id) {
      navigate('SavedAddresses', {
        selectMode: true,
        preselectedAddressId: selectedAddress._id,
      });
    } else {
      navigate('SavedAddresses', { selectMode: true });
    }
  };

  const handlePlaceOrder = async () => {
    // Check if there's an active order (not delivered or cancelled)
    if (currentOrder !== null) {
      const orderStatus = currentOrder.status?.toUpperCase() || '';
      const isOrderCompleted = 
        orderStatus === 'DELIVERED' || 
        orderStatus === 'CANCELLED_BY_USER' || 
        orderStatus === 'CANCELLED_BY_DEALER' ||
        orderStatus === 'REFUND_COMPLETED';
      
      if (!isOrderCompleted) {
        Alert.alert('Order in Progress', 'Please wait for your current order to be delivered before placing a new order.');
        return;
      } else {
        // Clear completed order to allow new order
        setCurrentOrder(null);
      }
    }

    if (cart.length === 0) {
      Alert.alert('Add any items to place order');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Please select a delivery address');
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
      Alert.alert('Please select a payment method');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Please accept the terms and conditions');
      return;
    }

    // Validate UPI selection
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

    // Generate idempotency key
    const idempotencyKey = generateIdempotencyKey();

    setLoading(true);
    try {
      // Create order with idempotency key
      const headers = {
        'Idempotency-Key': idempotencyKey,
      };

      const response = await appAxios.post('/user/orders', orderData, { headers });
      const data = response.data?.data;

      if (data !== null) {
        setCurrentOrder(data);

        // Handle UPI payment flow
        if (selectedPaymentMethod === 'upi' && data.paymentAction) {
          // Clear cart for UPI payment too (will be restored if payment fails)
          clearCart();
          // Navigate to payment status screen
          navigate('PaymentStatus', {
            orderId: data.id,
            paymentAction: data.paymentAction,
          });
        } else {
          // COD - navigate to success
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
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      backgroundColor: colors.backgroundSecondary,
      padding: 10,
      paddingBottom: 250,
    },
    cancelText: {
      marginTop: 4,
      opacity: 0.6,
    },
    flexRowBetween: {
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      paddingHorizontal: 15,
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
      minWidth: 0, // Important for text wrapping
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
      minWidth: 0, // Important for text wrapping
    },
    paymentGateway: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 14,
      paddingTop: 10,
    },
    addressContainer: {
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 15,
      paddingVertical: 12,
      paddingBottom: 12,
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
      minWidth: 0, // Important for text wrapping
    },
    changeAddressButton: {
      marginLeft: 8,
      paddingLeft: 8,
      paddingRight: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    absoluteContainer: {
      marginVertical: 15,
      marginBottom: Platform.OS === 'ios' ? 30 : 10,
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
      paddingHorizontal: 15,
      paddingRight: 15,
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
      borderWidth: 2,
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
    radioButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    radioButtonSelected: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.secondary,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentTextContainer: {
      marginLeft: 12,
      flex: 1,
      marginRight: 8,
      minWidth: 0, // Important for text wrapping
    },
    radioButtonWrapper: {
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.secondary,
    },
  });

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader title={t('cart.title')} />
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
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Cart" />
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

        {/* Payment Method Selection */}
        <View style={{ marginBottom: 15 }}>
          <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={{ marginBottom: 15 }}>
            Payment Method
          </CustomText>

          {/* UPI Option */}
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

          {/* COD Option */}
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

          {/* Dealer Info */}
          {dealerInfo && (
            <View style={{ marginTop: 10, padding: 10, backgroundColor: colors.backgroundSecondary, borderRadius: 8 }}>
              <CustomText variant="h9" style={{ opacity: 0.7 }}>
                Payment will go to: {dealerInfo.name} ({dealerInfo.businessName})
              </CustomText>
              {dealerInfo.status !== 'approved' && (
                <CustomText variant="h9" style={{ color: colors.error || '#ff0000', marginTop: 4 }}>
                  ⚠️ Registration status: {dealerInfo.status}
                </CustomText>
              )}
            </View>
          )}

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={[styles.flexRow, { marginTop: 15 }]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}>
            <Icon
              name={acceptedTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={RFValue(20)}
              color={acceptedTerms ? colors.secondary : colors.text}
            />
            <CustomText variant="h9" style={{ marginLeft: 8, flex: 1 }}>
              I accept the terms and conditions
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.flexRowBetween}>
          <View>
            <CustomText variant="h8" fontFamily={Fonts.SemiBold}>
              Cancellation Policy
            </CustomText>
            <CustomText
              variant="h9"
              style={styles.cancelText}
              fontFamily={Fonts.SemiBold}>
              Orders cannot be cancelled once packed for delivery, In case of
              unexpected delays, refund will be provided, if applicable
            </CustomText>
          </View>
        </View>
      </ScrollView>

      <View style={[hocStyles.cartContainer, { backgroundColor: colors.cardBackground || colors.background }]}>
        <View style={styles.absoluteContainer}>
          <View style={styles.addressContainer}>
            {selectedAddress ? (
              <>
                <View style={styles.flexRow}>
                  <IconIonicons
                    name={getAddressIcon(selectedAddress.iconType)}
                    size={RFValue(20)}
                    color={colors.text}
                    style={{ marginRight: 8 }}
                  />
                  <View style={styles.addressTextContainer}>
                    <CustomText 
                      variant="h8" 
                      fontFamily={Fonts.Medium}
                      numberOfLines={1}>
                      Delivering to {selectedAddress.name}
                    </CustomText>
                    <CustomText
                      variant="h9"
                      numberOfLines={2}
                      style={{ opacity: 0.6, marginTop: 4 }}>
                      {selectedAddress.fullAddress}
                    </CustomText>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={handleChangeAddress}
                  style={styles.changeAddressButton}>
                  <CustomText
                    variant="h8"
                    style={{ color: colors.secondary }}
                    fontFamily={Fonts.Medium}>
                    Change
                  </CustomText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.flexRow}>
                  <IconIonicons
                    name="location-outline"
                    size={RFValue(20)}
                    color={colors.disabled}
                  />
                  <View style={{ width: '75%' }}>
                    <CustomText variant="h8" fontFamily={Fonts.Medium}>
                      Deliver to address
                    </CustomText>
                    <CustomText
                      variant="h9"
                      numberOfLines={2}
                      style={{ opacity: 0.6 }}>
                      No address selected
                    </CustomText>
                  </View>
                </View>
                <TouchableOpacity onPress={handleAddAddress}>
                  <CustomText
                    variant="h8"
                    style={{ color: colors.secondary }}
                    fontFamily={Fonts.Medium}>
                    Add
                  </CustomText>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.paymentGateway}>
            <View style={{ width: '30%' }}>
              <CustomText fontSize={RFValue(6)} fontFamily={Fonts.Regular}>
                💵 PAY USING
              </CustomText>
              <CustomText
                fontFamily={Fonts.Regular}
                variant="h9"
                style={{ marginTop: 2 }}>
                {selectedPaymentMethod === 'upi'
                  ? 'Pay now (UPI)'
                  : selectedPaymentMethod === 'cash_on_delivery'
                    ? 'Cash on Delivery'
                    : 'Select Payment'}
              </CustomText>
            </View>

            <View style={{ width: '70%' }}>
              <ArrowButton
                loading={loading}
                price={estimatedGrandTotal}
                title="Place Order"
                onPress={handlePlaceOrder}
                disabled={!selectedAddress || !selectedPaymentMethod || !acceptedTerms}
              />
            </View>
          </View>
        </View>
      </View>

      <CouponModal
        visible={couponModalVisible}
        onClose={() => setCouponModalVisible(false)}
        onApplyCoupon={(coupon: ICoupon | null) => {
          setSelectedCoupon(coupon);
          setCouponModalVisible(false);
        }}
      />
    </View>
  );
};

export default CartScreen;

