import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC} from 'react';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {formatISOToCustom} from '@utils/DateUtils';
import {useAuthStore} from '@state/authStore';
import {navigate} from '@utils/NavigationUtils';
import {IOrderData} from '../../types/order/IOrder';

const ProfileOrderItem: FC<{item: IOrderData | any; index: number}> = ({
  item,
  index,
}) => {
  const {setCurrentOrder} = useAuthStore();

  const handlePress = () => {
    // Convert old format to new format if needed
    const orderData: IOrderData = {
      id: item.id || item._id || item.orderId,
      orderNumber: item.orderNumber || item.orderId,
      userId: item.userId || '',
      dealerId: item.dealerId,
      items: item.items || [],
      subtotal: item.subtotal || 0,
      tax: item.tax || 0,
      shipping: item.shipping || 0,
      totalAmount: item.totalAmount || item.totalPrice || 0,
      status: item.status || 'ORDER_PLACED',
      paymentStatus: item.paymentStatus || 'pending',
      paymentMethod: item.paymentMethod || 'cash_on_delivery',
      shippingAddress: item.shippingAddress || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      billingAddress: item.billingAddress || item.shippingAddress || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      tracking: item.tracking,
      timeline: item.timeline || [],
      cancellationReason: item.cancellationReason,
      documents: item.documents,
      returnRequest: item.returnRequest,
      expectedDeliveryDate: item.expectedDeliveryDate,
      deliveryLocation: item.deliveryLocation,
      pickupLocation: item.pickupLocation,
      deliveryPersonLocation: item.deliveryPersonLocation,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      deliveryPartner: item.deliveryPartner,
      customer: item.customer,
    };

    setCurrentOrder(orderData);
    navigate('LiveTracking');
  };

  const orderNumber = item.orderNumber || item.orderId;
  const totalPrice = item.totalAmount || item.totalPrice || 0;
  const status = item.status || 'ORDER_PLACED';

  return (
    <TouchableOpacity
      style={[styles.container, {borderTopWidth: index === 0 ? 0.7 : 0}]}
      onPress={handlePress}
      activeOpacity={0.7}>
      <View style={styles.flexRowBetween}>
        <CustomText variant="h8" fontFamily={Fonts.Medium}>
          #{orderNumber}
        </CustomText>
        <CustomText
          variant="h8"
          fontFamily={Fonts.Medium}
          style={{textTransform: 'capitalize'}}>
          {status.replace(/_/g, ' ').toLowerCase()}
        </CustomText>
      </View>

      <View style={styles.flexRowBetween}>
        <View style={{width: '50%'}}>
          {item?.items?.slice(0, 2).map((orderItem: any, idx: number) => {
            const itemName =
              orderItem.name || orderItem.item?.name || 'Item';
            const quantity = orderItem.quantity || orderItem.count || 1;
            return (
              <CustomText variant="h8" numberOfLines={1} key={idx}>
                {quantity}x {itemName}
              </CustomText>
            );
          })}
          {item?.items && item.items.length > 2 && (
            <CustomText variant="h9" style={{opacity: 0.6}}>
              +{item.items.length - 2} more items
            </CustomText>
          )}
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{marginTop: 10}}>
            ₹{totalPrice}
          </CustomText>
          <CustomText variant="h9">
            {formatISOToCustom(item.createdAt)}
          </CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.7,
    paddingVertical: 15,
    opacity: 0.9,
  },
  flexRowBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export default ProfileOrderItem;
