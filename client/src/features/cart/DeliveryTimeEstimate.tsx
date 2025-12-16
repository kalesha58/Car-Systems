import {View, StyleSheet} from 'react-native';
import React, {FC, useState, useEffect} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {useCartStore} from '@state/cartStore';
import {useTheme} from '@hooks/useTheme';
import {IAddress} from '../../types/address/IAddress';

interface DeliveryTimeEstimateProps {
  selectedAddress?: IAddress | null;
  dealerLocation?: {
    latitude: number;
    longitude: number;
  };
}

const DeliveryTimeEstimate: FC<DeliveryTimeEstimateProps> = ({
  selectedAddress,
  dealerLocation,
}) => {
  const {colors} = useTheme();
  const {cart} = useCartStore();
  const [deliveryTime, setDeliveryTime] = useState<{
    minutes: number;
    timeSlot?: string;
    distance?: number;
  }>({minutes: 12});

  useEffect(() => {
    calculateDeliveryTime();
  }, [selectedAddress, dealerLocation, cart]);

  const calculateDeliveryTime = async () => {
    // Base delivery time
    let baseMinutes = 12;

    // Adjust based on cart items count
    const itemCount = cart.reduce((sum, item) => sum + item.count, 0);
    if (itemCount > 5) {
      baseMinutes += 5; // Extra time for large orders
    }

    // Adjust based on time of day
    const hour = new Date().getHours();
    if (hour >= 17 && hour <= 20) {
      baseMinutes += 8; // Rush hour
    } else if (hour >= 12 && hour <= 14) {
      baseMinutes += 5; // Lunch time
    }

    // If we have address and dealer location, calculate distance-based time
    if (selectedAddress?.latitude && dealerLocation) {
      const distance = calculateDistance(
        selectedAddress.latitude,
        selectedAddress.longitude,
        dealerLocation.latitude,
        dealerLocation.longitude,
      );

      // Estimate: 1km = ~2 minutes, minimum 10 minutes
      const distanceMinutes = Math.max(10, Math.round(distance * 2));
      baseMinutes = Math.max(baseMinutes, distanceMinutes);
    }

    // Round to nearest 5 minutes
    const roundedMinutes = Math.ceil(baseMinutes / 5) * 5;

    // Calculate time slot
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + roundedMinutes * 60000);
    const timeSlot = formatTimeSlot(deliveryDate);

    setDeliveryTime({
      minutes: roundedMinutes,
      timeSlot,
      distance: selectedAddress?.latitude && dealerLocation
        ? calculateDistance(
            selectedAddress.latitude,
            selectedAddress.longitude,
            dealerLocation.latitude,
            dealerLocation.longitude,
          )
        : undefined,
    });
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const formatTimeSlot = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');

    // Round to nearest 15 minutes for slot
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const slotEnd = new Date(date);
    slotEnd.setMinutes(roundedMinutes + 15);

    const endHours = slotEnd.getHours();
    const endMinutes = slotEnd.getMinutes();
    const endPeriod = endHours >= 12 ? 'PM' : 'AM';
    const endDisplayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
    const endDisplayMinutes = endMinutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes} ${period} - ${endDisplayHours}:${endDisplayMinutes} ${endPeriod}`;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.count, 0);

  return (
    <View style={[styles.container, {backgroundColor: colors.cardBackground}]}>
      <View style={styles.flexRow}>
        <View style={[styles.iconContainer, {backgroundColor: colors.secondary + '20'}]}>
          <Icon name="clock-outline" size={RFValue(24)} color={colors.secondary} />
        </View>
        <View style={styles.content}>
          <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
            Delivery in {deliveryTime.minutes} minutes
          </CustomText>
          {deliveryTime.timeSlot && (
            <CustomText variant="h9" style={{opacity: 0.7, marginTop: 2}}>
              Expected: {deliveryTime.timeSlot}
            </CustomText>
          )}
          <CustomText variant="h9" style={{opacity: 0.6, marginTop: 4}}>
            Shipment of {totalItems} {totalItems === 1 ? 'item' : 'items'}
            {deliveryTime.distance && ` • ${deliveryTime.distance.toFixed(1)} km away`}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});

export default DeliveryTimeEstimate;

