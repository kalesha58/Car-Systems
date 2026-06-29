import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

type Props = NativeStackScreenProps<CustomerStackParamList, typeof CustomerStackRoutes.Payment>;

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

// ── Payment Method Options ────────────────────────────────────────────────────
type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'paylater';

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}[] = [
  { id: 'upi', label: 'UPI', subtitle: 'Pay using any UPI app', icon: 'smartphone', iconColor: '#F59E0B', iconBg: '#FEF3C7' },
  { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, Rupay', icon: 'credit-card', iconColor: '#2563EB', iconBg: '#DBEAFE' },
  { id: 'netbanking', label: 'Net Banking', subtitle: 'All major banks supported', icon: 'home', iconColor: '#1E293B', iconBg: '#F1F5F9' },
  { id: 'wallet', label: 'Wallets', subtitle: 'Paytm, PhonePe, Amazon Pay', icon: 'briefcase', iconColor: '#7C3AED', iconBg: '#EDE9FE' },
  { id: 'paylater', label: 'Pay Later', subtitle: 'Simpl, LazyPay & more', icon: 'clock', iconColor: '#64748B', iconBg: '#F1F5F9' },
];

// ── Main Screen ──────────────────────────────────────────────────────────────
export function PaymentScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [paying, setPaying] = useState(false);

  const serviceAmount = 999;
  const couponDiscount = 100;
  const platformFee = 20;
  const totalAmount = serviceAmount - couponDiscount + platformFee;

  const handlePay = () => {
    lightHaptic();
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      successHaptic();
      Alert.alert(
        '🎉 Payment Successful!',
        `Your payment of ₹${totalAmount} has been received. Order confirmed!`,
        [
          {
            text: 'View Order',
            onPress: () => navigation.navigate(CustomerStackRoutes.MyOrders),
          },
          { text: 'Done', onPress: () => navigation.popToTop() },
        ]
      );
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1D4ED8', '#3B82F6']}
        style={[styles.header, { paddingTop: topPad + 10 }]}
      >
        <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
          <Feather name="arrow-left" size={20} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Payment</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress */}
      <View style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <StepBar current={2} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Secure Payments Banner */}
        <View style={styles.secureBanner}>
          <View style={styles.secureIconBox}>
            <Feather name="shield" size={16} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.secureTitle}>100% Secure Payments</Text>
            <Text style={styles.secureSubtitle}>Your payment information is safe with us.</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <Pressable onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          {/* Item row */}
          <View style={styles.summaryItemRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=120&auto=format&fit=crop&q=80' }}
              style={styles.summaryThumb}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryItemName}>Premium Oil Change Service</Text>
              <Text style={styles.summaryItemQty}>Qty: 1</Text>
            </View>
            <Text style={styles.summaryItemPrice}>₹{serviceAmount}</Text>
          </View>

          <View style={styles.divider} />

          {/* Price Breakdown */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Amount</Text>
            <Text style={styles.priceValue}>₹{serviceAmount}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Coupon Discount <Text style={styles.couponCode}>(HUB10)</Text>
            </Text>
            <Text style={styles.discountValue}>-₹{couponDiscount}</Text>
          </View>
          <View style={styles.priceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Feather name="info" size={11} color="#94A3B8" />
            </View>
            <Text style={styles.priceValue}>₹{platformFee}</Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Select Payment Method */}
        <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Select Payment Method</Text>
        <View style={styles.methodsCard}>
          {PAYMENT_METHODS.map((method, idx) => {
            const isSelected = selectedMethod === method.id;
            return (
              <View key={method.id}>
                <Pressable
                  style={styles.methodRow}
                  onPress={() => { lightHaptic(); setSelectedMethod(method.id); }}
                >
                  <View style={[styles.methodIconBox, { backgroundColor: method.iconBg }]}>
                    <Feather name={method.icon as any} size={16} color={method.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>{method.label}</Text>
                    <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
                {idx < PAYMENT_METHODS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad + 10, borderTopColor: '#E2E8F0' }]}>
        <View>
          <Text style={styles.amountPayLabel}>Amount to Pay</Text>
          <Text style={styles.amountPayValue}>₹{totalAmount}</Text>
          <Pressable onPress={() => lightHaptic()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={styles.viewDetails}>View Price Details</Text>
            <Feather name="chevron-right" size={12} color="#2563EB" />
          </Pressable>
        </View>
        <Pressable
          style={[styles.payBtn, { backgroundColor: paying ? '#93C5FD' : '#2563EB' }]}
          onPress={handlePay}
          disabled={paying}
        >
          <Feather name="lock" size={15} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.payBtnText}>{paying ? 'Processing…' : 'Pay Securely'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 14, borderBottomWidth: 1, backgroundColor: '#ffffff',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  content: { padding: 16, gap: 12 },
  secureBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  secureIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  secureTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E3A8A' },
  secureSubtitle: { fontSize: 10, color: '#3B82F6', marginTop: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  editLink: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#2563EB' },
  summaryCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 14, gap: 10,
  },
  summaryItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#E2E8F0' },
  summaryItemName: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 3 },
  summaryItemQty: { fontSize: 11, color: '#64748B' },
  summaryItemPrice: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 12, color: '#64748B', fontFamily: 'Inter_400Regular' },
  priceValue: { fontSize: 12, color: '#1E293B', fontFamily: 'Inter_500Medium' },
  couponCode: { color: '#10B981', fontFamily: 'Inter_700Bold' },
  discountValue: { fontSize: 12, color: '#10B981', fontFamily: 'Inter_700Bold' },
  totalDivider: { height: 1, backgroundColor: '#E2E8F0' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  totalValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  methodsCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1,
    borderColor: '#E2E8F0', overflow: 'hidden',
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  methodIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  methodSubtitle: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: '#2563EB' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, backgroundColor: '#ffffff',
    borderTopWidth: 1,
  },
  amountPayLabel: { fontSize: 10, color: '#64748B', fontFamily: 'Inter_400Regular' },
  amountPayValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  viewDetails: { fontSize: 11, color: '#2563EB', fontFamily: 'Inter_600SemiBold' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 16,
  },
  payBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
