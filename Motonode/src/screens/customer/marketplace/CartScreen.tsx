import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useCart } from '@context/index';
import { useColors } from '@hooks/useColors';
import { mediumHaptic, selectionHaptic, successHaptic, lightHaptic } from '@utils/haptics';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: {
    screen?: typeof CustomerTabRoutes.Home | typeof CustomerTabRoutes.Marketplace | typeof CustomerTabRoutes.Garage;
  };
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.MyOrders]: undefined;
  [CustomerStackRoutes.OrderTracking]: { id: string };
  [CustomerStackRoutes.Checkout]: undefined;
};

type CartNavigationProp = NativeStackNavigationProp<
  CustomerStackParamList,
  typeof CustomerStackRoutes.Cart
>;

interface Coupon {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSpend: number;
}

const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'HUB10', description: 'Get 10% OFF on orders above ₹2,999', type: 'percentage', value: 10, minSpend: 2999 },
  { code: 'MOTONEW', description: 'Get Flat ₹200 OFF on your first purchase', type: 'fixed', value: 200, minSpend: 1000 },
  { code: 'FREESHIP', description: 'Free shipping on all auto products', type: 'fixed', value: 0, minSpend: 0 },
];

export function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CartNavigationProp>();
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  // Coupon State
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Calculate discount based on active coupon
  const discount = appliedCoupon 
    ? appliedCoupon.type === 'percentage'
      ? Math.round(total * (appliedCoupon.value / 100))
      : appliedCoupon.value
    : 0;

  const grandTotal = Math.max(0, total - discount);

  const handleApplyCoupon = (coupon: Coupon) => {
    lightHaptic();
    if (total < coupon.minSpend) {
      setCouponError(`Min. spend of ₹${coupon.minSpend} required`);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponError('');
    setIsCouponModalVisible(false);
    successHaptic();
  };

  const handleApplyCustomCode = () => {
    const codeUpper = customCode.toUpperCase();
    const found = AVAILABLE_COUPONS.find(c => c.code === codeUpper);
    if (found) {
      handleApplyCoupon(found);
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    lightHaptic();
    setAppliedCoupon(null);
  };

  const handleCheckout = () => {
    lightHaptic();
    navigation.navigate(CustomerStackRoutes.Checkout);
  };

  if (orderPlaced) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Sticky header */}
        <ChromeHeader style={styles.header} contentPad={8}>
          <Pressable style={styles.circularBackBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Placed!</Text>
          <View style={{ width: 40 }} />
        </ChromeHeader>
        
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Order Confirmed!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>Your order has been placed successfully. Track its status in My Orders.</Text>
          
          <Pressable
            style={[styles.trackBtn, { backgroundColor: '#2563EB' }]}
            onPress={() =>
              navigation.navigate(CustomerStackRoutes.MyOrders as any)
            }
          >
            <Text style={styles.trackBtnText}>Track Order</Text>
          </Pressable>
          
          <Pressable
            style={styles.continueBtn}
            onPress={() =>
              navigation.navigate(CustomerStackRoutes.CustomerTabs, {
                screen: CustomerTabRoutes.Home,
              })
            }
          >
            <Text style={[styles.continueBtnText, { color: '#2563EB' }]}>Continue Shopping</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Redesigned Premium Header */}
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.circularBackBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>My Cart</Text>
        {items.length > 0 ? (
          <Pressable onPress={clearCart} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: 'rgba(255,255,255,0.85)' }]}>Clear</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </ChromeHeader>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add products to your cart to continue shopping</Text>
          <Pressable
            style={[styles.shopBtn, { backgroundColor: '#2563EB' }]}
            onPress={() =>
              navigation.navigate(CustomerStackRoutes.CustomerTabs, {
                screen: CustomerTabRoutes.Marketplace,
              })
            }
          >
            <Text style={styles.shopBtnText}>Browse Marketplace</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.product.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image source={{ uri: item.product.image }} style={styles.itemImage} resizeMode="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemBrand}>{item.product.brand}</Text>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹{item.product.price.toLocaleString('en-IN')}</Text>
                  
                  {/* Quantity selectors */}
                  <View style={styles.quantityRow}>
                    <Pressable
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        selectionHaptic();
                        updateQuantity(item.product.id, item.quantity - 1);
                      }}
                    >
                      <Feather name="minus" size={14} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={[styles.qty, { color: colors.textPrimary }]}>{item.quantity}</Text>
                    <Pressable
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        selectionHaptic();
                        updateQuantity(item.product.id, item.quantity + 1);
                      }}
                    >
                      <Feather name="plus" size={14} color={colors.textPrimary} />
                    </Pressable>
                  </View>
                </View>

                {/* Remove item button */}
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => {
                    mediumHaptic();
                    removeItem(item.product.id);
                  }}
                >
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </Pressable>
              </View>
            )}
          />

          {/* Checkout & Coupons breakdown panel */}
          <View style={[styles.checkout, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
            
            {/* Active Coupon Banner / Trigger */}
            {appliedCoupon ? (
              <View style={styles.appliedCouponRow}>
                <View style={styles.appliedCouponLeft}>
                  <Feather name="tag" size={18} color="#10B981" />
                  <Text style={styles.appliedCouponText}>Code {appliedCoupon.code} applied!</Text>
                </View>
                <Pressable onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                  <Text style={styles.removeCouponText}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.couponRow} onPress={() => setIsCouponModalVisible(true)}>
                <Feather name="tag" size={18} color="#2563EB" />
                <Text style={styles.couponText}>Apply Coupon</Text>
                <Feather name="chevron-right" size={18} color="#2563EB" />
              </Pressable>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Subtotal breakdowns */}
            <View style={styles.billingRow}>
              <Text style={[styles.billingLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.billingValue, { color: colors.textPrimary }]}>₹{total.toLocaleString('en-IN')}</Text>
            </View>
            
            {discount > 0 && (
              <View style={styles.billingRow}>
                <Text style={[styles.billingLabel, { color: colors.textSecondary }]}>Coupon Discount</Text>
                <Text style={[styles.billingValueDiscount]}>- ₹{discount.toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View style={styles.billingRow}>
              <Text style={[styles.billingLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
              <Text style={styles.billingValueFree}>Free</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8 }]} />

            {/* Total checkouts */}
            <View style={styles.totalRow}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Grand Total</Text>
                <Text style={[styles.total, { color: colors.textPrimary }]}>₹{grandTotal.toLocaleString('en-IN')}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.checkoutBtn, { backgroundColor: '#2563EB', opacity: pressed ? 0.9 : 1 }]}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutBtnText}>Place Order</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* Coupons Selection Modal Sheet */}
      <Modal
        visible={isCouponModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCouponModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBgPressable} onPress={() => setIsCouponModalVisible(false)} />
          
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Apply Coupon</Text>
              <Pressable style={styles.closeBtn} onPress={() => setIsCouponModalVisible(false)}>
                <Feather name="x" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {/* Custom Input */}
              <View style={styles.customCodeInputRow}>
                <TextInput
                  style={[styles.customCodeInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Enter custom coupon code"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                  value={customCode}
                  onChangeText={(val) => {
                    setCustomCode(val);
                    setCouponError('');
                  }}
                />
                <Pressable style={[styles.customApplyBtn, { backgroundColor: '#2563EB' }]} onPress={handleApplyCustomCode}>
                  <Text style={styles.customApplyText}>Apply</Text>
                </Pressable>
              </View>

              {couponError ? (
                <Text style={styles.couponErrorText}>{couponError}</Text>
              ) : null}

              {/* Coupon list items */}
              <Text style={[styles.couponSubtitleHeader, { color: colors.textPrimary }]}>Available Coupons</Text>
              
              {AVAILABLE_COUPONS.map((coupon) => (
                <View key={coupon.code} style={[styles.couponCard, { borderColor: colors.border }]}>
                  <View style={styles.couponCardLeft}>
                    <View style={styles.couponBadge}>
                      <Text style={styles.couponBadgeText}>{coupon.code}</Text>
                    </View>
                    <Text style={[styles.couponDesc, { color: colors.textSecondary }]}>{coupon.description}</Text>
                  </View>
                  <Pressable style={styles.couponSelectBtn} onPress={() => handleApplyCoupon(coupon)}>
                    <Text style={styles.couponSelectText}>Apply</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  circularBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  listContent: { padding: 16, gap: 12 },
  cartItem: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  itemImage: { width: 90, height: 100 },
  itemInfo: { flex: 1, padding: 10 },
  itemBrand: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#2563EB', marginBottom: 2 },
  itemName: { fontSize: 12, fontFamily: 'Inter_500Medium', lineHeight: 16, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  qty: { fontSize: 13, fontFamily: 'Inter_700Bold', minWidth: 16, textAlign: 'center' },
  removeBtn: { padding: 12, justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  shopBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  checkout: { borderTopWidth: 1, padding: 16 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 },
  couponText: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  appliedCouponLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appliedCouponText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#15803D' },
  removeCouponBtn: { padding: 4 },
  removeCouponText: { color: '#EF4444', fontSize: 12, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginBottom: 12 },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  billingLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  billingValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  billingValueDiscount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#10B981' },
  billingValueFree: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#10B981' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  totalLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  total: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  checkoutBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  successSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  trackBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  trackBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  continueBtn: { padding: 8 },
  continueBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBgPressable: {
    ...StyleSheet.absoluteFillObject,
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
  customCodeInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customCodeInput: {
    flex: 1,
    borderWidth: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  customApplyBtn: {
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customApplyText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  couponErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  couponSubtitleHeader: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    marginTop: 12,
    marginBottom: 4,
  },
  couponCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  couponCardLeft: {
    flex: 1,
    gap: 6,
  },
  couponBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  couponBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  couponDesc: {
    fontSize: 11,
  },
  couponSelectBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  couponSelectText: {
    color: '#2563EB',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
});
