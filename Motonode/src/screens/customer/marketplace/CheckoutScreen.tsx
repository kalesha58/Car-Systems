import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, typeof CustomerStackRoutes.Checkout>;

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
  circleDone: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  circleActive: { borderColor: '#2563EB' },
  num: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  numActive: { color: '#2563EB' },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  labelActive: { color: '#2563EB', fontFamily: 'Inter_700Bold' },
  line: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginBottom: 14, marginHorizontal: 4 },
  lineDone: { backgroundColor: '#2563EB' },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export function CheckoutScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [couponCode, setCouponCode] = useState('HUB10');
  const [couponApplied, setCouponApplied] = useState(true);

  const servicePrice = 999;
  const discount = couponApplied ? 100 : 0;
  const total = servicePrice - discount;

  const handleApplyCoupon = () => {
    lightHaptic();
    if (couponCode.trim().toUpperCase() === 'HUB10') {
      setCouponApplied(true);
      successHaptic();
    } else {
      Alert.alert('Invalid Coupon', 'The coupon code you entered is not valid.');
    }
  };

  const handleContinue = () => {
    lightHaptic();
    navigation.navigate(CustomerStackRoutes.Payment);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8FAFC' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <LinearGradient
        colors={['#1D4ED8', '#3B82F6']}
        style={[styles.header, { paddingTop: topPad + 10 }]}
      >
        <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
          <Feather name="arrow-left" size={20} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Checkout</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

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
        <Pressable style={styles.card} onPress={() => lightHaptic()}>
          <View style={styles.addressIconBox}>
            <Feather name="map-pin" size={18} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.addressNameRow}>
              <Text style={styles.addressName}>Arjun Sharma</Text>
              <View style={styles.homeBadge}><Text style={styles.homeBadgeText}>HOME</Text></View>
            </View>
            <Text style={styles.addressPhone}>+91 98765 43210</Text>
            <Text style={styles.addressLine}>45, 2nd Cross, Koramangala 3 Block,{'\n'}Bengaluru, Karnataka 560034</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#CBD5E1" />
        </Pressable>

        {/* Service Details */}
        <Text style={styles.sectionLabel}>Service Details</Text>
        <View style={styles.card}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=120&auto=format&fit=crop&q=80' }}
            style={styles.serviceThumb}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>Premium Oil Change Service</Text>
            <Text style={styles.serviceIncludes}>• Engine Oil • Oil Filter • Inspection</Text>
            <Text style={styles.serviceQty}>Qty: 1</Text>
          </View>
          <Text style={styles.servicePrice}>₹{servicePrice}</Text>
        </View>

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
          <View style={[styles.dateIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="home" size={18} color="#2563EB" />
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
        <Pressable style={styles.couponRow} onPress={() => lightHaptic()}>
          <Feather name="tag" size={15} color="#2563EB" />
          <Text style={styles.couponLabel}>Apply Coupon</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.couponCodeBox}>
            <Text style={styles.couponCodeText}>{couponApplied ? couponCode : ''}</Text>
          </View>
          {couponApplied && <Text style={styles.couponSaving}>-₹{discount}</Text>}
          <Feather name="chevron-right" size={16} color="#CBD5E1" />
        </Pressable>
      </ScrollView>

      {/* Sticky Bottom */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad + 10, borderTopColor: '#E2E8F0' }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={styles.totalAmount}>₹{total}</Text>
            {couponApplied && (
              <Text style={styles.totalOriginal}>₹{servicePrice}</Text>
            )}
          </View>
          {couponApplied && (
            <Text style={styles.savingLabel}>You save ₹{discount}</Text>
          )}
          <Text style={styles.totalLabel}>Total Amount</Text>
        </View>
        <Pressable style={styles.ctaBtn} onPress={handleContinue}>
          <Text style={styles.ctaBtnText}>Continue to Payment</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 14, borderBottomWidth: 1, backgroundColor: '#ffffff',
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
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  addressNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  addressName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  homeBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  homeBadgeText: { color: '#2563EB', fontSize: 9, fontFamily: 'Inter_700Bold' },
  addressPhone: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  addressLine: { fontSize: 12, color: '#475569', lineHeight: 18 },
  serviceThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#E2E8F0' },
  serviceName: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 3 },
  serviceIncludes: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  serviceQty: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
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
  couponLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
  couponCodeBox: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  couponCodeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#1E40AF' },
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
    backgroundColor: '#2563EB', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 16,
  },
  ctaBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
