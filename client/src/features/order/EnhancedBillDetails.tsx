import {View, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import React, {FC, useState, useRef, useEffect} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {useCartStore} from '@state/cartStore';
import {useTheme} from '@hooks/useTheme';

interface EnhancedBillDetailsProps {
  totalItemPrice: number;
  codCharge?: number;
  deliveryCharge?: number;
  handlingCharge?: number;
  showSavings?: boolean;
  freeDeliveryThreshold?: number;
}

const EnhancedBillDetails: FC<EnhancedBillDetailsProps> = ({
  totalItemPrice,
  codCharge = 0,
  deliveryCharge = 29,
  handlingCharge = 2,
  showSavings = true,
  freeDeliveryThreshold = 500,
}) => {
  const {colors} = useTheme();
  const {selectedCoupon, getCouponDiscount, cart} = useCartStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const couponDiscount = getCouponDiscount(totalItemPrice);
  const subtotal = totalItemPrice;
  const totalAfterDiscount = Math.max(0, subtotal - couponDiscount);
  const isFreeDeliveryEligible = subtotal >= freeDeliveryThreshold;
  const actualDeliveryCharge = isFreeDeliveryEligible ? 0 : deliveryCharge;
  const otherCharges = actualDeliveryCharge + handlingCharge;
  const grandTotal = totalAfterDiscount + otherCharges + codCharge;

  const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const savings = couponDiscount;
  const totalSavings = savings + (isFreeDeliveryEligible ? deliveryCharge : 0);
  const deliverySavings = isFreeDeliveryEligible ? deliveryCharge : 0;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const ReportItem: FC<{
    iconName: string;
    title: string;
    price: number;
    isDiscount?: boolean;
    subtitle?: string;
  }> = ({iconName, title, price, isDiscount, subtitle}) => {
    return (
      <View style={[styles.reportItem, {marginBottom: 10}]}>
        <View style={styles.flexRow}>
          <Icon
            name={iconName}
            style={{opacity: 0.7}}
            size={RFValue(14)}
            color={isDiscount ? colors.secondary : colors.text}
          />
          <View style={styles.titleContainer}>
            <CustomText
              style={[
                {
                  color: isDiscount ? colors.secondary : undefined,
                },
                styles.titleText,
              ]}
              variant="h8"
              fontFamily={Fonts.Medium}
              numberOfLines={2}>
              {title}
            </CustomText>
            {subtitle && (
              <CustomText variant="h9" style={{opacity: 0.6, marginTop: 2}} numberOfLines={1}>
                {subtitle}
              </CustomText>
            )}
          </View>
        </View>
        <View style={styles.priceContainer}>
          <CustomText
            variant="h8"
            fontFamily={Fonts.Medium}
            style={[
              isDiscount ? {color: colors.secondary} : undefined,
              styles.priceText,
            ]}>
            {isDiscount && price > 0 ? '-' : ''}₹{Math.abs(price || 0).toFixed(2)}
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.cardBackground}]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}>
        <View style={styles.headerContent}>
          <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
            Bill Details
          </CustomText>
          {totalSavings > 0 && (
            <View style={[styles.savingsBadge, {backgroundColor: colors.secondary + '20'}]}>
              <IconIonicons name="pricetag" size={RFValue(12)} color={colors.secondary} />
              <CustomText
                variant="h9"
                style={{color: colors.secondary, marginLeft: 4}}
                fontFamily={Fonts.SemiBold}>
                Save ₹{totalSavings.toFixed(0)}
              </CustomText>
            </View>
          )}
        </View>
        <Animated.View style={{transform: [{rotate}]}}>
          <IconIonicons
            name="chevron-down"
            size={RFValue(20)}
            color={colors.text}
          />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.billContainer}>
          <ReportItem
            iconName="article"
            title="Items total"
            price={subtotal}
            subtitle={`${cart.length} ${cart.length === 1 ? 'item' : 'items'}`}
          />

          {selectedCoupon && couponDiscount > 0 && (
            <ReportItem
              iconName="local-offer"
              title={`Coupon Discount (${selectedCoupon.code})`}
              price={couponDiscount}
              isDiscount={true}
            />
          )}

          {!isFreeDeliveryEligible && amountForFreeDelivery > 0 && (
            <View style={[styles.freeDeliveryBanner, {backgroundColor: colors.secondary + '10'}]}>
              <IconIonicons name="gift" size={RFValue(16)} color={colors.secondary} />
              <CustomText variant="h9" style={{color: colors.secondary, marginLeft: 6}}>
                Add ₹{amountForFreeDelivery.toFixed(0)} more for free delivery
              </CustomText>
            </View>
          )}

          <ReportItem
            iconName="pedal-bike"
            title="Delivery charge"
            price={isFreeDeliveryEligible ? 0 : deliveryCharge}
            subtitle={isFreeDeliveryEligible ? 'Free delivery applied' : undefined}
          />

          {isFreeDeliveryEligible && deliverySavings > 0 && (
            <ReportItem
              iconName="gift"
              title="Delivery savings"
              price={deliverySavings}
              isDiscount={true}
            />
          )}

          <ReportItem iconName="shopping-bag" title="Handling charge" price={handlingCharge} />

          {codCharge > 0 && (
            <ReportItem iconName="cash" title="COD charge" price={codCharge} />
          )}

          {showSavings && totalSavings > 0 && (
            <View style={[styles.savingsContainer, {borderColor: colors.border}]}>
              <View style={styles.flexRow}>
                <IconIonicons name="checkmark-circle" size={RFValue(16)} color={colors.secondary} />
                <CustomText variant="h8" fontFamily={Fonts.Medium} style={{marginLeft: 6}}>
                  Total Savings
                </CustomText>
              </View>
              <CustomText
                variant="h7"
                fontFamily={Fonts.SemiBold}
                style={{color: colors.secondary}}>
                ₹{totalSavings.toFixed(2)}
              </CustomText>
            </View>
          )}
        </View>
      )}

      <View style={[styles.grandTotalContainer, {borderTopColor: colors.border}]}>
        <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
          Grand Total
        </CustomText>
        <CustomText variant="h5" fontFamily={Fonts.Bold} style={{color: colors.secondary}}>
          ₹{grandTotal.toFixed(2)}
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    marginVertical: 15,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  billContainer: {
    padding: 15,
    paddingTop: 0,
    paddingHorizontal: 15,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 40,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
    paddingRight: 4,
  },
  titleText: {
    flexShrink: 1,
  },
  priceContainer: {
    minWidth: 70,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    textAlign: 'right',
  },
  freeDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  savingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
  },
});

export default EnhancedBillDetails;

