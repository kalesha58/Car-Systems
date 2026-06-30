import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { IOrderData } from '@app-types/order';
import { getUserOrders } from '@services/order.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import {
  formatCurrency,
  formatOrderDate,
  getOrderId,
  normalizeOrderDisplayStatus,
  type OrderDisplayStatus,
} from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.DealerStore]: { id: string };
  [CustomerStackRoutes.ServiceDetail]: { id: string };
  [CustomerStackRoutes.DriveDetail]: { id: string };
  [CustomerStackRoutes.MyOrders]: undefined;
  [CustomerStackRoutes.OrderTracking]: { id: string };
};

type MyOrdersScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.MyOrders
>;

type OrderTab = 'All' | OrderDisplayStatus;

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80';

const TABS: OrderTab[] = [
  'All',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export function MyOrdersScreen({ navigation }: MyOrdersScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<OrderTab>('All');
  const [orders, setOrders] = useState<IOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (opts?: { refreshing?: boolean }) => {
    if (opts?.refreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getUserOrders();
      setOrders(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load orders'));
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  const filteredOrders = orders.filter((order) => {
    const displayStatus = normalizeOrderDisplayStatus(order.status);
    return activeTab === 'All' || displayStatus === activeTab;
  });

  const getStatusStyle = (status: OrderDisplayStatus) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'Out for Delivery':
        return { bg: '#F3E8FF', text: '#7E22CE' };
      case 'Shipped':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'Processing':
        return { bg: '#FFEDD5', text: '#C2410C' };
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C' };
    }
  };

  const getStatusText = (order: IOrderData, displayStatus: OrderDisplayStatus) => {
    if (order.expectedDeliveryDate && displayStatus === 'Out for Delivery') {
      const eta = new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
      return `Arriving by ${eta}`;
    }
    if (displayStatus === 'Delivered') {
      return `Delivered on ${formatOrderDate(order.updatedAt).split(',')[0]}`;
    }
    if (displayStatus === 'Shipped') {
      return `Shipped on ${formatOrderDate(order.updatedAt).split(',')[0]}`;
    }
    if (displayStatus === 'Cancelled') {
      return order.cancellationReason || 'Order was cancelled';
    }
    return 'Will be shipped soon';
  };

  const renderOrder = ({ item: order }: { item: IOrderData }) => {
    const orderId = getOrderId(order);
    const displayStatus = normalizeOrderDisplayStatus(order.status);
    const statusColors = getStatusStyle(displayStatus);
    const firstItem = order.items[0];
    const extraCount = order.items.length - 1;

    return (
      <Pressable
        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate(CustomerStackRoutes.OrderTracking, { id: orderId })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.orderIdText, { color: colors.textPrimary }]}>
              Order ID: {order.orderNumber}
            </Text>
            <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
              {formatOrderDate(order.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusTextBadge, { color: statusColors.text }]}>{displayStatus}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Image source={{ uri: DEFAULT_PRODUCT_IMAGE }} style={styles.productImg} />
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
              {firstItem?.name ?? 'Order items'}
            </Text>
            {extraCount > 0 && (
              <Text style={[styles.extraItemsText, { color: colors.textSecondary }]}>
                + {extraCount} more {extraCount === 1 ? 'item' : 'items'}
              </Text>
            )}
            <Text style={[styles.productPrice, { color: colors.textPrimary }]}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.deliveryStatusText,
            { color: displayStatus === 'Delivered' ? '#15803D' : '#7E22CE' },
          ]}
        >
          {getStatusText(order, displayStatus)}
        </Text>

        <View style={styles.cardActions}>
          {displayStatus === 'Out for Delivery' || displayStatus === 'Shipped' ? (
            <>
              <Pressable
                style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1 }]}
                onPress={() =>
                  navigation.navigate(CustomerStackRoutes.OrderTracking, { id: orderId })
                }
              >
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>Track Order</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1 }]}
                onPress={() =>
                  navigation.navigate(CustomerStackRoutes.OrderTracking, { id: orderId })
                }
              >
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>View Details</Text>
              </Pressable>
            </>
          ) : displayStatus === 'Delivered' ? (
            <>
              <Pressable
                style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1 }]}
                onPress={() =>
                  navigation.navigate(CustomerStackRoutes.OrderTracking, { id: orderId })
                }
              >
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>View Details</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                onPress={() => successHaptic()}
              >
                <Text style={[styles.actionText, { color: '#ffffff' }]}>Buy Again</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1, flex: 1 }]}
              onPress={() =>
                navigation.navigate(CustomerStackRoutes.OrderTracking, { id: orderId })
              }
            >
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>View Details</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>My Orders</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <Feather name="search" size={20} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Feather name="sliders" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </ChromeHeader>

      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.tabBtn, isActive && { borderBottomColor: '#2563EB', borderBottomWidth: 2 }]}
                onPress={() => {
                  lightHaptic();
                  setActiveTab(tab);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive
                      ? { color: '#2563EB', fontFamily: 'Inter_700Bold' }
                      : { color: colors.textSecondary },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.link} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => getOrderId(item)}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOrders({ refreshing: true })}
              tintColor={colors.link}
              colors={[colors.link]}
            />
          }
          renderItem={renderOrder}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {error ?? 'No orders found'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 20,
  },
  tabBtn: {
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  orderDate: {
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextBadge: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  productImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  extraItemsText: {
    fontSize: 11,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  deliveryStatusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    marginTop: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
