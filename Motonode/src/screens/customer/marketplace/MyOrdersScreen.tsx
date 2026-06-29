import React, { useState } from 'react';
import {
  FlatList,
  Image,
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
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
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

interface OrderItem {
  id: string;
  orderId: string;
  date: string;
  status: 'Delivered' | 'Out for Delivery' | 'Shipped' | 'Processing' | 'Cancelled';
  name: string;
  extraItems?: string;
  price: number;
  image: string;
  statusText: string;
}

export function MyOrdersScreen({ navigation }: MyOrdersScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<'All' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: ('All' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled')[] = [
    'All',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  const mockOrders: OrderItem[] = [
    {
      id: 'o1',
      orderId: 'MN1234567890',
      date: '12 May 2026, 09:30 AM',
      status: 'Delivered',
      name: 'Castrol EDGE 5W30 Engine Oil 4L',
      extraItems: '+ 2 more items',
      price: 2999,
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80',
      statusText: 'Delivered on 14 May 2026',
    },
    {
      id: 'o2',
      orderId: 'MN1234567889',
      date: '10 May 2026, 04:15 PM',
      status: 'Out for Delivery',
      name: 'Bosch Disc Brake Pad Set',
      extraItems: '+ 1 more item',
      price: 1799,
      image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=200&auto=format&fit=crop&q=80',
      statusText: 'Arriving today by 8 PM',
    },
    {
      id: 'o3',
      orderId: 'MN1234567888',
      date: '08 May 2026, 11:20 AM',
      status: 'Shipped',
      name: 'Exide Mileage Car Battery',
      extraItems: '55D23L',
      price: 7499,
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80',
      statusText: 'Shipped on 09 May 2026',
    },
    {
      id: 'o4',
      orderId: 'MN1234567887',
      date: '05 May 2026, 02:40 PM',
      status: 'Processing',
      name: 'Mann Engine Air Filter',
      extraItems: 'C27011',
      price: 649,
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80',
      statusText: 'Will be shipped soon',
    },
  ];

  const filteredOrders = mockOrders.filter((order) => {
    const matchesTab = activeTab === 'All' || order.status === activeTab;
    const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusStyle = (status: OrderItem['status']) => {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Header */}
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

      {/* Tabs list selector */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab) => {
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
                <Text style={[styles.tabText, isActive ? { color: '#2563EB', fontFamily: 'Inter_700Bold' } : { color: colors.textSecondary }]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const statusColors = getStatusStyle(item.status);
          return (
            <Pressable
              style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate(CustomerStackRoutes.OrderTracking, { id: item.id })}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.orderIdText, { color: colors.textPrimary }]}>Order ID: {item.orderId}</Text>
                  <Text style={[styles.orderDate, { color: colors.textTertiary }]}>{item.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusTextBadge, { color: statusColors.text }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Image source={{ uri: item.image }} style={styles.productImg} />
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.extraItems && (
                    <Text style={[styles.extraItemsText, { color: colors.textSecondary }]}>
                      {item.extraItems}
                    </Text>
                  )}
                  <Text style={[styles.productPrice, { color: colors.textPrimary }]}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.deliveryStatusText, { color: item.status === 'Delivered' ? '#15803D' : '#7E22CE' }]}>
                {item.statusText}
              </Text>

              {/* Action buttons */}
              <View style={styles.cardActions}>
                {(item.status === 'Out for Delivery' || item.status === 'Shipped') ? (
                  <>
                    <Pressable
                      style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1 }]}
                      onPress={() => navigation.navigate(CustomerStackRoutes.OrderTracking, { id: item.id })}
                    >
                      <Text style={[styles.actionText, { color: colors.textPrimary }]}>Track Order</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1 }]}>
                      <Text style={[styles.actionText, { color: colors.textPrimary }]}>View Details</Text>
                    </Pressable>
                  </>
                ) : item.status === 'Delivered' ? (
                  <>
                    <Pressable style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1 }]}>
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
                  <Pressable style={[styles.actionBtn, { borderColor: '#E2E8F0', borderWidth: 1, flex: 1 }]}>
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>View Details</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders found</Text>
          </View>
        }
      />
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
  },
});
