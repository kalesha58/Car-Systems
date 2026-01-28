import {View, Text, StyleSheet} from 'react-native';
import React, {FC, useMemo} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {useCartStore} from '@state/cartStore';
import {useTheme} from '@hooks/useTheme';

// Shared layout styles that don't depend on theme
const sharedStyles = StyleSheet.create({
  flexRowBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});

const ReportItem: FC<{
  iconName: string;
  underline?: boolean;
  title: string;
  price: number;
  isDiscount?: boolean;
}> = ({iconName, underline, title, price, isDiscount}) => {
  const {colors} = useTheme();
  return (
    <View style={[sharedStyles.flexRowBetween, {marginBottom: 10}]}>
      <View style={sharedStyles.flexRow}>
        <Icon
          name={iconName}
          style={{opacity: 0.7}}
          size={RFValue(12)}
          color={isDiscount ? colors.secondary : colors.text}
        />
        <CustomText
          style={{
            textDecorationLine: underline ? 'underline' : 'none',
            textDecorationStyle: 'dashed',
            ...(isDiscount && {color: colors.secondary}),
          }}
          variant="h8">
          {title}
        </CustomText>
      </View>
      <CustomText
        variant="h8"
        style={isDiscount ? {color: colors.secondary} : undefined}>
        {isDiscount ? '-' : ''}₹{price}
      </CustomText>
    </View>
  );
};

const BillDetails: FC<{totalItemPrice: number; codCharge?: number}> = ({totalItemPrice, codCharge = 0}) => {
  const {selectedCoupon, getCouponDiscount} = useCartStore();
  const {colors} = useTheme();
  const deliveryCharge = 29;
  const handlingCharge = 2;
  const otherCharges = deliveryCharge + handlingCharge;
  
  const couponDiscount = getCouponDiscount(totalItemPrice);
  const subtotal = totalItemPrice;
  const totalAfterDiscount = subtotal - couponDiscount;
  const grandTotal = totalAfterDiscount + otherCharges + codCharge;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 15,
      marginVertical: 15,
    },
    text: {
      marginHorizontal: 10,
      marginTop: 15,
    },
    billContainer: {
      padding: 10,
      paddingBottom: 0,
      borderBottomColor: colors.border,
      borderBottomWidth: 0.7,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <CustomText style={styles.text} fontFamily={Fonts.SemiBold}>
        Bill Details
      </CustomText>

      <View style={styles.billContainer}>
        <ReportItem
          iconName="article"
          title="Items total"
          price={totalItemPrice}
        />
        {selectedCoupon && couponDiscount > 0 && (
          <ReportItem
            iconName="local-offer"
            title={`Coupon Discount (${selectedCoupon.code})`}
            price={couponDiscount}
            isDiscount={true}
          />
        )}
        <ReportItem iconName="pedal-bike" title="Delivery charge" price={deliveryCharge} />
        <ReportItem iconName="shopping-bag" title="Handling charge" price={handlingCharge} />
        {codCharge > 0 && (
          <ReportItem iconName="cash" title="COD charge" price={codCharge} />
        )}
      </View>

      <View style={[sharedStyles.flexRowBetween, {marginBottom: 15}]}>
        <CustomText
          variant="h7"
          style={styles.text}
          fontFamily={Fonts.SemiBold}>
          Grand Total
        </CustomText>
        <CustomText style={styles.text} fontFamily={Fonts.SemiBold}>
          ₹{grandTotal}
        </CustomText>
      </View>
      
    </View>
  );
};

export default BillDetails;
