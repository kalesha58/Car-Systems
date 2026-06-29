import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useCart } from '@context/index';
import { useColors } from '@hooks/useColors';
import { mediumHaptic, selectionHaptic, successHaptic } from '@utils/haptics';

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
};

type CartNavigationProp = NativeStackNavigationProp<
  CustomerStackParamList,
  typeof CustomerStackRoutes.Cart
>;

export function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CartNavigationProp>();
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleCheckout = () => {
    Alert.alert(
      'Place Order',
      `Confirm order for ₹${total.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            successHaptic();
            clearCart();
            setOrderPlaced(true);
          },
        },
      ],
    );
  };

  if (orderPlaced) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
          <Pressable onPress={() => navigation.goBack()}><Feather name="arrow-left" size={24} color="#fff" /></Pressable>
          <Text style={styles.headerTitle}>Order Placed!</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Order Confirmed!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>Your order has been placed successfully. Track it in My Garage.</Text>
          <Pressable
            style={[styles.trackBtn, { backgroundColor: colors.primary }]}
            onPress={() =>
              navigation.navigate(CustomerStackRoutes.CustomerTabs, {
                screen: CustomerTabRoutes.Garage,
              })
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
            <Text style={[styles.continueBtnText, { color: colors.primary }]}>Continue Shopping</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>My Cart</Text>
        {items.length > 0 && (
          <Pressable onPress={clearCart}>
            <Text style={[styles.clearText, { color: 'rgba(255,255,255,0.7)' }]}>Clear</Text>
          </Pressable>
        )}
        {items.length === 0 && <View style={{ width: 50 }} />}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add products to your cart to continue shopping</Text>
          <Pressable
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
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
                  <Text style={[styles.itemBrand, { color: colors.primary }]}>{item.product.brand}</Text>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹{item.product.price.toLocaleString('en-IN')}</Text>
                  <View style={styles.quantityRow}>
                    <Pressable
                      style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        selectionHaptic();
                        updateQuantity(item.product.id, item.quantity - 1);
                      }}
                    >
                      <Feather name="minus" size={16} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={[styles.qty, { color: colors.textPrimary }]}>{item.quantity}</Text>
                    <Pressable
                      style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        selectionHaptic();
                        updateQuantity(item.product.id, item.quantity + 1);
                      }}
                    >
                      <Feather name="plus" size={16} color={colors.textPrimary} />
                    </Pressable>
                  </View>
                </View>
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

          <View style={[styles.checkout, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
            <View style={styles.couponRow}>
              <Feather name="tag" size={18} color={colors.primary} />
              <Text style={[styles.couponText, { color: colors.primary }]}>Apply Coupon</Text>
              <Feather name="chevron-right" size={18} color={colors.primary} />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.totalRow}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                  {items.reduce((sum, cartItem) => sum + cartItem.quantity, 0)} items
                </Text>
                <Text style={[styles.total, { color: colors.textPrimary }]}>₹{total.toLocaleString('en-IN')}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.checkoutBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutBtnText}>Place Order</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  clearText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  listContent: { padding: 16, gap: 12 },
  cartItem: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  itemImage: { width: 100, height: 110 },
  itemInfo: { flex: 1, padding: 12 },
  itemBrand: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  itemName: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18, marginBottom: 4 },
  itemPrice: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  qty: { fontSize: 16, fontFamily: 'Inter_700Bold', minWidth: 20, textAlign: 'center' },
  removeBtn: { padding: 12, justifyContent: 'flex-start' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  shopBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  checkout: { borderTopWidth: 1, padding: 16 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 14 },
  couponText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginBottom: 14 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  total: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  successSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  trackBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  trackBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  continueBtn: { padding: 8 },
  continueBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
