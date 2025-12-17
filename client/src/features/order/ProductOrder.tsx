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
import CustomHeader from '@components/ui/CustomHeader';
import {Colors, Fonts} from '@utils/Constants';
import OrderList from './OrderList';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BillDetails from './BillDetails';
import {useCartStore} from '@state/cartStore';
import {useAuthStore} from '@state/authStore';
import {hocStyles} from '@styles/GlobalStyles';
import ArrowButton from '@components/ui/ArrowButton';
import {createOrder} from '@service/orderService';
import {ICreateOrderRequest, IShippingAddress} from '../../types/order/IOrder';
import {navigate} from '@utils/NavigationUtils';
import {getCurrentLocationWithAddress} from '@utils/addressUtils';

const ProductOrder = () => {
  const {getTotalPrice, cart, clearCart} = useCartStore();
  const {user, setCurrentOrder, currentOrder} = useAuthStore();
  const totalItemPrice = getTotalPrice();

  const [loading, setLoading] = useState(false);

  const parseAddressToShippingAddress = (
    addressString: string,
  ): IShippingAddress => {
    const parts = addressString.split(',').map(part => part.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      zipCode: parts[3] || '',
      country: parts[4] || 'India',
    };
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

    if (!user?.address) {
      Alert.alert('Please set a delivery address');
      return;
    }

    const shippingAddress = parseAddressToShippingAddress(user.address);

    const orderItems = cart.map(item => ({
      productId: item.item?.id || item._id.toString(),
      name: item.item?.name || '',
      quantity: item.count,
      price: item.item?.price || 0,
      total: item.count * (item.item?.price || 0),
    }));

    setLoading(true);
    
    // Get user's current location for delivery location
    let deliveryLocation;
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        deliveryLocation = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
        };
      }
    } catch (error) {
      // Location permission denied or unavailable - continue without it
      console.log('Could not get current location:', error);
    }

    const orderData: ICreateOrderRequest = {
      items: orderItems,
      shippingAddress,
      paymentMethod: 'cash_on_delivery',
      deliveryLocation,
    };
    try {
      const data = await createOrder(orderData);

      if (data !== null) {
        setCurrentOrder(data);
        clearCart();
        navigate('OrderSuccess', {...data});
      } else {
        Alert.alert('Error', 'There was an error creating your order. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create order. Please check your connection and try again.';
      Alert.alert('Order Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Checkout" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <OrderList />

        <View style={styles.flexRowBetween}>
          <View style={styles.flexRow}>
            <Image
              source={require('@assets/icons/coupon.png')}
              style={{width: 25, height: 25}}
            />
            <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
              Use Coupons
            </CustomText>
          </View>
          <Icon name="chevron-right" size={RFValue(16)} color={Colors.text} />
        </View>

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
            <View style={styles.flexRow}>
              <Image
                source={require('@assets/icons/home.png')}
                style={{width: 20, height: 20}}
              />
              <View style={{width: '75%'}}>
                <CustomText variant="h8" fontFamily={Fonts.Medium}>
                  Delivering to Home
                </CustomText>
                <CustomText
                  variant="h9"
                  numberOfLines={2}
                  style={{opacity: 0.6}}>
                  {user?.address}
                </CustomText>
              </View>
            </View>

            <TouchableOpacity>
              <CustomText
                variant="h8"
                style={{color: Colors.secondary}}
                fontFamily={Fonts.Medium}>
                Change
              </CustomText>
            </TouchableOpacity>
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
                price={totalItemPrice}
                title="Place Order"
                onPress={handlePlaceOrder}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 10,
    paddingBottom: 250,
  },
  cancelText: {
    marginTop: 4,
    opacity: 0.6,
  },
  flexRowBetween: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    flexDirection: 'row',
    borderRadius: 15,
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
    borderColor: Colors.border,
  },
  absoluteContainer: {
    marginVertical: 15,
    marginBottom: Platform.OS == 'ios' ? 30 : 10,
  },
});

export default ProductOrder;
