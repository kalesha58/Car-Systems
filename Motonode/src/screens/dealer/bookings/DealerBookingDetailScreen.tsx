import React, { useCallback } from 'react';
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
import { DealerStackRoutes } from '@constants/routes';
import { useBookings } from '@context/index';
import type { CustomerBooking } from '@data/bookingsData';
import { SERVICE_ADDONS, SERVICES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.DealerBookingDetail
>;

function getBookingPricing(booking: CustomerBooking) {
  const service = SERVICES.find((s) => s.id === booking.serviceId);
  const serviceAmount = service?.price ?? booking.total;
  const addons = (booking.addonNames ?? []).map((name) => {
    const addon = SERVICE_ADDONS.find((a) => a.name === name);
    return { name, price: addon?.price ?? 0 };
  });
  const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
  return { serviceAmount, addons, addonsTotal };
}

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
        <Feather name={icon} size={14} color="#2563EB" />
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
  const { bookingId } = route.params;
  const { getBookingById, loadBookings, updateBookingStatus } = useBookings();

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const booking = getBookingById(bookingId);

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ padding: 24, color: colors.textSecondary }}>Booking not found</Text>
      </View>
    );
  }

  const isService = booking.type === 'service';
  const pricing = isService ? getBookingPricing(booking) : null;

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

  const vehicleMeta = [
    booking.vehicleBrand,
    booking.vehicleName,
    booking.vehicleReg,
    booking.vehicleYear,
    booking.vehicleFuel,
  ]
    .filter(Boolean)
    .join(' • ');

  const customerEmail =
    booking.customerEmail ??
    `${booking.customerName.toLowerCase().replace(/\s+/g, '.')}@email.com`;

  const runAction = async (status: CustomerBooking['status']) => {
    lightHaptic();
    await updateBookingStatus(bookingId, status);
    if (status === 'completed') successHaptic();
  };

  const showAcceptReject =
    (isService && booking.status === 'upcoming') ||
    (!isService && booking.status === 'pending');

  return (
    <View style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card }]}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Booking Details</Text>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => Alert.alert('Call Customer', `Calling ${booking.customerPhone}…`)}
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

        {/* Hero booking card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>
                {booking.status === 'upcoming' || booking.status === 'pending'
                  ? 'New Booking'
                  : 'Booking'}
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
                <Feather name="calendar" size={12} color="#2563EB" />
                <Text style={[styles.iconLineText, { color: colors.textSecondary }]}>
                  {dateLabel} • {booking.timeSlot}
                </Text>
              </View>
              <View style={styles.iconLine}>
                <Feather name="map-pin" size={12} color="#2563EB" />
                <Text style={[styles.iconLineText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {booking.workshopName ?? booking.dealerName}
                  {booking.workshopAddress ? `, ${booking.workshopAddress}` : ''}
                  {booking.workshopDistance ? ` • ${booking.workshopDistance} away` : ''}
                </Text>
              </View>
            </View>
            {booking.total > 0 && (
              <Text style={[styles.heroPrice, { color: colors.textPrimary }]}>
                ₹{booking.total.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <Pressable style={styles.viewCustomerLink} onPress={() => lightHaptic()}>
            <Text style={styles.viewCustomerText}>View Customer Details</Text>
            <Feather name="chevron-right" size={14} color="#2563EB" />
          </Pressable>

          {showAcceptReject && (
            <>
              <View style={styles.acceptRejectRow}>
                <Pressable
                  style={styles.acceptOutlineBtn}
                  onPress={() => runAction(isService ? 'confirmed' : 'confirmed')}
                >
                  <Feather name="check" size={16} color="#2563EB" />
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
              <View style={styles.timerRow}>
                <Feather name="clock" size={12} color={colors.textTertiary} />
                <Text style={[styles.timerText, { color: colors.textTertiary }]}>
                  Auto reject in 15:00 mins if no action is taken
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Customer details */}
        <SectionCard title="Customer Details" icon="user">
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Feather name="user" size={20} color="#2563EB" />
            </View>
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                {booking.customerName}
              </Text>
              <Text style={[styles.customerSub, { color: colors.textSecondary }]}>
                {booking.customerPhone}
              </Text>
              <Text style={[styles.customerSub, { color: colors.textSecondary }]}>
                {customerEmail}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </View>
        </SectionCard>

        {/* Vehicle details */}
        <SectionCard title="Vehicle Details" icon="truck">
          <View style={styles.customerRow}>
            {booking.vehicleImage ? (
              <Image source={{ uri: booking.vehicleImage }} style={styles.vehicleThumb} />
            ) : (
              <View style={[styles.vehicleThumb, styles.heroThumbPlaceholder]}>
                <Feather name="truck" size={16} color="#94A3B8" />
              </View>
            )}
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                {booking.vehicleBrand} {booking.vehicleName}
              </Text>
              <Text style={[styles.customerSub, { color: colors.textSecondary }]}>
                {booking.vehicleReg}
              </Text>
              <Text style={[styles.customerSub, { color: colors.textSecondary }]}>
                {[booking.vehicleYear, booking.vehicleFuel].filter(Boolean).join(' • ')}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </View>
        </SectionCard>

        {/* Payment details */}
        {booking.total > 0 && (
          <SectionCard title="Payment Details" icon="credit-card">
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Payment Method</Text>
              <Text style={[styles.paymentValue, { color: colors.textPrimary }]}>Online</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Payment Status</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>
                  {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.paymentAmount, { color: colors.textPrimary }]}>
                ₹{booking.total.toLocaleString('en-IN')}
              </Text>
            </View>
            <Pressable style={styles.receiptBtn} onPress={() => lightHaptic()}>
              <Feather name="download" size={14} color="#2563EB" />
              <Text style={styles.receiptText}>View Payment Receipt</Text>
            </Pressable>
          </SectionCard>
        )}

        {/* Service & add-ons */}
        {isService && pricing && (
          <SectionCard title="Service & Add-ons" icon="tool">
            <View style={styles.serviceRow}>
              <Text style={[styles.serviceName, { color: colors.textPrimary }]}>
                {booking.serviceName}
              </Text>
              <Text style={[styles.servicePrice, { color: colors.textPrimary }]}>
                ₹{pricing.serviceAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            {pricing.addons.length > 0 && (
              <>
                <Text style={[styles.addonHeader, { color: colors.textSecondary }]}>
                  Add-on Services ({pricing.addons.length})
                </Text>
                {pricing.addons.map((addon) => (
                  <View key={addon.name} style={styles.addonRow}>
                    <View style={styles.addonLeft}>
                      <Feather name="check-circle" size={14} color="#10B981" />
                      <Text style={[styles.addonName, { color: colors.textPrimary }]}>{addon.name}</Text>
                    </View>
                    <Text style={[styles.addonPrice, { color: colors.textPrimary }]}>
                      ₹{addon.price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </>
            )}
            <View style={styles.totalBar}>
              <Text style={styles.totalBarLabel}>Total Amount</Text>
              <Text style={styles.totalBarValue}>₹{booking.total.toLocaleString('en-IN')}</Text>
            </View>
          </SectionCard>
        )}

        {/* Customer notes */}
        {booking.notes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Feather name="edit-3" size={14} color="#D97706" />
              <Text style={styles.notesTitle}>Customer Notes</Text>
            </View>
            <Text style={styles.notesBody}>{booking.notes}</Text>
          </View>
        )}

        {/* Dealer actions */}
        <Text style={[styles.dealerActionsTitle, { color: colors.textPrimary }]}>Dealer Actions</Text>
        <View style={styles.dealerActionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionTile,
              { backgroundColor: '#EFF6FF' },
              booking.status !== 'confirmed' && styles.actionTileDisabled,
              pressed && styles.actionTilePressed,
            ]}
            onPress={() => booking.status === 'confirmed' && runAction('in_progress')}
            disabled={booking.status !== 'confirmed'}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2563EB' }]}>
              <Feather name="play" size={12} color="#fff" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]} numberOfLines={2}>
              Start Service
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionTile,
              { backgroundColor: '#FFF7ED' },
              booking.status !== 'confirmed' && booking.status !== 'upcoming' && styles.actionTileDisabled,
              pressed && styles.actionTilePressed,
            ]}
            onPress={() =>
              (booking.status === 'confirmed' || booking.status === 'upcoming') &&
              runAction('in_progress')
            }
            disabled={booking.status !== 'confirmed' && booking.status !== 'upcoming'}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
              <Feather name="tool" size={12} color="#fff" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]} numberOfLines={2}>
              Mark In Progress
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionTile,
              { backgroundColor: '#F5F3FF' },
              booking.status !== 'in_progress' && styles.actionTileDisabled,
              pressed && styles.actionTilePressed,
            ]}
            onPress={() => Alert.alert('Quality Check', 'Quality check checklist opened.')}
            disabled={booking.status !== 'in_progress'}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
              <Feather name="clipboard" size={12} color="#fff" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]} numberOfLines={2}>
              Quality Check
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionTile,
              { backgroundColor: '#ECFDF5' },
              booking.status !== 'in_progress' && styles.actionTileDisabled,
              pressed && styles.actionTilePressed,
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
  newBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  newBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#2563EB' },
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
  heroPrice: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  viewCustomerLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewCustomerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
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
    borderColor: '#2563EB',
    backgroundColor: '#fff',
  },
  acceptOutlineText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#2563EB' },
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
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  timerText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleThumb: { width: 56, height: 42, borderRadius: 8 },
  customerInfo: { flex: 1, gap: 2 },
  customerName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  customerSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  paymentValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  paidBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  paidText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#10B981' },
  paymentAmount: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2563EB',
    marginTop: 4,
  },
  receiptText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  servicePrice: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  addonHeader: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 4 },
  addonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addonLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  addonName: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  addonPrice: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  totalBarLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#166534' },
  totalBarValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#166534' },
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
  actionTilePressed: { opacity: 0.85 },
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
