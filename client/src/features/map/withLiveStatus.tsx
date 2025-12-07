import CustomText from '@components/ui/CustomText';
import {useNavigationState} from '@react-navigation/native';
import {SOCKET_URL} from '@service/config';
import {getOrderById} from '@service/orderService';
import {useAuthStore} from '@state/authStore';
import {hocStyles} from '@styles/GlobalStyles';
import {Colors, Fonts} from '@utils/Constants';
import {navigate} from '@utils/NavigationUtils';
import {FC, useEffect, useRef} from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {io, Socket} from 'socket.io-client';

const withLiveStatus = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
): FC<P> => {
  const WithLiveStatusComponent: FC<P> = props => {
    const {currentOrder, setCurrentOrder} = useAuthStore();
    const routeName = useNavigationState(
      state => state.routes[state.index]?.name,
    );
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

    return (
      <View style={styles.container}>
        <WrappedComponent {...props} />

        {currentOrder && routeName === 'Home' && (
          <View
            style={[
              hocStyles.cartContainer,
              {flexDirection: 'row', alignItems: 'center'},
            ]}>
            <View style={styles.flexRow}>
              <View style={styles.img}>
                <Image
                  source={require('@assets/icons/bucket.png')}
                  style={{width: 20, height: 20}}
                />
              </View>

              <View style={{width: '68%'}}>
                <CustomText variant="h7" fontFamily={Fonts.SemiBold}>
                  Order is {currentOrder?.status}
                </CustomText>
                <CustomText variant="h9" fontFamily={Fonts.Medium}>
                  {currentOrder?.items?.[0]?.name
                    ? currentOrder.items[0].name +
                        (currentOrder.items.length > 1
                          ? ` and ${currentOrder.items.length - 1}+ items`
                          : '')
                    : 'Order items'}
                </CustomText>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigate('LiveTracking')}
              style={styles.btn}>
              <CustomText
                fontFamily={Fonts.Medium}
                variant="h8"
                style={{
                  color: Colors.secondary,
                }}>
                View
              </CustomText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return WithLiveStatusComponent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 15,
    marginBottom: 15,
    paddingVertical: 10,
    padding: 10,
  },
  img: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 100,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 0.7,
    borderColor: Colors.secondary,
    borderRadius: 5,
  },
});

export default withLiveStatus;
