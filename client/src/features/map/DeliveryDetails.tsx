import {View, Text, StyleSheet} from 'react-native';
import React, {FC, useMemo} from 'react';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {IShippingAddress} from '../../types/order/IOrder';

interface IDeliveryDetailsProps {
  details?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  shippingAddress?: IShippingAddress;
  deliveryLocation?: {
    address?: string;
  };
  dealer?: {
    id: string;
    name: string;
    businessName: string;
    phone: string;
    address?: string;
  };
}

const DeliveryDetails: FC<IDeliveryDetailsProps> = ({
  details,
  shippingAddress,
  deliveryLocation,
  dealer,
}) => {
  const {colors} = useTheme();

  const formatAddress = (): string => {
    if (deliveryLocation?.address) {
      return deliveryLocation.address;
    }

    if (details?.address) {
      return details.address;
    }

    if (shippingAddress) {
      const parts = [
        shippingAddress.street,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.zipCode,
      ].filter(Boolean);
      return parts.join(', ') || 'Address not available';
    }

    return 'Address not available';
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '100%',
      borderRadius: 15,
      marginVertical: 15,
      paddingVertical: 10,
      backgroundColor: colors.cardBackground,
    },
    flexRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderBottomWidth: 0.7,
      borderColor: colors.border,
    },
    flexRow2: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
    },
    iconContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 100,
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.flexRow}>
        <View style={styles.iconContainer}>
          <Icon name="bike-fast" color={colors.disabled} size={RFValue(20)} />
        </View>
        <View>
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Your delivery details
          </CustomText>
          <CustomText variant="h8" fontFamily={Fonts.Medium}>
            Details of your current order
          </CustomText>
        </View>
      </View>

      <View style={styles.flexRow2}>
        <View style={styles.iconContainer}>
          <Icon
            name="map-marker-outline"
            color={colors.disabled}
            size={RFValue(20)}
          />
        </View>
        <View style={{width: '80%'}}>
          <CustomText variant="h8" fontFamily={Fonts.Medium}>
            Delivery at Home
          </CustomText>
          <CustomText variant="h8" numberOfLines={3} fontFamily={Fonts.Regular}>
            {formatAddress()}
          </CustomText>
        </View>
      </View>

      <View style={styles.flexRow2}>
        <View style={styles.iconContainer}>
          <Icon
            name="phone-outline"
            color={colors.disabled}
            size={RFValue(20)}
          />
        </View>
        <View style={{width: '80%'}}>
          <CustomText variant="h8" fontFamily={Fonts.Medium}>
            {details?.name || dealer?.businessName || dealer?.name || 'Anonymous'}{' '}
            {details?.phone || dealer?.phone || 'XXXXXXXX'}
          </CustomText>
          <CustomText variant="h8" numberOfLines={2} fontFamily={Fonts.Regular}>
            {dealer && !details?.name
              ? 'Dealer contact no.'
              : "Receiver's contact no."}
          </CustomText>
        </View>
      </View>

      {dealer && (
        <View style={styles.flexRow2}>
          <View style={styles.iconContainer}>
            <Icon
              name="store"
              color={colors.disabled}
              size={RFValue(20)}
            />
          </View>
          <View style={{width: '80%'}}>
            <CustomText variant="h8" fontFamily={Fonts.Medium}>
              {dealer.businessName || dealer.name} {dealer.phone}
            </CustomText>
            <CustomText variant="h8" numberOfLines={2} fontFamily={Fonts.Regular}>
              Dealer for this order
            </CustomText>
          </View>
        </View>
      )}
    </View>
  );
};

export default DeliveryDetails;
