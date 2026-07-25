import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BottomSheet } from '@components/bottomSheet';
import { useColors } from '@hooks/useColors';
import type { CartPricingResult } from '@utils/cartPricing';
import { lightHaptic } from '@utils/haptics';

type Props = {
  visible: boolean;
  onClose: () => void;
  pricing: CartPricingResult;
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function PriceDetailsSheet({ visible, onClose, pricing }: Props) {
  const colors = useColors();
  const {
    mrpSubtotal,
    saleSubtotal,
    productDiscount,
    couponDiscount,
    shipping,
    payable,
    amountSaved,
    couponCode,
  } = pricing;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      presentation="panel"
      maxHeightRatio={0.7}
      contentStyle={styles.sheetContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Price Details</Text>
        <Pressable
          style={styles.closeBtn}
          onPress={() => {
            lightHaptic();
            onClose();
          }}
          hitSlop={8}
        >
          <Feather name="x" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Original price (MRP)</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{formatInr(mrpSubtotal)}</Text>
        </View>

        {productDiscount > 0 ? (
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Product discount</Text>
            <Text style={styles.discountValue}>− {formatInr(productDiscount)}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Price after discount</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{formatInr(saleSubtotal)}</Text>
        </View>

        {couponDiscount > 0 ? (
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Coupon{couponCode ? ` (${couponCode})` : ''}
            </Text>
            <Text style={styles.discountValue}>− {formatInr(couponDiscount)}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Shipping</Text>
          {shipping <= 0 ? (
            <Text style={styles.freeValue}>Free</Text>
          ) : (
            <Text style={[styles.value, { color: colors.textPrimary }]}>{formatInr(shipping)}</Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total payable</Text>
          <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{formatInr(payable)}</Text>
        </View>

        {amountSaved > 0 ? (
          <View style={styles.savedBanner}>
            <Feather name="check-circle" size={16} color="#059669" />
            <Text style={styles.savedText}>
              You saved {formatInr(amountSaved)} on this order
            </Text>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  discountValue: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#10B981',
  },
  freeValue: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#10B981',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  savedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#059669',
  },
});
