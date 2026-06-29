import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { BookingStatusTabs } from '@components/bookings/BookingStatusTabs';
import { DealerStackRoutes } from '@constants/routes';
import { useBookings } from '@context/index';
import type { BookingFilter } from '@data/bookingsData';
import { getStatusColor, getStatusLabel } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.ServiceBookings
>;

export function DealerServiceBookingsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { loadBookings, getDealerBookings, updateBookingStatus } = useBookings();
  const [filter, setFilter] = useState<BookingFilter>('all');

  const dealerId = 'd1';

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const bookings = getDealerBookings(dealerId, filter, 'service');

  const handleQuickAction = async (
    bookingId: string,
    action: 'accept' | 'start' | 'complete' | 'reject',
  ) => {
    lightHaptic();
    if (action === 'accept') await updateBookingStatus(bookingId, 'confirmed');
    if (action === 'start') await updateBookingStatus(bookingId, 'in_progress');
    if (action === 'complete') {
      await updateBookingStatus(bookingId, 'completed');
      successHaptic();
    }
    if (action === 'reject') await updateBookingStatus(bookingId, 'cancelled');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Service Bookings</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabsWrap}>
        <BookingStatusTabs active={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No service bookings
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = getStatusColor(item.status);
          const dateLabel = item.date
            ? new Date(item.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '';

          return (
            <Pressable
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                navigation.navigate(DealerStackRoutes.DealerBookingDetail, {
                  bookingId: item.id,
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: `${statusColor}18` }]}>
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
                <Text style={[styles.bookingId, { color: colors.textTertiary }]}>
                  {item.id}
                </Text>
              </View>

              <Text style={[styles.serviceName, { color: colors.textPrimary }]}>
                {item.serviceName}
              </Text>
              <Text style={[styles.customer, { color: colors.textSecondary }]}>
                {item.customerName} • {item.customerPhone}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {item.vehicleBrand} {item.vehicleName} • {item.vehicleReg}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {dateLabel} • {item.timeSlot}
              </Text>
              <Text style={[styles.price, { color: colors.textPrimary }]}>
                ₹{item.total.toLocaleString('en-IN')}
              </Text>

              <View style={styles.actions}>
                {item.status === 'upcoming' && (
                  <>
                    <Pressable
                      style={styles.rejectBtn}
                      onPress={() => handleQuickAction(item.id, 'reject')}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                    <Pressable
                      style={styles.acceptBtn}
                      onPress={() => handleQuickAction(item.id, 'accept')}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </Pressable>
                  </>
                )}
                {item.status === 'confirmed' && (
                  <Pressable
                    style={styles.acceptBtn}
                    onPress={() => handleQuickAction(item.id, 'start')}
                  >
                    <Text style={styles.acceptText}>Start Service</Text>
                  </Pressable>
                )}
                {item.status === 'in_progress' && (
                  <Pressable
                    style={styles.acceptBtn}
                    onPress={() => handleQuickAction(item.id, 'complete')}
                  >
                    <Text style={styles.acceptText}>Mark Completed</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  tabsWrap: { paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  bookingId: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  serviceName: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 4 },
  customer: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  price: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rejectBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#EF4444' },
  acceptBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
});
