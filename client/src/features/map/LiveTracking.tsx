import {View, Text, StyleSheet, ScrollView} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {useAuthStore} from '@state/authStore';
import {getOrderById} from '@service/orderService';
import {SOCKET_URL} from '@service/config';
import {Colors, Fonts} from '@utils/Constants';
import LiveHeader from './LiveHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import OrderSummary from './OrderSummary';
import DeliveryDetails from './DeliveryDetails';
import LiveMap from './LiveMap';
import {getOrderStatusDisplay, isOrderAccepted, isOrderPickedUp} from '@utils/orderStatusUtils';
import {io, Socket} from 'socket.io-client';

const LiveTracking = () => {
  const {currentOrder, setCurrentOrder} = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  const fetchOrderDetails = async () => {
    if (!currentOrder?._id && !currentOrder?.id) {
      return;
    }

    try {
      const orderId = currentOrder._id || currentOrder.id;
      const data = await getOrderById(orderId);
      if (data) {
        setCurrentOrder(data);
      }
    } catch (error) {
      // Error handling - no fallback per rules
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  useEffect(() => {
    if (currentOrder) {
      const orderId = currentOrder._id || currentOrder.id;
      if (!orderId) {
        return;
      }

      const socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current = socketInstance;

      socketInstance.emit('joinRoom', orderId);

      const handleLiveTrackingUpdates = () => {
        fetchOrderDetails();
      };

      const handleOrderConfirmed = () => {
        fetchOrderDetails();
      };

      socketInstance.on('liveTrackingUpdates', handleLiveTrackingUpdates);
      socketInstance.on('orderConfirmed', handleOrderConfirmed);

      return () => {
        socketInstance.off('liveTrackingUpdates', handleLiveTrackingUpdates);
        socketInstance.off('orderConfirmed', handleOrderConfirmed);
        socketInstance.disconnect();
        socketRef.current = null;
      };
    }
  }, [currentOrder?._id || currentOrder?.id]);

  const statusDisplay = currentOrder?.status
    ? getOrderStatusDisplay(currentOrder.status)
    : {message: 'Packing your order', timeEstimate: 'Arriving in 10 minutes'};

  const msg = statusDisplay.message;
  const time = statusDisplay.timeEstimate;

  return (
    <View style={styles.container}>
      <LiveHeader type="Customer" title={msg} secondTitle={time} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <LiveMap
          deliveryLocation={currentOrder?.deliveryLocation}
          pickupLocation={currentOrder?.pickupLocation}
          deliveryPersonLocation={currentOrder?.deliveryPersonLocation}
          hasAccepted={isOrderAccepted(currentOrder?.status || '')}
          hasPickedUp={isOrderPickedUp(currentOrder?.status || '')}
        />

        <View style={styles.flexRow}>
          <View style={styles.iconContainer}>
            <Icon
              name={currentOrder?.deliveryPartner ? 'phone' : 'shopping'}
              color={Colors.disabled}
              size={RFValue(20)}
            />
          </View>
          <View style={{width: '82%'}}>
            <CustomText
              numberOfLines={1}
              variant="h7"
              fontFamily={Fonts.SemiBold}>
              {currentOrder?.deliveryPartner?.name ||
                currentOrder?.dealerId ||
                'We will soon assign delivery partner'}
            </CustomText>

            {currentOrder?.deliveryPartner?.phone && (
              <CustomText variant="h7" fontFamily={Fonts.Medium}>
                {currentOrder.deliveryPartner.phone}
              </CustomText>
            )}

            <CustomText variant="h9" fontFamily={Fonts.Medium}>
              {currentOrder?.deliveryPartner
                ? 'For Delivery instructions you can contact here'
                : msg}
            </CustomText>
          </View>
        </View>

        <DeliveryDetails
          details={currentOrder?.customer}
          shippingAddress={currentOrder?.shippingAddress}
          deliveryLocation={currentOrder?.deliveryLocation}
        />

        <OrderSummary order={currentOrder} />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  scrollContent: {
    paddingBottom: 150,
    backgroundColor: Colors.backgroundSecondary,
    padding: 15,
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

export default LiveTracking;
