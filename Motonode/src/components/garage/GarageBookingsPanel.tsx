import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { BookingListCard } from '@components/bookings/BookingListCard';
import { BookingStatusTabs } from '@components/bookings/BookingStatusTabs';
import { BookingSupportBanner } from '@components/bookings/BookingSupportBanner';
import { CustomerStackRoutes } from '@constants/routes';
import { useAuth, useBookings } from '@context/index';
import type { BookingFilter } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

interface GarageBookingsPanelProps {
  bottomPadding: number;
}

export function GarageBookingsPanel({ bottomPadding }: GarageBookingsPanelProps) {
  const colors = useColors();
  const { user } = useAuth();
  const { loadBookings, getCustomerBookings } = useBookings();
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const customerId = user?.id ?? 'u1';
  const allBookings = getCustomerBookings(customerId, filter);
  const bookings = search.trim()
    ? allBookings.filter(
        (b) =>
          b.id.toLowerCase().includes(search.toLowerCase()) ||
          (b.serviceName ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (b.vehicleName ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : allBookings;

  return (
    <View style={styles.wrap}>
      <View style={styles.panelHeader}>
        <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>My Bookings</Text>
        <View style={styles.headerIcons}>
          <Pressable hitSlop={8}>
            <Feather name="search" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => navigation.navigate(CustomerStackRoutes.Notifications)}
          >
            <Feather name="bell" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search bookings..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <BookingStatusTabs active={filter} onChange={setFilter} />

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No bookings found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookingListCard
            booking={item}
            onPress={() =>
              navigation.navigate(CustomerStackRoutes.BookingDetail, { bookingId: item.id })
            }
          />
        )}
        ListFooterComponent={
          bookings.length > 0 ? (
            <View style={styles.supportWrap}>
              <BookingSupportBanner />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 12 },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerIcons: { flexDirection: 'row', gap: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', padding: 0 },
  list: { gap: 14, paddingTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  supportWrap: { marginTop: 8 },
});
