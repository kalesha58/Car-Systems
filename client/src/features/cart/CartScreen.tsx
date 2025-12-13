import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useFocusEffect, useRoute, useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import {Fonts} from '@utils/Constants';
import OrderList from '@features/order/OrderList';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import BillDetails from '@features/order/BillDetails';
import {useCartStore} from '@state/cartStore';
import {useAuthStore} from '@state/authStore';
import {hocStyles} from '@styles/GlobalStyles';
import ArrowButton from '@components/ui/ArrowButton';
import {createOrder} from '@service/orderService';
import {appAxios} from '@service/apiInterceptors';
import {navigate} from '@utils/NavigationUtils';
import {ICreateOrderRequest, IShippingAddress} from '../../types/order/IOrder';
import {IAddress} from '../../types/address/IAddress';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';
import CouponModal from '@components/coupon/CouponModal';
import {ICoupon} from '@types/coupon/ICoupon';
import {getSavedAddresses} from '@service/addressService';
import {getDealerById} from '@service/dealerService';

// Generate idempotency key
const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

interface RouteParams {
  selectedAddress?: IAddress;
}

const CartScreen: React.FC = () => {
  const {getTotalPrice, cart, clearCart, selectedCoupon, getCouponDiscount, setSelectedCoupon} = useCartStore();
  const {user, setCurrentOrder, currentOrder} = useAuthStore();
  const totalItemPrice = getTotalPrice();
  const couponDiscount = getCouponDiscount(totalItemPrice);
  const deliveryCharge = 29;
  const handlingCharge = 2;
  const otherCharges = deliveryCharge + handlingCharge;
  const route = useRoute();
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {colors} = useTheme();

  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'cash_on_delivery' | null>(null);
  const [dealerInfo, setDealerInfo] = useState<{name: string; businessName: string; hasPayout: boolean} | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
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
      if (cart.length === 0) {
        setDealerInfo(null);
        return;
      }

      try {
        // Get dealerId from first cart item
        const firstItem = cart[0];
        const dealerId = firstItem?.item?.dealerId;

        console.log(dealerId, "swarop")
        
        if (dealerId) {
          const response = await getDealerById(dealerId);
          console.log(response, 'swarop')
          if (response.success && response.Response) {
            const dealer = Array.isArray(response.Response) ? response.Response[0] : response.Response;
            const hasPayout = !!(dealer.payout && (dealer.payout.upiId || dealer.payout.bank));
            setDealerInfo({
              name: dealer.name || '',
              businessName: dealer.businessName || '',
              hasPayout,
            });
            
            // Auto-select COD if UPI is not available
            if (!hasPayout) {
              setSelectedPaymentMethod('cash_on_delivery');
            }
          }
        } else {
          // No dealer ID - default to COD
          setSelectedPaymentMethod('cash_on_delivery');
        }
      } catch (error) {
        console.log('Failed to fetch dealer info:', error);
        setDealerInfo(null);
        // Default to COD if dealer info fetch fails
        setSelectedPaymentMethod('cash_on_delivery');
      }
    };

    fetchDealerInfo();
  }, [cart]);

  useFocusEffect(
    React.useCallback(() => {
      const params = route.params as RouteParams | undefined;
      if (params?.selectedAddress) {
        setSelectedAddress(params.selectedAddress);
        navigation.setParams({selectedAddress: undefined} as never);
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
    navigate('SavedAddresses', {selectMode: true});
  };

  const handleChangeAddress = () => {
    if (selectedAddress?._id) {
      navigate('SavedAddresses', {
        selectMode: true,
        preselectedAddressId: selectedAddress._id,
      });
    } else {
      navigate('SavedAddresses', {selectMode: true});
    }
  };

  const handlePlaceOrder = async () => {
    if (currentOrder !== null) {
      Alert.alert('Let your first order to be delivered');
      return;
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
    if (selectedPaymentMethod === 'upi' && dealerInfo && !dealerInfo.hasPayout) {
      Alert.alert(
        'UPI Payment Unavailable',
        'Dealer has no UPI/bank configured. Please choose COD or contact dealer.',
      );
      return;
    }

    const orderData: ICreateOrderRequest = {
      items: orderItems,
      shippingAddress,
      paymentMethod: selectedPaymentMethod,
      dealerId: cart[0]?.item?.dealerId,
    };

    // Generate idempotency key
    const idempotencyKey = generateIdempotencyKey();

    setLoading(true);
    try {
      // Create order with idempotency key
      const headers = {
        'Idempotency-Key': idempotencyKey,
      };
      
      const response = await appAxios.post('/user/orders', orderData, {headers});
      const data = response.data?.data;

      if (data !== null) {
        setCurrentOrder(data);
        
        // Handle UPI payment flow
        if (selectedPaymentMethod === 'upi' && data.paymentAction) {
          // Navigate to payment status screen
          navigate('PaymentStatus', {
            orderId: data.id,
            paymentAction: data.paymentAction,
          });
        } else {
          // COD - navigate to success
          clearCart();
          navigate('OrderSuccess', {...data});
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
      padding: 10,
      flexDirection: 'row',
      borderRadius: 15,
      marginBottom: 15,
    },
    flexRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
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
      paddingHorizontal: 10,
      paddingBottom: 10,
      borderBottomWidth: 0.7,
      borderColor: colors.border,
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
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
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
        <OrderList />

        <TouchableOpacity
          style={styles.flexRowBetween}
          onPress={() => setCouponModalVisible(true)}
          activeOpacity={0.7}>
          <View style={styles.flexRow}>
            <Image
              source={require('@assets/icons/coupon.png')}
              style={{width: 25, height: 25}}
            />
            <View style={{flex: 1, marginLeft: 10}}>
              <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
                {selectedCoupon ? `Coupon Applied: ${selectedCoupon.code}` : 'Use Coupons'}
              </CustomText>
              {selectedCoupon && (
                <CustomText
                  variant="h9"
                  style={{color: colors.secondary, marginTop: 2}}
                  fontFamily={Fonts.Regular}>
                  Save ₹{getCouponDiscount(totalItemPrice).toFixed(0)}
                </CustomText>
              )}
            </View>
          </View>
          <Icon name="chevron-right" size={RFValue(16)} color={colors.text} />
        </TouchableOpacity>

        <BillDetails totalItemPrice={totalItemPrice} codCharge={estimatedCodCharge} />

        {/* Payment Method Selection */}
        <View style={{marginBottom: 15}}>
          <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={{marginBottom: 15}}>
            Payment Method
          </CustomText>
          
          {/* UPI Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPaymentMethod === 'upi' && styles.paymentOptionSelected,
              !dealerInfo?.hasPayout && styles.paymentOptionDisabled,
              {marginBottom: 12},
            ]}
            onPress={() => {
              if (dealerInfo?.hasPayout) {
                setSelectedPaymentMethod('upi');
              } else {
                Alert.alert(
                  'UPI Unavailable',
                  'Dealer has no UPI/bank configured. Please choose COD or contact dealer.',
                );
              }
            }}
            disabled={!dealerInfo?.hasPayout}
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
                    !dealerInfo?.hasPayout
                      ? colors.disabled || '#999'
                      : selectedPaymentMethod === 'upi'
                      ? colors.secondary
                      : colors.text
                  }
                />
              </View>
              <View style={{marginLeft: 12, flex: 1}}>
                <CustomText
                  variant="h7"
                  fontFamily={Fonts.Medium}
                  style={{
                    color:
                      !dealerInfo?.hasPayout
                        ? colors.disabled || '#999'
                        : selectedPaymentMethod === 'upi'
                        ? colors.secondary
                        : colors.text,
                  }}>
                  Pay now (UPI)
                </CustomText>
                {!dealerInfo?.hasPayout ? (
                  <CustomText variant="h9" style={{color: colors.disabled || '#999', marginTop: 2}}>
                    Dealer has no UPI/bank configured
                  </CustomText>
                ) : (
                  <CustomText variant="h9" style={{opacity: 0.6, marginTop: 2}}>
                    Pay instantly via UPI
                  </CustomText>
                )}
              </View>
            </View>
            {selectedPaymentMethod === 'upi' && (
              <View style={styles.radioButtonSelected}>
                <View style={styles.radioButtonInner} />
              </View>
            )}
            {selectedPaymentMethod !== 'upi' && dealerInfo?.hasPayout && (
              <View style={styles.radioButton} />
            )}
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
              <View style={{marginLeft: 12, flex: 1}}>
                <CustomText
                  variant="h7"
                  fontFamily={Fonts.Medium}
                  style={{
                    color:
                      selectedPaymentMethod === 'cash_on_delivery'
                        ? colors.secondary
                        : colors.text,
                  }}>
                  Cash on Delivery
                </CustomText>
                <CustomText variant="h9" style={{color: colors.secondary, marginTop: 2}}>
                  ₹5 extra charge
                </CustomText>
              </View>
            </View>
            {selectedPaymentMethod === 'cash_on_delivery' && (
              <View style={styles.radioButtonSelected}>
                <View style={styles.radioButtonInner} />
              </View>
            )}
            {selectedPaymentMethod !== 'cash_on_delivery' && (
              <View style={styles.radioButton} />
            )}
          </TouchableOpacity>

          {/* Dealer Info */}
          {dealerInfo && (
            <View style={{marginTop: 10, padding: 10, backgroundColor: colors.backgroundSecondary, borderRadius: 8}}>
              <CustomText variant="h9" style={{opacity: 0.7}}>
                Payment will go to: {dealerInfo.name} ({dealerInfo.businessName})
              </CustomText>
            </View>
          )}

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={[styles.flexRow, {marginTop: 15}]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}>
            <Icon
              name={acceptedTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={RFValue(20)}
              color={acceptedTerms ? colors.secondary : colors.text}
            />
            <CustomText variant="h9" style={{marginLeft: 8, flex: 1}}>
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

      <View style={[hocStyles.cartContainer, {backgroundColor: colors.cardBackground || colors.background}]}>
        <View style={styles.absoluteContainer}>
          <View style={styles.addressContainer}>
            {selectedAddress ? (
              <>
                <View style={styles.flexRow}>
                  <IconIonicons
                    name={getAddressIcon(selectedAddress.iconType)}
                    size={RFValue(20)}
                    color={colors.text}
                  />
                  <View style={{width: '75%'}}>
                    <CustomText variant="h8" fontFamily={Fonts.Medium}>
                      Delivering to {selectedAddress.name}
                    </CustomText>
                    <CustomText
                      variant="h9"
                      numberOfLines={2}
                      style={{opacity: 0.6}}>
                      {selectedAddress.fullAddress}
                    </CustomText>
                  </View>
                </View>
                <TouchableOpacity onPress={handleChangeAddress}>
                  <CustomText
                    variant="h8"
                    style={{color: colors.secondary}}
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
                  <View style={{width: '75%'}}>
                    <CustomText variant="h8" fontFamily={Fonts.Medium}>
                      Deliver to address
                    </CustomText>
                    <CustomText
                      variant="h9"
                      numberOfLines={2}
                      style={{opacity: 0.6}}>
                      No address selected
                    </CustomText>
                  </View>
                </View>
                <TouchableOpacity onPress={handleAddAddress}>
                  <CustomText
                    variant="h8"
                    style={{color: colors.secondary}}
                    fontFamily={Fonts.Medium}>
                    Add
                  </CustomText>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.paymentGateway}>
            <View style={{width: '30%'}}>
              <CustomText fontSize={RFValue(6)} fontFamily={Fonts.Regular}>
                💵 PAY USING
              </CustomText>
              <CustomText
                fontFamily={Fonts.Regular}
                variant="h9"
                style={{marginTop: 2}}>
                {selectedPaymentMethod === 'upi' 
                  ? 'Pay now (UPI)' 
                  : selectedPaymentMethod === 'cash_on_delivery'
                  ? 'Cash on Delivery'
                  : 'Select Payment'}
              </CustomText>
            </View>

            <View style={{width: '70%'}}>
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

