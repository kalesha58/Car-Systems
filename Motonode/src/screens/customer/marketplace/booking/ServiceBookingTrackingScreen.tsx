import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingTracking
>;

const TRACKING_STEPS = [
  { label: 'Booking Confirmed', completed: true, active: false },
  { label: 'Service in Progress', completed: false, active: true },
  { label: 'Service Completed', completed: false, active: false },
  { label: 'Payment Completed', completed: false, active: false },
];

export function ServiceBookingTrackingScreen({ route, navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { bookingId } = route.params;

  const { getService, getLocation, draft } = useServiceBooking();
  const service = getService();
  const location = getLocation();

  const dateLabel = draft.date
    ? new Date(draft.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.headerForeground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>My Booking</Text>
        <View style={styles.iconBtn} />
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.idRow}>
          <View>
            <Text style={[styles.idLabel, { color: colors.textSecondary }]}>Booking ID</Text>
            <Text style={[styles.idValue, { color: colors.textPrimary }]}>{bookingId}</Text>
          </View>
          <View style={[styles.confirmedBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.confirmedText, { color: colors.success }]}>Confirmed</Text>
          </View>
        </View>

        <View style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service?.name}</Text>
          <Text style={[styles.serviceMeta, { color: colors.textSecondary }]}>
            {dateLabel} • {draft.timeSlot} • {location?.name}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Booking Status</Text>
        <View style={[styles.timeline, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {TRACKING_STEPS.map((step, idx) => (
            <View key={step.label} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View
                  style={[
                    styles.stepDot,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                    step.completed && { backgroundColor: colors.success, borderColor: colors.success },
                    step.active && { borderColor: colors.primary, backgroundColor: colors.card },
                  ]}
                >
                  {step.completed && <Feather name="check" size={10} color="#fff" />}
                </View>
                {idx < TRACKING_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      { backgroundColor: colors.border },
                      step.completed && { backgroundColor: colors.success },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: step.completed || step.active ? colors.textPrimary : colors.textTertiary },
                  (step.completed || step.active) && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          style={styles.footerAction}
          onPress={() => {
            lightHaptic();
            Alert.alert('Call Workshop', `Calling ${location?.name ?? 'service center'}…`);
          }}
        >
          <Feather name="phone" size={18} color={colors.primary} />
          <Text style={[styles.footerActionText, { color: colors.primary }]}>Call</Text>
        </Pressable>
        <Pressable
          style={styles.footerAction}
          onPress={() => {
            lightHaptic();
            Alert.alert('Directions', `Opening directions to ${location?.address ?? 'service center'}`);
          }}
        >
          <Feather name="navigation" size={18} color={colors.primary} />
          <Text style={[styles.footerActionText, { color: colors.primary }]}>Directions</Text>
        </Pressable>
        <Pressable
          style={styles.footerAction}
          onPress={() => {
            lightHaptic();
            Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
              { text: 'No', style: 'cancel' },
              { text: 'Yes, Cancel', style: 'destructive' },
            ]);
          }}
        >
          <Feather name="x-circle" size={18} color={colors.destructive} />
          <Text style={[styles.footerActionText, { color: colors.destructive }]}>Cancel</Text>
        </Pressable>
      </View>
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
    paddingBottom: 14,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 16 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  idValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  confirmedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmedText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  serviceCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  serviceName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  serviceMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  timeline: { borderRadius: 14, borderWidth: 1, padding: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 48 },
  stepLeft: { alignItems: 'center', width: 20 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  stepDotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  stepDotActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginVertical: 4,
  },
  stepLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', paddingTop: 1 },
  stepLabelActive: { fontFamily: 'Inter_600SemiBold' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  footerAction: { alignItems: 'center', gap: 4, padding: 8 },
  footerActionText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
