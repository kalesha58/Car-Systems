import {View, Text, StyleSheet, Image} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import BillDetails from '@features/order/BillDetails';

const OrderSummary: FC<{order: any}> = ({order}) => {
  const totalPrice =
    order?.items?.reduce(
      (total: number, orderItem: any) => {
        // Handle both old format (item.item.price) and new format (item.price)
        const price = orderItem.price || orderItem.item?.price || 0;
        const quantity = orderItem.quantity || orderItem.count || 0;
        return total + price * quantity;
      },
      0,
    ) || order?.totalAmount || 0;

  return (
    <View style={styles.container}>
      <View style={styles.flexRow}>
        <View style={styles.iconContainer}>
          <Icon
            name="shopping-outline"
            color={Colors.disabled}
            size={RFValue(20)}
          />
        </View>
        <View>
          <CustomText variant="h7" fontFamily={Fonts.SemiBold}>
            Order summary
          </CustomText>
          <CustomText variant="h9" fontFamily={Fonts.Medium}>
            Order ID - #{order?.orderNumber || order?.orderId}
          </CustomText>
        </View>
      </View>

      {order?.items?.map((item: any, index: number) => {
        // Handle both old format (item.item) and new format (item directly)
        const itemName = item.name || item.item?.name || 'Item';
        const itemPrice = item.price || item.item?.price || 0;
        const quantity = item.quantity || item.count || 0;
        const itemImage = item.image || item.item?.image;
        const itemQuantity = item.quantity || item.item?.quantity || '';

        return (
          <View style={styles.flexRow} key={index}>
            {itemImage && (
              <View style={styles.imgContainer}>
                <Image source={{uri: itemImage}} style={styles.img} />
              </View>
            )}
            <View style={{width: itemImage ? '55%' : '75%'}}>
              <CustomText
                numberOfLines={2}
                variant="h8"
                fontFamily={Fonts.Medium}>
                {itemName}
              </CustomText>
              {itemQuantity && <CustomText variant="h9">{itemQuantity}</CustomText>}
            </View>

            <View style={{width: '20%', alignItems: 'flex-end'}}>
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={{alignSelf: 'flex-end', marginTop: 4}}>
                ₹{itemPrice * quantity}
              </CustomText>
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={{alignSelf: 'flex-end', marginTop: 4}}>
                {quantity}x
              </CustomText>
            </View>
          </View>
        );
      })}

      <BillDetails totalItemPrice={totalPrice} />
    </View>
  );
};

const styles = StyleSheet.create({
  img: {
    width: 40,
    height: 40,
  },
  imgContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 10,
    borderRadius: 15,
    width: '17%',
  },
  container: {
    width: '100%',
    borderRadius: 15,
    marginVertical: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  iconContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 100,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderBottomWidth: 0.7,
    borderColor: Colors.border,
  },
});

export default OrderSummary;
