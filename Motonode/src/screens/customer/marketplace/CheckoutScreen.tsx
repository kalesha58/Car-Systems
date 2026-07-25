import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useCart } from '@context/index';
import { useMobileVerificationGate } from '@context/MobileVerificationContext';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { formatCurrency, getProductId } from '@utils/displayMappers';
import { computeCartPricing, type AppliedCoupon } from '@utils/cartPricing';
import { useFocusEffect } from '@react-navigation/native';
import { getSavedAddresses } from '@services/address.service';
import type { IAddress } from '@app-types/address';

export const DEFAULT_SHIPPING_ADDRESS = {
  street: '45, 2nd Cross, Koramangala 3 Block',
  city: 'Bengaluru',
  state: 'Karnataka',
  zipCode: '560034',
  country: 'India',
};

type Props = NativeStackScreenProps<CustomerStackParamList, typeof CustomerStackRoutes.Checkout>;

const CHECKOUT_COUPONS: NonNullable<AppliedCoupon>[] = [
  { code: 'HUB10', type: 'percentage', value: 10 },
  { code: 'MOTONEW', type: 'fixed', value: 200 },
];

// ── Step Progress Bar ────────────────────────────────────────────────────────
function StepBar({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: 'Address' },
    { num: 2, label: 'Payment' },
    { num: 3, label: 'Review' },
  ];
  return (
    <View style={stepStyles.wrap}>
      {steps.map((step, idx) => {
        const done = step.num < current;
        const active = step.num === current;
        return (
          <React.Fragment key={step.num}>
            <View style={stepStyles.item}>
              <View style={[
                stepStyles.circle,
                done && stepStyles.circleDone,
                active && stepStyles.circleActive,
              ]}>
                {done
                  ? <Feather name="check" size={12} color="#fff" />
                  : <Text style={[stepStyles.num, active && stepStyles.numActive]}>{step.num}</Text>
                }
              </View>
              <Text style={[stepStyles.label, active && stepStyles.labelActive]}>{step.label}</Text>
            </View>
            {idx < steps.length - 1 && (
              <View style={[stepStyles.line, done && stepStyles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  item: { alignItems: 'center', gap: 4 },
  circle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: '#CBD5E1', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  circleDone: { backgroundColor: '#E60012', borderColor: '#E60012' },
  circleActive: { borderColor: '#E60012' },
  num: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  numActive: { color: '#E60012' },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  labelActive: { color: '#E60012', fontFamily: 'Inter_700Bold' },
  line: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginBottom: 14, marginHorizontal: 4 },
  lineDone: { backgroundColor: '#E60012' },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export function CheckoutScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { items } = useCart();
  const { runWithMobileCheck } = useMobileVerificationGate();
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon>(route.params?.coupon ?? null);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);

  const pricing = computeCartPricing(items, appliedCoupon);
  const { payable: orderTotal, amountSaved, couponDiscount } = pricing;

  const loadAddresses = useCallback(async () => {
    try {
      const list = await getSavedAddresses();
      setAddresses(list);
      if (list.length > 0) {
        // Prefer default address, else first in list
        const def = list.find(a => a.isDefault) || list[0];
        setSelectedAddress(def);
      }
    } catch (err) {
      console.log('Failed to fetch addresses in checkout:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAddresses();
    }, [loadAddresses])
  );

  useEffect(() => {
    if (route.params?.coupon !== undefined) {
      setAppliedCoupon(route.params.coupon);
    }
  }, [route.params?.coupon]);

  const handleApplyCoupon = () => {
    lightHaptic();
    if (appliedCoupon) {
      setAppliedCoupon(null);
      return;
    }
    const defaultCoupon = CHECKOUT_COUPONS[0];
    const preview = computeCartPricing(items, defaultCoupon);
    if (preview.couponDiscount <= 0) {
      Alert.alert('Coupon', 'This coupon cannot be applied to the current cart.');
      return;
    }
    setAppliedCoupon(defaultCoupon);
    successHaptic();
  };

  const handleContinue = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add items to your cart before checking out.');
      return;
    }
    void runWithMobileCheck(() => {
      lightHaptic();
      navigation.navigate(CustomerStackRoutes.Payment, {
        address: selectedAddress || undefined,
        coupon: appliedCoupon,
      });
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8FAFC' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <ChromeHeader style={styles.header} contentPad={10}>
        <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
          <Feather name="arrow-left" size={20} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Checkout</Text>
        <View style={{ width: 36 }} />
      </ChromeHeader>

      {/* Progress */}
      <View style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <StepBar current={1} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Deliver To */}
        <Text style={styles.sectionLabel}>Deliver To</Text>
        <Pressable style={styles.card} onPress={() => { lightHaptic(); setIsAddressModalVisible(true); }}>
          <View style={styles.addressIconBox}>
            <Feather name={selectedAddress?.addressType === 'home' ? 'home' : selectedAddress?.addressType === 'office' ? 'briefcase' : 'map-pin'} size={18} color="#E60012" />
          </View>
          <View style={{ flex: 1 }}>
            {selectedAddress ? (
              <>
                <View style={styles.addressNameRow}>
                  <Text style={styles.addressName}>{selectedAddress.name}</Text>
                  <View style={styles.homeBadge}>
                    <Text style={styles.homeBadgeText}>{selectedAddress.addressType.toUpperCase()}</Text>
                  </View>
                  {selectedAddress.isDefault && (
                    <View style={[styles.homeBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.homeBadgeText, { color: '#15803D' }]}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
                <Text style={styles.addressLine}>{selectedAddress.fullAddress}</Text>
              </>
            ) : (
              <>
                <View style={styles.addressNameRow}>
                  <Text style={styles.addressName}>Add Delivery Address</Text>
                </View>
                <Text style={styles.addressPhone}>No address selected</Text>
                <Text style={styles.addressLine}>Tap here to select or add an address</Text>
              </>
            )}
          </View>
          <Feather name="chevron-right" size={18} color="#CBD5E1" />
        </Pressable>

        {/* Order Items */}
        <Text style={styles.sectionLabel}>Order Items</Text>
        {items.map((item) => (
          <View key={getProductId(item.product)} style={[styles.card, { marginBottom: 8 }]}>
            <Image
              source={{ uri: item.product.images?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=120&auto=format&fit=crop&q=80' }}
              style={styles.serviceThumb}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{item.product.name}</Text>
              <Text style={styles.serviceIncludes}>{item.product.brand}</Text>
              <Text style={styles.serviceQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.servicePrice}>
              {formatCurrency(item.product.price * item.quantity)}
            </Text>
          </View>
        ))}

        {/* Choose Date & Time */}
        <Text style={styles.sectionLabel}>Choose Date & Time</Text>
        <Pressable style={styles.card} onPress={() => lightHaptic()}>
          <View style={[styles.dateIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="calendar" size={18} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>Tomorrow, 15 May 2026</Text>
            <Text style={styles.timeText}>10:00 AM – 11:00 AM</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#CBD5E1" />
        </Pressable>

        {/* Delivery / Service Location */}
        <Text style={styles.sectionLabel}>Delivery / Service Location</Text>
        <Pressable style={styles.card} onPress={() => lightHaptic()}>
          <View style={[styles.dateIconBox, { backgroundColor: 'rgba(230,0,18,0.08)' }]}>
            <Feather name="home" size={18} color="#E60012" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.addressNameRow}>
              <Text style={styles.serviceName}>Motonode Auto Hub</Text>
              <View style={styles.availBadge}><Text style={styles.availBadgeText}>Available</Text></View>
            </View>
            <Text style={styles.addressLine}>80 Feet Rd, Koramangala 3 Block,{'\n'}Bengaluru, Karnataka 560034</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#CBD5E1" />
        </Pressable>

        {/* Coupon */}
        <Pressable style={styles.couponRow} onPress={handleApplyCoupon}>
          <Feather name="tag" size={15} color="#E60012" />
          <Text style={styles.couponLabel}>
            {appliedCoupon ? `Coupon ${appliedCoupon.code}` : 'Apply Coupon'}
          </Text>
          <View style={{ flex: 1 }} />
          {appliedCoupon ? (
            <>
              <View style={styles.couponCodeBox}>
                <Text style={styles.couponCodeText}>{appliedCoupon.code}</Text>
              </View>
              {couponDiscount > 0 && (
                <Text style={styles.couponSaving}>-{formatCurrency(couponDiscount)}</Text>
              )}
            </>
          ) : (
            <Text style={styles.couponHint}>Tap to apply HUB10</Text>
          )}
          <Feather name="chevron-right" size={16} color="#CBD5E1" />
        </Pressable>
      </ScrollView>

      {/* Sticky Bottom */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad + 10, borderTopColor: '#E2E8F0' }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={styles.totalAmount}>{formatCurrency(orderTotal)}</Text>
            {amountSaved > 0 && (
              <Text style={styles.totalOriginal}>{formatCurrency(pricing.mrpSubtotal)}</Text>
            )}
          </View>
          {amountSaved > 0 && (
            <Text style={styles.savingLabel}>You save ₹{amountSaved.toLocaleString('en-IN')}</Text>
          )}
          <Text style={styles.totalLabel}>Total Amount</Text>
        </View>
        <Pressable style={styles.ctaBtn} onPress={handleContinue}>
          <Text style={styles.ctaBtnText}>Continue to Payment</Text>
        </Pressable>
      </View>

      {/* Address Selection Modal Sheet */}
      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBgPressable} onPress={() => setIsAddressModalVisible(false)} />
          
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Choose Delivery Address</Text>
              <Pressable style={styles.closeBtn} onPress={() => setIsAddressModalVisible(false)}>
                <Feather name="x" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {addresses.map((item) => {
                const isSelected = selectedAddress?._id === item._id;
                const iconName = item.addressType === 'home' ? 'home' : item.addressType === 'office' ? 'briefcase' : 'map-pin';
                
                return (
                  <Pressable
                    key={item._id}
                    style={[
                      styles.addressCard,
                      { borderColor: isSelected ? colors.primary : colors.border }
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setSelectedAddress(item);
                      setIsAddressModalVisible(false);
                    }}
                  >
                    <View style={[styles.addressIconContainer, { backgroundColor: isSelected ? 'rgba(230,0,18,0.08)' : '#F2F2F2' }]}>
                      <Feather name={iconName} size={16} color={isSelected ? colors.primary : colors.textSecondary} />
                    </View>
                    
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.addressNameText, { color: colors.textPrimary }]}>{item.name}</Text>
                        <View style={styles.addressTypeBadge}>
                          <Text style={styles.addressTypeBadgeText}>{item.addressType.toUpperCase()}</Text>
                        </View>
                        {item.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.addressPhoneText, { color: colors.textSecondary }]}>{item.phone}</Text>
                      <Text style={[styles.addressFullText, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.fullAddress}
                      </Text>
                    </View>
                    
                    <View style={[styles.selectCircle, isSelected && styles.selectCircleSelected]}>
                      {isSelected && <View style={styles.selectCircleInner} />}
                    </View>
                  </Pressable>
                );
              })}
              
              <Pressable
                style={[styles.addAddressBtn, { borderColor: colors.primary }]}
                onPress={() => {
                  lightHaptic();
                  setIsAddressModalVisible(false);
                  navigation.navigate(CustomerStackRoutes.AddAddressMethod);
                }}
              >
                <Feather name="plus" size={16} color={colors.primary} />
                <Text style={[styles.addAddressBtnText, { color: colors.primary }]}>Add New Address</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 14, backgroundColor: '#E60012',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  content: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B', marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 14,
  },
  addressIconBox: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(230,0,18,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  addressNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  addressName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  homeBadge: { backgroundColor: 'rgba(230,0,18,0.08)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  homeBadgeText: { color: '#E60012', fontSize: 9, fontFamily: 'Inter_700Bold' },
  addressPhone: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  addressLine: { fontSize: 12, color: '#475569', lineHeight: 18 },
  serviceThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#E2E8F0' },
  serviceName: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 3 },
  serviceIncludes: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  serviceQty: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#E60012' },
  servicePrice: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  dateIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  timeText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  availBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  availBadgeText: { color: '#10B981', fontSize: 9, fontFamily: 'Inter_700Bold' },
  couponRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1,
    borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 14,
  },
  couponLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#E60012' },
  couponHint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  couponCodeBox: { backgroundColor: 'rgba(230,0,18,0.08)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  couponCodeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#E60012' },
  couponSaving: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#10B981' },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, backgroundColor: '#ffffff',
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 11, color: '#64748B', fontFamily: 'Inter_400Regular' },
  totalAmount: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  totalOriginal: { fontSize: 14, color: '#94A3B8', textDecorationLine: 'line-through' },
  savingLabel: { fontSize: 11, color: '#10B981', fontFamily: 'Inter_700Bold', marginTop: 1 },
  ctaBtn: {
    backgroundColor: '#E60012', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 16,
  },
  ctaBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  
  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBgPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 12,
  },
  addressCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  addressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressNameText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  addressTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addressTypeBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: '#15803D',
  },
  addressPhoneText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  addressFullText: {
    fontSize: 11,
    lineHeight: 15,
  },
  selectCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCircleSelected: {
    borderColor: '#E60012',
  },
  selectCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E60012',
  },
  addAddressBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  addAddressBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
