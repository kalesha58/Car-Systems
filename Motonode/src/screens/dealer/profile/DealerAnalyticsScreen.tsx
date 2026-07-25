import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import {
  getDealerInventoryVehicles,
  getDealerProducts,
  getDealerServices,
} from '@services/dealer.service';
import { getDealerOrderStats } from '@services/order.service';
import type { IDealerOrderStats } from '@app-types/order';
import { lightHaptic } from '@utils/haptics';
import { ChromeHeader } from '@components/common';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.Analytics>;

function formatRupee(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function DealerAnalyticsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<IDealerOrderStats | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [orderStats, products, vehicles, services] = await Promise.all([
        getDealerOrderStats(),
        getDealerProducts({ limit: 1000 }),
        getDealerInventoryVehicles({ limit: 1000 }).catch(() => null),
        getDealerServices({ limit: 1000 }).catch(() => null),
      ]);
      setStats(orderStats);
      setProductCount(products.Response?.products?.length ?? 0);
      setVehicleCount(vehicles?.Response?.vehicles?.length ?? 0);
      setServiceCount(services?.Response?.services?.length ?? 0);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const cards = [
    {
      label: 'Total revenue',
      value: formatRupee(stats?.totalRevenue ?? 0),
      icon: 'dollar-sign' as const,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      label: 'Total orders',
      value: String(stats?.total ?? 0),
      icon: 'shopping-bag' as const,
      color: '#E60012',
      bg: '#FEF2F2',
    },
    {
      label: 'Delivered',
      value: String(stats?.delivered ?? 0),
      icon: 'check-circle' as const,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      label: 'Pending / active',
      value: String((stats?.pending ?? 0) + (stats?.processing ?? 0) + (stats?.shipped ?? 0)),
      icon: 'clock' as const,
      color: '#8B5CF6',
      bg: '#F3E8FF',
    },
  ];

  const inventoryCards = [
    { label: 'Products', value: productCount, icon: 'package' as const },
    { label: 'Vehicles', value: vehicleCount, icon: 'truck' as const },
    { label: 'Services', value: serviceCount, icon: 'tool' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Analytics</Text>
          <Pressable
            onPress={() => {
              lightHaptic();
              void load(true);
            }}
            style={styles.headerBtn}
          >
            <Feather name="refresh-cw" size={18} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#E60012" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
          }
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Orders & revenue</Text>
          <View style={styles.grid}>
            {cards.map((card) => (
              <View
                key={card.label}
                style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.statIcon, { backgroundColor: card.bg }]}>
                  <Feather name={card.icon} size={16} color={card.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{card.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{card.label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>
            Inventory snapshot
          </Text>
          <View style={[styles.inventoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {inventoryCards.map((item, i) => (
              <View
                key={item.label}
                style={[
                  styles.inventoryRow,
                  i < inventoryCards.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.divider,
                  },
                ]}
              >
                <View style={styles.inventoryLeft}>
                  <Feather name={item.icon} size={16} color={colors.icon} />
                  <Text style={[styles.inventoryLabel, { color: colors.textPrimary }]}>
                    {item.label}
                  </Text>
                </View>
                <Text style={[styles.inventoryValue, { color: colors.textPrimary }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Pull to refresh. Figures update from your live orders and inventory.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  inventoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inventoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inventoryLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  inventoryValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
});
