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
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useCart } from '@context/index';
import { useMobileVerificationGate } from '@context/MobileVerificationContext';
import { useColors } from '@hooks/useColors';
import { createOrder } from '@services/order.service';
import type { ICreateOrderRequest } from '@app-types/order';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { formatCurrency, getOrderId, getProductId } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import RazorpayService from '@services/payment/RazorpayService';
import { verifyRazorpayPayment } from '@services/payment.service';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { DEFAULT_SHIPPING_ADDRESS } from './CheckoutScreen';

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
  circleDone: { backgroundColor: '#E60012', borderColor: '#E60012' },
  circleActive: { borderColor: '#E60012' },
  num: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  numActive: { color: '#E60012' },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  labelActive: { color: '#E60012', fontFamily: 'Inter_700Bold' },
  line: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginBottom: 14, marginHorizontal: 4 },
  lineDone: { backgroundColor: '#E60012' },
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
  { id: 'upi', label: 'UPI', subtitle: 'Pay using any UPI app', icon: 'smartphone', iconColor: '#E60012', iconBg: 'rgba(230,0,18,0.08)' },
  { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, Rupay', icon: 'credit-card', iconColor: '#E60012', iconBg: 'rgba(230,0,18,0.08)' },
  { id: 'netbanking', label: 'Net Banking', subtitle: 'All major banks supported', icon: 'home', iconColor: '#1E293B', iconBg: '#F1F5F9' },
  { id: 'wallet', label: 'Wallets', subtitle: 'Paytm, PhonePe, Amazon Pay', icon: 'briefcase', iconColor: '#7C3AED', iconBg: '#EDE9FE' },
  { id: 'paylater', label: 'Pay Later', subtitle: 'Simpl, LazyPay & more', icon: 'clock', iconColor: '#64748B', iconBg: '#F1F5F9' },
];

// ── Main Screen ──────────────────────────────────────────────────────────────
export function PaymentScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { items, total, clearCart } = useCart();
  const { runWithMobileCheck } = useMobileVerificationGate();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [paying, setPaying] = useState(false);

  const platformFee = 0;
  const totalAmount = total + platformFee;

  const mapPaymentMethod = (method: PaymentMethod): ICreateOrderRequest['paymentMethod'] => {
    switch (method) {
      case 'upi':
        return 'upi';
      case 'card':
        return 'credit_card';
      case 'netbanking':
        return 'debit_card';
      default:
        return 'cash_on_delivery';
    }
  };

  const handlePay = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add items before paying.');
      return;
    }

    await runWithMobileCheck(async () => {
      lightHaptic();
      setPaying(true);

      try {
      const orderItems = items.map((item) => ({
        productId: getProductId(item.product),
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      }));

      const dealerId = items[0]?.product.dealerId;

      const shippingAddress = route.params?.address
        ? {
            street: route.params.address.fullAddress,
            city: route.params.address.townOrCity || 'Bengaluru',
            state: route.params.address.state || 'Karnataka',
            zipCode: route.params.address.pincode || '560034',
            country: 'India',
          }
        : DEFAULT_SHIPPING_ADDRESS;

      const deliveryLocation = route.params?.address?.coordinates
        ? {
            latitude: route.params.address.coordinates.latitude,
            longitude: route.params.address.coordinates.longitude,
            address: route.params.address.fullAddress,
          }
        : undefined;

      const order = await createOrder({
        items: orderItems,
        shippingAddress,
        paymentMethod: mapPaymentMethod(selectedMethod),
        dealerId,
        deliveryLocation,
      });

      if (!order) {
        throw new Error('Failed to place order');
      }

      const orderId = getOrderId(order);

      // Trigger Razorpay payment if paymentAction is returned by the server
      const paymentAction = (order as any).paymentAction;
      if (paymentAction && paymentAction.type === 'RAZORPAY_CHECKOUT') {
        try {
          const paymentResult = await RazorpayService.openCheckout(paymentAction);
          const verification = await verifyRazorpayPayment(orderId, paymentResult);
          
          if (!verification.success) {
            throw new Error(verification.error || 'Payment verification failed');
          }
        } catch (paymentErr: any) {
          throw new Error(paymentErr?.description || paymentErr?.message || 'Payment checkout was cancelled or failed.');
        }
      }

      clearCart();
      successHaptic();
      Alert.alert(
        'Payment Successful!',
        `Your order ${order.orderNumber} has been placed.`,
        [
          {
            text: 'Track Order',
            onPress: () =>
              navigation.navigate(CustomerStackRoutes.OrderTracking, { id: orderId }),
          },
          {
            text: 'My Orders',
            onPress: () => navigation.navigate(CustomerStackRoutes.MyOrders),
          },
        ],
      );
    } catch (err) {
      Alert.alert('Order Failed', getApiErrorMessage(err, 'Could not place your order. Please try again.'));
    } finally {
      setPaying(false);
    }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      {/* Header */}
      <ChromeHeader style={styles.header} contentPad={10}>
        <Pressable style={styles.backBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
          <Feather name="arrow-left" size={20} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Payment</Text>
        <View style={{ width: 36 }} />
      </ChromeHeader>

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
            <Feather name="shield" size={16} color={colors.primary} />
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
          {items.map((item) => (
            <View key={getProductId(item.product)} style={styles.summaryItemRow}>
              <Image
                source={{
                  uri:
                    item.product.images?.[0] ||
                    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=120&auto=format&fit=crop&q=80',
                }}
                style={styles.summaryThumb}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryItemName}>{item.product.name}</Text>
                <Text style={styles.summaryItemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.summaryItemPrice}>
                {formatCurrency(item.product.price * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatCurrency(total)}</Text>
          </View>
          {platformFee > 0 && (
            <View style={styles.priceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.priceLabel}>Platform Fee</Text>
                <Feather name="info" size={11} color="#94A3B8" />
              </View>
              <Text style={styles.priceValue}>{formatCurrency(platformFee)}</Text>
            </View>
          )}

          <View style={styles.totalDivider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
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
          <Text style={styles.amountPayValue}>{formatCurrency(totalAmount)}</Text>
          <Pressable onPress={() => lightHaptic()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={styles.viewDetails}>View Price Details</Text>
            <Feather name="chevron-right" size={12} color="#E60012" />
          </Pressable>
        </View>
        <Pressable
          style={[styles.payBtn, { backgroundColor: paying ? 'rgba(230,0,18,0.4)' : '#E60012' }]}
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
    paddingBottom: 14, backgroundColor: '#E60012',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  content: { padding: 16, gap: 12 },
  secureBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(230,0,18,0.05)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(230,0,18,0.15)',
  },
  secureIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(230,0,18,0.08)', alignItems: 'center', justifyContent: 'center' },
  secureTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#E60012' },
  secureSubtitle: { fontSize: 10, color: '#E60012', opacity: 0.8, marginTop: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  editLink: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#E60012' },
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
  radioOuterSelected: { borderColor: '#E60012' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E60012' },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, backgroundColor: '#ffffff',
    borderTopWidth: 1,
  },
  amountPayLabel: { fontSize: 10, color: '#64748B', fontFamily: 'Inter_400Regular' },
  amountPayValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  viewDetails: { fontSize: 11, color: '#E60012', fontFamily: 'Inter_600SemiBold' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 16,
  },
  payBtnText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
