import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useDealer } from '@context/index';
import { DriveBooking } from '@data/dealerData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: '#F59E0B', label: 'Pending' },
  confirmed: { color: '#3B82F6', label: 'Confirmed' },
  completed: { color: '#10B981', label: 'Completed' },
  rejected: { color: '#EF4444', label: 'Rejected' },
};

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Rejected'];

export function DriveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { driveBookings, updateBookingStatus } = useDealer();
  const [activeFilter, setActiveFilter] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filtered =
    activeFilter === 0
      ? driveBookings
      : driveBookings.filter((b) => b.status === FILTERS[activeFilter].toLowerCase());

  const upcoming = driveBookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed',
  ).length;

  const handleApprove = (booking: DriveBooking) => {
    Alert.alert('Confirm Test Drive', `Approve test drive for ${booking.customer}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          lightHaptic();
          updateBookingStatus(booking.id, 'confirmed');
        },
      },
    ]);
  };

  const handleReject = (booking: DriveBooking) => {
    Alert.alert('Reject Booking', `Reject test drive for ${booking.customer}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          lightHaptic();
          updateBookingStatus(booking.id, 'rejected');
        },
      },
    ]);
  };

  const handleComplete = (booking: DriveBooking) => {
    Alert.alert('Complete Test Drive', `Mark test drive for ${booking.customer} as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          lightHaptic();
          updateBookingStatus(booking.id, 'completed');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Test Drives</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.countText}>{upcoming} Upcoming</Text>
          </View>
        </View>
        <FlatList
          data={FILTERS}
          keyExtractor={(i) => i}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          renderItem={({ item, index }) => (
            <Pressable
              style={[
                styles.filterChip,
                activeFilter === index && { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
              onPress={() => {
                lightHaptic();
                setActiveFilter(index);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: activeFilter === index ? '#fff' : 'rgba(255,255,255,0.65)' },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View
            style={[styles.calendarHint, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.calendarText, { color: colors.textSecondary }]}>
              Showing all scheduled test drives
            </Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </View>
        }
        renderItem={({ item }) => {
          const st = STATUS_CONFIG[item.status];
          return (
            <View
              style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.bookingHeader}>
                <View style={[styles.bookingIcon, { backgroundColor: st.color + '20' }]}>
                  <Feather name="truck" size={22} color={st.color} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={[styles.bookingCustomer, { color: colors.textPrimary }]}>
                    {item.customer}
                  </Text>
                  <Text style={[styles.bookingVehicle, { color: colors.primary }]}>
                    {item.vehicle}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.bookingMeta}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={14} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={14} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="phone" size={14} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.phone}</Text>
                </View>
              </View>

              {item.notes ? (
                <View style={[styles.notesBox, { backgroundColor: colors.muted }]}>
                  <Feather name="info" size={13} color={colors.textTertiary} />
                  <Text style={[styles.notesText, { color: colors.textSecondary }]}>{item.notes}</Text>
                </View>
              ) : null}

              <View style={styles.bookingActions}>
                {item.status === 'pending' && (
                  <>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleApprove(item)}
                    >
                      <Feather name="check" size={15} color="#fff" />
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleReject(item)}
                    >
                      <Feather name="x" size={15} color="#fff" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </Pressable>
                  </>
                )}
                {item.status === 'confirmed' && (
                  <>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleComplete(item)}
                    >
                      <Feather name="check-circle" size={15} color="#fff" />
                      <Text style={styles.actionBtnText}>Mark Complete</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleReject(item)}
                    >
                      <Feather name="x" size={15} color="#fff" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </Pressable>
                  </>
                )}
                {(item.status === 'completed' || item.status === 'rejected') && (
                  <View style={[styles.doneRow, { backgroundColor: st.color + '15' }]}>
                    <Feather
                      name={item.status === 'completed' ? 'check-circle' : 'x-circle'}
                      size={16}
                      color={st.color}
                    />
                    <Text style={[styles.doneText, { color: st.color }]}>
                      {item.status === 'completed' ? 'Test drive completed' : 'Booking rejected'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="truck" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No test drives found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  countBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  countText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  filtersRow: { gap: 8, paddingBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 16, gap: 12 },
  calendarHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  calendarText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  bookingCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingInfo: { flex: 1 },
  bookingCustomer: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  bookingVehicle: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginBottom: 12 },
  bookingMeta: { gap: 6, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  notesText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  bookingActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  doneRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  doneText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
