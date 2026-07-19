import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerBookingStepper } from '@components/bookings/DealerBookingStepper';
import { DealerOrderDetailSkeleton } from '@components/loaders';
import { DealerStackRoutes } from '@constants/routes';
import type { CustomerBooking } from '@data/bookingsData';
import { useColors } from '@hooks/useColors';
import { getDealerTestDriveById } from '@services/testDrive.service';
import {
  getDealerServiceBookings,
  updateServiceBookingStatus,
} from '@services/serviceBooking.service';
import { updateTestDriveStatus } from '@services/testDrive.service';
import {
  mapServiceBookingToCustomerBooking,
  mapTestDriveToCustomerBooking,
} from '@utils/bookingMappers';
import { themeLight } from '@theme/colors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import type { ServiceBookingStatus } from '../../../types/serviceBooking';
import type { TestDriveStatus } from '../../../types/testDrive';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.DealerBookingDetail
>;

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Feather name={icon} size={14} color={colors.icon} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function DealerBookingDetailScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { bookingId, bookingType } = route.params;
  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      if (bookingType === 'test_drive') {
        const response = await getDealerTestDriveById(bookingId);
        setBooking(mapTestDriveToCustomerBooking(response.Response));
      } else {
        const data = await getDealerServiceBookings({ limit: 100 });
        const found = data?.bookings?.find((b) => b.id === bookingId);
        setBooking(found ? mapServiceBookingToCustomerBooking(found) : null);
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId, bookingType]);

  useFocusEffect(
    useCallback(() => {
      fetchBooking();
    }, [fetchBooking]),
  );

  const runAction = async (status: CustomerBooking['status']) => {
    if (!booking) return;
    lightHaptic();
    try {
      if (booking.type === 'test_drive') {
        const map: Partial<Record<CustomerBooking['status'], TestDriveStatus>> = {
          confirmed: 'approved',
          completed: 'completed',
          cancelled: 'cancelled',
          rejected: 'rejected',
          in_progress: 'approved',
        };
        await updateTestDriveStatus(bookingId, { status: map[status] ?? 'pending' });
      } else {
        const map: Partial<Record<CustomerBooking['status'], ServiceBookingStatus>> = {
          confirmed: 'scheduled',
          in_progress: 'in_progress',
          completed: 'completed',
          cancelled: 'cancelled',
        };
        await updateServiceBookingStatus(bookingId, { status: map[status] ?? 'new' });
      }
      await fetchBooking();
      if (status === 'completed') successHaptic();
    } catch {
      Alert.alert('Error', 'Failed to update booking status.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card }]}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Booking Details</Text>
          <View style={styles.headerRight} />
        </View>
        <DealerOrderDetailSkeleton />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ padding: 24, color: colors.textSecondary }}>Booking not found</Text>
      </View>
    );
  }

  const isService = booking.type === 'service';

  const dateLabel = booking.date
    ? new Date(booking.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const shortDateLabel = booking.date
    ? `${new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${booking.timeSlot}`
    : booking.timeSlot;

  const vehicleMeta = [booking.vehicleBrand, booking.vehicleName, booking.vehicleReg]
    .filter(Boolean)
    .join(' • ');

  const showAcceptReject =
    (isService && booking.status === 'pending') ||
    (!isService && booking.status === 'pending');

  return (
    <View style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card }]}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Booking Details</Text>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => Alert.alert('Call Customer', `Calling ${booking.customerPhone || 'customer'}…`)}
          >
            <Feather name="phone" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => lightHaptic()}>
            <Feather name="more-vertical" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
      >
        <DealerBookingStepper status={booking.status} dateTimeLabel={shortDateLabel} />

        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>
                {booking.status === 'pending' ? 'New Booking' : 'Booking'}
              </Text>
            </View>
            <Pressable
              style={styles.idCopyRow}
              onPress={() => Alert.alert('Copied', `Booking ID ${booking.id} copied.`)}
            >
              <Text style={[styles.idText, { color: colors.textTertiary }]}>
                Booking ID: {booking.id}
              </Text>
              <Feather name="copy" size={12} color={colors.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            {booking.vehicleImage ? (
              <Image source={{ uri: booking.vehicleImage }} style={styles.heroThumb} />
            ) : (
              <View style={[styles.heroThumb, styles.heroThumbPlaceholder]}>
                <Feather name="truck" size={24} color="#94A3B8" />
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {isService ? booking.serviceName : `Test Drive — ${booking.vehicleName}`}
              </Text>
              {vehicleMeta ? (
                <Text style={[styles.heroMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                  {vehicleMeta}
                </Text>
              ) : null}
              <View style={styles.iconLine}>
                <Feather name="calendar" size={12} color={colors.icon} />
                <Text style={[styles.iconLineText, { color: colors.textSecondary }]}>
                  {dateLabel} • {booking.timeSlot}
                </Text>
              </View>
              <View style={styles.iconLine}>
                <Feather name="map-pin" size={12} color={colors.icon} />
                <Text style={[styles.iconLineText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {booking.workshopName ?? booking.dealerName}
                  {booking.workshopAddress ? `, ${booking.workshopAddress}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {showAcceptReject && (
            <View style={styles.acceptRejectRow}>
              <Pressable style={styles.acceptOutlineBtn} onPress={() => runAction('confirmed')}>
                <Feather name="check" size={16} color={colors.icon} />
                <Text style={styles.acceptOutlineText}>Accept Booking</Text>
              </Pressable>
              <Pressable
                style={styles.rejectOutlineBtn}
                onPress={() => runAction(isService ? 'cancelled' : 'rejected')}
              >
                <Feather name="x" size={16} color="#EF4444" />
                <Text style={styles.rejectOutlineText}>Reject Booking</Text>
              </Pressable>
            </View>
          )}
        </View>

        <SectionCard title="Customer Details" icon="user">
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Feather name="user" size={20} color={colors.icon} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                {booking.customerName}
              </Text>
              {booking.customerPhone ? (
                <Text style={[styles.customerSub, { color: colors.textSecondary }]}>
                  {booking.customerPhone}
                </Text>
              ) : null}
            </View>
          </View>
        </SectionCard>

        {booking.notes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Feather name="edit-3" size={14} color="#D97706" />
              <Text style={styles.notesTitle}>Customer Notes</Text>
            </View>
            <Text style={styles.notesBody}>{booking.notes}</Text>
          </View>
        )}

        {isService && (
          <>
            <Text style={[styles.dealerActionsTitle, { color: colors.textPrimary }]}>
              Dealer Actions
            </Text>
            <View style={styles.dealerActionsRow}>
              <Pressable
                style={[
                  styles.actionTile,
                  { backgroundColor: '#F2F2F2' },
                  booking.status !== 'confirmed' && styles.actionTileDisabled,
                ]}
                onPress={() => booking.status === 'confirmed' && runAction('in_progress')}
                disabled={booking.status !== 'confirmed'}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#E60012' }]}>
                  <Feather name="play" size={12} color="#fff" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                  Start Service
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionTile,
                  { backgroundColor: '#ECFDF5' },
                  booking.status !== 'in_progress' && styles.actionTileDisabled,
                ]}
                onPress={() => booking.status === 'in_progress' && runAction('completed')}
                disabled={booking.status !== 'in_progress'}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                  Complete Service
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerRight: { flexDirection: 'row' },
  content: { padding: 16, gap: 14 },
  heroCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newBadge: { backgroundColor: '#F2F2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  newBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary },
  idCopyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  idText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  heroBody: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  heroThumb: { width: 80, height: 60, borderRadius: 10 },
  heroThumbPlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 20 },
  heroMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  iconLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },
  iconLineText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  acceptRejectRow: { flexDirection: 'row', gap: 10 },
  acceptOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E60012',
    backgroundColor: '#fff',
  },
  acceptOutlineText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary },
  rejectOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: '#fff',
  },
  rejectOutlineText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#EF4444' },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: { flex: 1, gap: 2 },
  customerName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  customerSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  notesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    gap: 8,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notesTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#92400E' },
  notesBody: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#78350F', lineHeight: 18 },
  dealerActionsTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 4 },
  dealerActionsRow: { flexDirection: 'row', gap: 8 },
  actionTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  actionTileDisabled: { opacity: 0.4 },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 12,
  },
});
