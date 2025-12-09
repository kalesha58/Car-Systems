import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
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
import {navigate} from '@utils/NavigationUtils';
import {ICreateOrderRequest, IShippingAddress} from '../../types/order/IOrder';
import {IAddress} from '../../types/address/IAddress';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';
import CouponModal from '@components/coupon/CouponModal';
import {ICoupon} from '@types/coupon/ICoupon';

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
  const grandTotal = totalItemPrice - couponDiscount + otherCharges;
  const route = useRoute();
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {colors} = useTheme();

  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
  const [couponModalVisible, setCouponModalVisible] = useState(false);

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

    const orderData: ICreateOrderRequest = {
      items: orderItems,
      shippingAddress,
      paymentMethod: 'cash_on_delivery',
    };

    setLoading(true);
    try {
      const data = await createOrder(orderData);

      if (data !== null) {
        setCurrentOrder(data);
        clearCart();
        navigate('OrderSuccess', {...data});
      } else {
        Alert.alert('There was an error');
      }
    } catch (error) {
      Alert.alert('Failed to create order');
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

        <BillDetails totalItemPrice={totalItemPrice} />

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

      <View style={hocStyles.cartContainer}>
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
                Cash on Delivery
              </CustomText>
            </View>

            <View style={{width: '70%'}}>
              <ArrowButton
                loading={loading}
                price={grandTotal}
                title="Place Order"
                onPress={handlePlaceOrder}
                disabled={!selectedAddress}
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

