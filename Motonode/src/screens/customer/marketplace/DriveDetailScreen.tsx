import React from 'react';
import {
  Image,
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
import LinearGradient from 'react-native-linear-gradient';

import { CustomerStackRoutes } from '@constants/routes';
import { VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { successHaptic } from '@utils/haptics';

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
  DriveDetail: { id: string };
};

type DriveDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  'DriveDetail'
>;

export function DriveDetailScreen({ route, navigation }: DriveDetailScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = route.params;

  const vehicle = VEHICLES.find((v) => v.id === id) || VEHICLES[0];
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Panel */}
      <LinearGradient
        colors={['#1D4ED8', '#3B82F6']}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Drive Details</Text>
        <Pressable style={styles.iconBtn}>
          <Feather name="share-2" size={20} color="#ffffff" />
        </Pressable>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Vehicle Info Card */}
        <View style={[styles.vehicleOverviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.vehicleOverviewLeft}>
            <View style={styles.testDriveBadge}>
              <Feather name="navigation" size={10} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.testDriveBadgeText}>Test Drive</Text>
            </View>
            <Text style={[styles.vehicleBrand, { color: colors.textPrimary }]}>{vehicle.brand}</Text>
            <Text style={[styles.vehicleName, { color: colors.textPrimary }]}>{vehicle.name}</Text>
            
            {/* License plate chip */}
            <View style={[styles.plateChip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.plateText, { color: colors.textSecondary }]}>KA 05 EV 2210</Text>
              <Pressable onPress={() => successHaptic()}>
                <Feather name="copy" size={12} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.miniSpecsRow}>
              <View style={styles.miniSpec}>
                <Feather name="zap" size={12} color="#2563EB" />
                <Text style={[styles.miniSpecText, { color: colors.textSecondary }]}>{vehicle.fuel}</Text>
              </View>
              <View style={styles.miniSpec}>
                <Feather name="settings" size={12} color="#2563EB" />
                <Text style={[styles.miniSpecText, { color: colors.textSecondary }]}>{vehicle.transmission}</Text>
              </View>
              <View style={styles.miniSpec}>
                <Feather name="map-pin" size={12} color="#2563EB" />
                <Text style={[styles.miniSpecText, { color: colors.textSecondary }]}>Koramangala, Bengaluru</Text>
              </View>
            </View>
          </View>
          <Image source={{ uri: vehicle.image }} style={styles.vehicleOverviewImg} resizeMode="contain" />
        </View>

        {/* Tab Indicator inside Card (Matching reference mockup) */}
        <View style={[styles.subTabsContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.subTab, styles.subTabActive]}>
            <Feather name="navigation" size={14} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.subTabTextActive}>Test Drive</Text>
          </View>
          <View style={styles.subTab}>
            <Feather name="tool" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.subTabText, { color: colors.textSecondary }]}>Book Service</Text>
          </View>
        </View>

        {/* Date & Location Info Row */}
        <View style={styles.infoBlocksRow}>
          <View style={[styles.infoBlockItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.infoBlockIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="calendar" size={16} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBlockLabel, { color: colors.textSecondary }]}>Date & Time</Text>
              <Text style={[styles.infoBlockVal, { color: colors.textPrimary }]}>18 May 2026, Mon</Text>
              <Text style={[styles.infoBlockSub, { color: colors.textSecondary }]}>11:00 AM - 12:00 PM</Text>
            </View>
          </View>

          <View style={[styles.infoBlockItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.infoBlockIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="map-pin" size={16} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBlockLabel, { color: colors.textSecondary }]}>Location</Text>
              <Text style={[styles.infoBlockVal, { color: colors.textPrimary }]}>Motonode Koramangala</Text>
              <Text style={[styles.infoBlockSub, { color: colors.textSecondary }]} numberOfLines={1}>Bengaluru, Karnataka</Text>
            </View>
          </View>
        </View>

        {/* Booking Details Section */}
        <View style={[styles.detailsSectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Booking Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Feather name="file-text" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booking ID</Text>
            </View>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>TD65897123</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Feather name="calendar" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booked On</Text>
            </View>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>12 May 2026, 09:30 AM</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Feather name="compass" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booking Type</Text>
            </View>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeBlueText}>Test Drive</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Feather name="check-circle" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
            </View>
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeGreenText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Feather name="user" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booked For</Text>
            </View>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>Arjun Sharma</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Feather name="phone" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contact</Text>
            </View>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>+91 98765 43210</Text>
          </View>
        </View>

        {/* Dealer Profile details */}
        <View style={[styles.dealerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&auto=format&fit=crop&q=80' }}
            style={styles.dealerImg}
          />
          <View style={styles.dealerInfo}>
            <View style={styles.dealerHeaderRow}>
              <Text style={[styles.dealerName, { color: colors.textPrimary }]}>Motonode Koramangala</Text>
              <View style={styles.verifiedCheck}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            </View>
            <View style={styles.dealerRatingRow}>
              <Feather name="star" size={12} color="#FBBF24" style={{ marginRight: 2 }} />
              <Text style={styles.dealerRatingVal}>4.7</Text>
              <Text style={[styles.dealerReviews, { color: colors.textSecondary }]}> (512 reviews)</Text>
            </View>
            <Text style={[styles.dealerAddress, { color: colors.textSecondary }]} numberOfLines={2}>
              80 Feet Rd, Koramangala 3 Block, Bengaluru, Karnataka 560034
            </Text>
          </View>
          <View style={styles.dealerActions}>
            <Pressable style={styles.dealerIconAction}>
              <Feather name="phone" size={16} color="#2563EB" />
            </Pressable>
            <Pressable style={styles.dealerIconAction}>
              <Feather name="navigation" size={16} color="#2563EB" />
            </Pressable>
          </View>
        </View>

        {/* Important Instructions section */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Important Instructions</Text>
          <View style={styles.instructionsGrid}>
            <View style={styles.instructionItem}>
              <View style={[styles.instructionIconWrapper, { backgroundColor: '#EEF2F6' }]}>
                <Feather name="file-text" size={16} color="#3F83F8" />
              </View>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>Bring valid driving license</Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={[styles.instructionIconWrapper, { backgroundColor: '#EEF2F6' }]}>
                <Feather name="battery-charging" size={16} color="#10B981" />
              </View>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>Keep 80% battery for best experience</Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={[styles.instructionIconWrapper, { backgroundColor: '#EEF2F6' }]}>
                <Feather name="user" size={16} color="#8B5CF6" />
              </View>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>One person only during test drive</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <Pressable style={styles.cancelBtn}>
          <Feather name="x-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </Pressable>
        <Pressable style={[styles.rescheduleBtn, { backgroundColor: '#2563EB' }]}>
          <Feather name="calendar" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.rescheduleText}>Reschedule</Text>
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
    paddingBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
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
  scrollContent: { paddingBottom: 110, paddingHorizontal: 16, paddingTop: 70 },
  vehicleOverviewCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  vehicleOverviewLeft: {
    flex: 1,
  },
  testDriveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  testDriveBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  vehicleBrand: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  vehicleName: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 2 },
  plateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 10,
  },
  plateText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  miniSpecsRow: {
    gap: 6,
  },
  miniSpec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniSpecText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  vehicleOverviewImg: {
    width: 130,
    height: 90,
  },
  subTabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  subTabActive: {
    backgroundColor: '#EFF6FF',
  },
  subTabTextActive: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#2563EB',
  },
  subTabText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  infoBlocksRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  infoBlockItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  infoBlockIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlockLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  infoBlockVal: { fontSize: 11, fontFamily: 'Inter_700Bold', marginTop: 1 },
  infoBlockSub: { fontSize: 9, marginTop: 1 },
  detailsSectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  detailVal: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeBlueText: { color: '#1E40AF', fontSize: 10, fontFamily: 'Inter_700Bold' },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeGreenText: { color: '#065F46', fontSize: 10, fontFamily: 'Inter_700Bold' },
  dealerCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  dealerImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  dealerInfo: { flex: 1 },
  dealerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealerName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  verifiedCheck: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dealerRatingVal: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  dealerReviews: { fontSize: 10 },
  dealerAddress: { fontSize: 10, marginTop: 4 },
  dealerActions: { flexDirection: 'row', gap: 6 },
  dealerIconAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  instructionsGrid: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: { fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelText: { color: '#EF4444', fontSize: 13, fontFamily: 'Inter_700Bold' },
  rescheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  rescheduleText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
});
