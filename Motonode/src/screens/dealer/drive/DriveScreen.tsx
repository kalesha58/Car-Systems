import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerStackRoutes } from '@constants/routes';
import { useBookings } from '@context/index';
import type { CustomerBooking } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: '#F59E0B', label: 'Pending' },
  confirmed: { color: '#10B981', label: 'Confirmed' },
  completed: { color: '#FF1A1A', label: 'Completed' },
  rejected: { color: '#EF4444', label: 'Rejected' },
};

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed'];

export function DriveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<DealerStackParamList>>();
  const { loadBookings, getDealerBookings, updateBookingStatus } = useBookings();
  const [activeFilter, setActiveFilter] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const dealerId = 'd1';

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const driveBookings = getDealerBookings(dealerId, 'all', 'test_drive');

  const filtered =
    activeFilter === 0
      ? driveBookings
      : driveBookings.filter((b) => b.status === FILTERS[activeFilter].toLowerCase());

  const upcoming = driveBookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed',
  ).length;

  const handleApprove = (booking: CustomerBooking) => {
    Alert.alert('Confirm Test Drive', `Approve test drive for ${booking.customerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          lightHaptic();
          await updateBookingStatus(booking.id, 'confirmed');
          successHaptic();
        },
      },
    ]);
  };

  const handleReject = (booking: CustomerBooking) => {
    Alert.alert('Reject Booking', `Reject test drive for ${booking.customerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          lightHaptic();
          await updateBookingStatus(booking.id, 'rejected');
        },
      },
    ]);
  };

  const handleComplete = (booking: CustomerBooking) => {
    Alert.alert('Complete Test Drive', `Mark test drive for ${booking.customerName} as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          lightHaptic();
          await updateBookingStatus(booking.id, 'completed');
          successHaptic();
        },
      },
    ]);
  };

  const countByStatus = (status: string) => {
    if (status === 'all') return driveBookings.length;
    return driveBookings.filter((b) => b.status === status).length;
  };

  const getHeaderIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: 'truck', bg: '#FFFBEB', color: '#F59E0B' };
      case 'confirmed':
        return { icon: 'truck', bg: '#F2F2F2', color: themeLight.textSecondary };
      default:
        return { icon: 'truck', bg: '#F3E8FF', color: '#8B5CF6' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Redesigned Mockup Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Test Drives</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Manage and track all test drive requests
            </Text>
          </View>
          <Pressable style={styles.upcomingBadgeBtn} onPress={() => successHaptic()}>
            <Feather name="calendar" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.upcomingBadgeText}>{upcoming} Upcoming</Text>
          </Pressable>
        </View>

        {/* Filter Pills Row */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTERS.map((item, index) => {
              const count = countByStatus(item.toLowerCase());
              const isSelected = activeFilter === index;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.filterChip,
                    isSelected ? { backgroundColor: '#E60012' } : { backgroundColor: '#F1F5F9' },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setActiveFilter(index);
                  }}
                >
                  <Text style={[styles.filterText, isSelected ? { color: '#ffffff' } : { color: colors.textPrimary }]}>
                    {item} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Bookings List */}
      <FlatList<CustomerBooking>
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          // Calendar Hint Card
          <View style={[styles.calendarHint, { backgroundColor: '#F2F2F2', borderColor: colors.border }]}>
            <View style={styles.hintLeft}>
              <View style={[styles.hintIconWrapper, { backgroundColor: '#F2F2F2' }]}>
                <Feather name="calendar" size={16} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.hintTitle, { color: colors.textPrimary }]}>Showing all scheduled test drives</Text>
                <Text style={[styles.hintSub, { color: colors.textSecondary }]}>View and manage all your test drive bookings</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textSecondary} />
          </View>
        }
        renderItem={({ item }) => {
          const st = STATUS_CONFIG[item.status] || { color: themeLight.textSecondary, label: 'Confirmed' };
          const headerIconInfo = getHeaderIcon(item.status);
          const vehicleImage = item.vehicleImage ?? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&auto=format&fit=crop&q=80';
          const vehicleLabel = `${item.vehicleBrand ?? ''} ${item.vehicleName ?? ''}`.trim();
          const dateLabel = item.date
            ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : item.date;

          return (
            <Pressable
              style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                navigation.navigate(DealerStackRoutes.DealerBookingDetail, { bookingId: item.id })
              }
            >
              
              {/* Card Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.headerIconContainer, { backgroundColor: headerIconInfo.bg }]}>
                    <Feather name={headerIconInfo.icon as any} size={16} color={headerIconInfo.color} />
                  </View>
                  <View>
                    <View style={styles.customerNameRow}>
                      <Text style={[styles.customerName, { color: colors.textPrimary }]}>{item.customerName}</Text>
                      <View style={styles.verifiedBadge}>
                        <Feather name="check" size={8} color="#ffffff" />
                      </View>
                    </View>
                    <Text style={styles.vehicleName}>{vehicleLabel}</Text>
                  </View>
                </View>
                
                {/* Status Badges */}
                <View style={[styles.statusBadge, { backgroundColor: st.color + '15' }]}>
                  <Text style={[styles.statusTextLabel, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Card Body Grid (Left details list, Right Vehicle Image preview) */}
              <View style={styles.cardBody}>
                
                <View style={styles.detailsCol}>
                  <View style={styles.metaRowItem}>
                    <Feather name="calendar" size={13} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{dateLabel}</Text>
                  </View>
                  
                  <View style={styles.metaRowItem}>
                    <Feather name="clock" size={13} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.timeSlot}</Text>
                  </View>

                  <View style={styles.metaRowItem}>
                    <Feather name="phone" size={13} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.customerPhone}</Text>
                  </View>
                </View>

                {/* Right Vehicle Image */}
                <Image source={{ uri: vehicleImage }} style={styles.vehicleThumbnail} resizeMode="contain" />

              </View>

              {/* Special Considerations note box */}
              {item.notes && (
                <View style={[
                  styles.specialNoteBox,
                  {
                    backgroundColor: item.status === 'pending' ? '#FFFBEB' : '#F2F2F2',
                  }
                ]}>
                  <Feather name="info" size={12} color={item.status === 'pending' ? '#F59E0B' : '#E60012'} style={{ marginRight: 6, marginTop: 1 }} />
                  <Text style={[
                    styles.specialNoteText,
                    { color: item.status === 'pending' ? '#D97706' : '#B0000F' }
                  ]}>
                    {item.notes}
                  </Text>
                </View>
              )}

              {/* Actions row */}
              <View style={styles.actionsRow}>
                {item.status === 'pending' && (
                  <>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleApprove(item)}
                    >
                      <Feather name="check" size={14} color="#ffffff" />
                      <Text style={styles.actionBtnText}>Confirm</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleReject(item)}
                    >
                      <Feather name="x" size={14} color="#ffffff" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </Pressable>
                  </>
                )}
                {item.status === 'confirmed' && (
                  <>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: '#E60012' }]}
                      onPress={() => handleComplete(item)}
                    >
                      <Feather name="check-circle" size={14} color="#ffffff" />
                      <Text style={styles.actionBtnText}>Mark Complete</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleReject(item)}
                    >
                      <Feather name="x" size={14} color="#ffffff" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </Pressable>
                  </>
                )}
              </View>

            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="truck" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No test drives found</Text>
          </View>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  upcomingBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  upcomingBadgeText: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  filtersWrapper: {
    paddingVertical: 8,
  },
  filtersRow: { gap: 8, paddingRight: 16, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  
  content: { padding: 16, gap: 14 },
  calendarHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  hintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  hintIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  hintSub: { fontSize: 10, marginTop: 1 },
  
  bookingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  verifiedBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E60012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: { fontSize: 12, color: themeLight.textSecondary, fontFamily: 'Inter_700Bold', marginTop: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextLabel: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginVertical: 12 },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailsCol: {
    gap: 8,
    flex: 1.2,
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  vehicleThumbnail: {
    width: 90,
    height: 60,
    borderRadius: 6,
  },
  specialNoteBox: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  specialNoteText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
