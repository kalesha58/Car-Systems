import CustomText from '@components/ui/CustomText';
import Geolocation from '@react-native-community/geolocation';
import {sendLiveOrderUpdates} from '@service/orderService';
import {useAuthStore} from '@state/authStore';
import {hocStyles} from '@styles/GlobalStyles';
import {Colors, Fonts} from '@utils/Constants';
import {navigate} from '@utils/NavigationUtils';
import {FC, useEffect, useState, useMemo} from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {ILocation, IOrderData} from '../../types/order/IOrder';
import {useNavigationState} from '@react-navigation/native';
import {useTheme} from '@hooks/useTheme';

const withLiveOrder = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
): FC<P> => {
  const WithLiveOrder: FC<P> = props => {
    const {currentOrder, user} = useAuthStore();
    const {colors} = useTheme();
    const [myLocation, setMyLocation] = useState<ILocation | null>(null);
    const routeName = useNavigationState(
      state => state.routes[state.index]?.name,
    );

    const dynamicStyles = useMemo(
      () =>
        StyleSheet.create({
          img: {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 100,
            padding: 10,
            justifyContent: 'center',
            alignItems: 'center',
          },
        }),
      [colors.backgroundSecondary],
    );

    useEffect(() => {
      if (currentOrder) {
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
      }
    }, [currentOrder]);

    useEffect(() => {
      async function sendLiveUpdates() {
        if (
          currentOrder &&
          myLocation &&
          currentOrder.deliveryPartner?._id === user?._id &&
          currentOrder.status !== 'DELIVERED' &&
          currentOrder.status !== 'CANCELLED_BY_USER' &&
          currentOrder.status !== 'CANCELLED_BY_DEALER'
        ) {
          try {
            const orderId = currentOrder.id || (currentOrder as any)._id;
            if (orderId) {
              await sendLiveOrderUpdates(orderId, myLocation, currentOrder.status);
            }
          } catch (error) {
            // Error handling - update failed
          }
        }
      }
      sendLiveUpdates();
    }, [myLocation, currentOrder, user?._id]);

    return (
      <View style={styles.container}>
        <WrappedComponent {...props} />

        {currentOrder &&
          user &&
          (user.role === 'dealer' || (Array.isArray(user.role) && user.role.includes('dealer'))) &&
          (routeName === 'Home' ||
            routeName === 'DealerDashboard' ||
            routeName === 'Orders' ||
            routeName === 'Inventory') && (
            <View
              style={[
                hocStyles.cartContainer,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  backgroundColor: colors.cardBackground || colors.background,
                },
              ]}>
              <View style={styles.flexRow}>
                <View style={dynamicStyles.img}>
                  <Image
                    source={require('../../assets/icons/bucket.png')}
                    style={{width: 20, height: 20}}
                  />
                </View>
                <View style={{width: '62%'}}>
                  <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
                    #{currentOrder?.orderNumber || currentOrder?.id}
                  </CustomText>
                  <CustomText variant="h9" fontFamily={Fonts.Medium}>
                    {currentOrder?.deliveryLocation?.address ||
                      currentOrder?.pickupLocation?.address ||
                      ''}
                  </CustomText>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    navigate('DeliveryMap', {
                      ...currentOrder,
                    })
                  }
                  style={styles.btn}>
                  <CustomText
                    variant="h8"
                    style={{color: Colors.secondary}}
                    fontFamily={Fonts.Medium}>
                    Continue
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          )}
      </View>
    );
  };

  return WithLiveOrder;
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
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 0.7,
    borderColor: Colors.secondary,
    borderRadius: 5,
  },
});

export default withLiveOrder;
