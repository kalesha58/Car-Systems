import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useAuthStore} from '@state/authStore';
import {
  confirmOrder,
  getOrderById,
  sendLiveOrderUpdates,
} from '@service/orderService';
import {getDealerOrderById} from '@service/dealerService';
import {Colors, Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import LiveHeader from '@features/map/LiveHeader';
import LiveMap from '@features/map/LiveMap';
import DeliveryDetails from '@features/map/DeliveryDetails';
import OrderSummary from '@features/map/OrderSummary';
import OrderWorkflow from '@features/map/OrderWorkflow';
import {useRoute} from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import CustomButton from '@components/ui/CustomButton';
import {hocStyles} from '@styles/GlobalStyles';
import {IOrderData, ILocation} from '../../types/order/IOrder';

const DeliveryMap = () => {
  const user = useAuthStore(state => state.user);
  const route = useRoute();
  const orderDetails = route?.params as IOrderData | undefined;
  
  // Initialize with order data from navigation params
  const [orderData, setOrderData] = useState<IOrderData | null>(orderDetails || null);
  const [loading, setLoading] = useState<boolean>(!orderDetails);
  const [myLocation, setMyLocation] = useState<ILocation | null>(null);
  const {setCurrentOrder} = useAuthStore();

  const fetchOrderDetails = async () => {
    try {
      const orderId = orderDetails?.id || (orderDetails as any)?._id;
      if (orderId) {
        // Check if user is a dealer and use appropriate endpoint
        const isDealer = user?.role === 'dealer' || 
          (Array.isArray(user?.role) && user?.role.includes('dealer'));
        
        const data = isDealer 
          ? await getDealerOrderById(orderId)
          : await getOrderById(orderId);
        
        // Update orderData if we got fresh data from API
        if (data) {
          setOrderData(data);
        } else if (!orderData && orderDetails) {
          // Fallback: use params data if API returns null
          setOrderData(orderDetails);
        }
      } else if (orderDetails && !orderData) {
        // No orderId but we have orderDetails, use it
        setOrderData(orderDetails);
      }
    } catch (error) {
      // Error handling - order fetch failed
      // Fallback: keep using params data if API fails
      if (!orderData && orderDetails) {
        setOrderData(orderDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setMyLocation({latitude, longitude});
      },
      () => {
        // Error handling - location fetch failed
      },
      {enableHighAccuracy: true, distanceFilter: 200},
    );

    return () => Geolocation.clearWatch(watchId);
  }, []);

  const acceptOrder = async () => {
    if (!orderData) {
      return;
    }
    try {
      const orderId = orderData.id || (orderData as any)._id;
      if (!orderId) {
        Alert.alert('Error', 'Order ID not found');
        return;
      }
      const data = await confirmOrder(orderId, myLocation);
      if (data) {
        setCurrentOrder(data);
        setOrderData(data);
        Alert.alert('Order Accepted', 'Grab your package');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
    } finally {
      fetchOrderDetails();
    }
  };

  const orderPickedUp = async () => {
    if (!orderData || !myLocation) {
      return;
    }
    try {
      const orderId = orderData.id || (orderData as any)._id;
      if (!orderId) {
        Alert.alert('Error', 'Order ID not found');
        return;
      }
      const data = await sendLiveOrderUpdates(orderId, myLocation, 'OUT_FOR_DELIVERY');
      if (data) {
        setCurrentOrder(data);
        setOrderData(data);
        Alert.alert('Success', "Let's deliver it as soon as possible");
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      fetchOrderDetails();
    }
  };

  const orderDelivered = async () => {
    if (!orderData || !myLocation) {
      return;
    }
    try {
      const orderId = orderData.id || (orderData as any)._id;
      if (!orderId) {
        Alert.alert('Error', 'Order ID not found');
        return;
      }
      const data = await sendLiveOrderUpdates(orderId, myLocation, 'DELIVERED');
      if (data) {
        setCurrentOrder(null);
        setOrderData(data);
        Alert.alert('Success', 'Woohoo! You made it🥳');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark order as delivered');
    } finally {
      fetchOrderDetails();
    }
  };

  const getStatusMessage = (): string => {
    if (!orderData) {
      return 'Start this order';
    }

    const normalizedStatus = orderData.status?.toUpperCase() || '';
    const isAssignedDeliveryPartner =
      orderData.deliveryPartner?._id === user?._id;

    if (isAssignedDeliveryPartner) {
      if (normalizedStatus === 'ORDER_CONFIRMED') {
        return 'Grab your order';
      } else if (normalizedStatus === 'OUT_FOR_DELIVERY') {
        return 'Complete your order';
      } else if (normalizedStatus === 'DELIVERED') {
        return 'Your milestone';
      }
    } else if (
      !isAssignedDeliveryPartner &&
      normalizedStatus !== 'ORDER_PLACED' &&
      normalizedStatus !== 'PAYMENT_CONFIRMED'
    ) {
      return 'You missed it!';
    }

    return 'Start this order';
  };

  const message = getStatusMessage();

  useEffect(() => {
    async function sendLiveUpdates() {
      if (
        orderData &&
        myLocation &&
        orderData.deliveryPartner?._id === user?._id
      ) {
        const normalizedStatus = orderData.status?.toUpperCase() || '';
        if (
          normalizedStatus !== 'DELIVERED' &&
          normalizedStatus !== 'CANCELLED_BY_USER' &&
          normalizedStatus !== 'CANCELLED_BY_DEALER'
        ) {
          try {
            const orderId = orderData.id || (orderData as any)._id;
            if (orderId) {
              await sendLiveOrderUpdates(orderId, myLocation, orderData.status);
            }
          } catch (error) {
            // Error handling - update failed
          }
        }
      }
    }
    sendLiveUpdates();
  }, [myLocation, orderData, user?._id]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <ActivityIndicator color="#000" size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LiveHeader
        type="Delivery"
        title={message}
        secondTitle="Delivery in 10 minutes"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <LiveMap
          deliveryPersonLocation={
            orderData?.deliveryPersonLocation || myLocation
          }
          deliveryLocation={orderData?.deliveryLocation || null}
          hasAccepted={
            orderData?.deliveryPartner?._id === user?._id &&
            (orderData?.status?.toUpperCase() === 'ORDER_CONFIRMED' ||
              orderData?.status === 'confirmed')
          }
          hasPickedUp={
            orderData?.status?.toUpperCase() === 'OUT_FOR_DELIVERY' ||
            orderData?.status === 'arriving'
          }
          pickupLocation={orderData?.pickupLocation || null}
        />

        <OrderWorkflow status={orderData?.status} timeline={orderData?.timeline} />

        <DeliveryDetails details={orderData?.customer} />
        <OrderSummary order={orderData} />

        <View style={styles.flexRow}>
          <View style={styles.iconContainer}>
            <Icon
              name="cards-heart-outline"
              color={Colors.disabled}
              size={RFValue(20)}
            />
          </View>

          <View style={{width: '82%'}}>
            <CustomText variant="h7" fontFamily={Fonts.SemiBold}>
              Do you like our app?
            </CustomText>
            <CustomText variant="h9" fontFamily={Fonts.Medium}>
              Hit Like and subscribe button! If you are enjoying comment your
              excitement
            </CustomText>
          </View>
        </View>

        <CustomText
          fontFamily={Fonts.SemiBold}
          variant="h6"
          style={{opacity: 0.6, marginTop: 20}}>
         Car Connect
        </CustomText>
      </ScrollView>

      {orderData &&
        orderData.status?.toUpperCase() !== 'DELIVERED' &&
        orderData.status?.toUpperCase() !== 'CANCELLED_BY_USER' &&
        orderData.status?.toUpperCase() !== 'CANCELLED_BY_DEALER' && (
          <View style={[hocStyles.cartContainer, styles.btnContainer]}>
            {(orderData.status?.toUpperCase() === 'ORDER_PLACED' ||
              orderData.status?.toUpperCase() === 'PAYMENT_CONFIRMED' ||
              orderData.status === 'available') && (
              <CustomButton
                disabled={false}
                title="Accept Order"
                onPress={acceptOrder}
                loading={false}
              />
            )}
            {(orderData.status?.toUpperCase() === 'ORDER_CONFIRMED' ||
              orderData.status === 'confirmed') &&
              orderData.deliveryPartner?._id === user?._id && (
                <CustomButton
                  disabled={false}
                  title="Order Picked Up"
                  onPress={orderPickedUp}
                  loading={false}
                />
              )}

            {(orderData.status?.toUpperCase() === 'OUT_FOR_DELIVERY' ||
              orderData.status === 'arriving') &&
              orderData.deliveryPartner?._id === user?._id && (
                <CustomButton
                  disabled={false}
                  title="Delivered"
                  onPress={orderDelivered}
                  loading={false}
                />
              )}
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 150,
    backgroundColor: Colors.backgroundSecondary,
    padding: 15,
  },
  btnContainer: {
    padding: 10,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    borderRadius: 15,
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 0.7,
    borderColor: Colors.border,
  },
  iconContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 100,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DeliveryMap;
