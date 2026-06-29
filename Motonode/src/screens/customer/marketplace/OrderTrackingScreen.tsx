import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
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

type OrderTrackingScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.OrderTracking
>;

export function OrderTrackingScreen({ route, navigation }: OrderTrackingScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { id } = route.params;

  const [itemsExpanded, setItemsExpanded] = useState(true);

  const steps = [
    { label: 'Placed', date: '10 May', completed: true },
    { label: 'Packed', date: '11 May', completed: true },
    { label: 'Shipped', date: '11 May', completed: true },
    { label: 'Out for Delivery', date: '14 May', completed: true, active: true },
    { label: 'Delivered', date: '', completed: false },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Header */}
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Tracking</Text>
        <Pressable style={styles.iconBtn}>
          <Feather name="headphones" size={20} color="#ffffff" />
        </Pressable>
      </ChromeHeader>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 20 }]}>
        
        {/* Order ID & Placement details */}
        <View style={styles.orderIdRow}>
          <View>
            <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Order ID</Text>
            <Text style={[styles.orderIdValue, { color: colors.textPrimary }]}>MN1234567889</Text>
            <Text style={[styles.orderPlacedOn, { color: colors.textTertiary }]}>Placed on 10 May 2026, 09:30 AM</Text>
          </View>
          <Pressable style={styles.copyBtn} onPress={() => successHaptic()}>
            <Text style={styles.copyBtnText}>Copy</Text>
          </Pressable>
        </View>

        {/* Status Card (Out for Delivery) */}
        <View style={[styles.statusCard, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Out for Delivery</Text>
            <Text style={styles.statusSubtitle}>Arriving today by 8 PM</Text>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=300&auto=format&fit=crop&q=80' }}
            style={styles.scooterImg}
            resizeMode="contain"
          />
        </View>

        {/* Stepper Timeline */}
        <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.timelineStepperRow}>
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              return (
                <React.Fragment key={step.label}>
                  <View style={styles.stepNode}>
                    <View
                      style={[
                        styles.circleNode,
                        step.completed ? { backgroundColor: '#7E22CE' } : { backgroundColor: '#E2E8F0' },
                        step.active && { borderWidth: 2, borderColor: '#C084FC' }
                      ]}
                    >
                      {step.completed ? (
                        <Feather name="check" size={10} color="#fff" />
                      ) : (
                        <View style={styles.circleInner} />
                      )}
                    </View>
                    <Text style={[styles.stepLabel, step.completed ? { color: colors.textPrimary } : { color: colors.textSecondary }]} numberOfLines={1}>
                      {step.label}
                    </Text>
                    {step.date ? (
                      <Text style={styles.stepDate}>{step.date}</Text>
                    ) : null}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        steps[idx + 1].completed ? { backgroundColor: '#7E22CE' } : { backgroundColor: '#E2E8F0' }
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Delivery Partner Details */}
        <View style={[styles.partnerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Delivery Partner</Text>
          <View style={styles.partnerRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
              style={styles.partnerAvatar}
            />
            <View style={styles.partnerInfo}>
              <Text style={[styles.partnerName, { color: colors.textPrimary }]}>Ravi Kumar</Text>
              <View style={styles.partnerRatingRow}>
                <Feather name="star" size={12} color="#FBBF24" style={{ marginRight: 2 }} />
                <Text style={styles.partnerRatingVal}>4.8</Text>
              </View>
            </View>
            <View style={styles.partnerActions}>
              <Pressable style={styles.actionIconBtn} onPress={() => lightHaptic()}>
                <Feather name="phone" size={16} color="#2563EB" />
              </Pressable>
              <Pressable style={styles.actionIconBtn} onPress={() => lightHaptic()}>
                <Feather name="message-square" size={16} color="#2563EB" />
              </Pressable>
            </View>
          </View>

          {/* Courier Progress Track Illustration */}
          <View style={styles.courierMapContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&auto=format&fit=crop&q=80' }}
              style={styles.mapBg}
              resizeMode="cover"
            />
            <View style={styles.mapOverlay}>
              <View style={styles.mapPin}>
                <Feather name="briefcase" size={14} color="#fff" />
                <Text style={styles.pinText}>Motonode Hub</Text>
              </View>

              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>3.2 km away</Text>
              </View>

              <View style={styles.mapPinDest}>
                <Feather name="map-pin" size={14} color="#fff" />
                <Text style={styles.pinText}>Your Location</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items Accordion */}
        <View style={[styles.accordionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.accordionHeader} onPress={() => setItemsExpanded(!itemsExpanded)}>
            <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>Order Items (2)</Text>
            <Feather name={itemsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </Pressable>

          {itemsExpanded && (
            <View style={styles.accordionBody}>
              <View style={styles.itemRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=100&auto=format&fit=crop&q=80' }}
                  style={styles.itemThumb}
                />
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]}>Bosch Disc Brake Pad Set</Text>
                  <Text style={[styles.itemQty, { color: colors.textSecondary }]}>Qty: 1</Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹1,499</Text>
              </View>

              <View style={styles.itemRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=100&auto=format&fit=crop&q=80' }}
                  style={styles.itemThumb}
                />
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]}>Motul Brake Fluid DOT 4</Text>
                  <Text style={[styles.itemQty, { color: colors.textSecondary }]}>Qty: 1</Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹300</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
                <Text style={[styles.totalVal, { color: colors.textPrimary }]}>₹1,799</Text>
              </View>

              <Pressable style={styles.billLinkBtn}>
                <Text style={styles.billLinkText}>View Bill</Text>
                <Feather name="chevron-right" size={12} color="#2563EB" />
              </Pressable>
            </View>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  scrollContent: { padding: 16, gap: 16, paddingTop: 70 },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  orderIdValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  orderPlacedOn: { fontSize: 10, marginTop: 2 },
  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  copyBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#475569' },
  statusCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#7E22CE' },
  statusSubtitle: { fontSize: 12, color: '#6B21A8', marginTop: 4 },
  scooterImg: { width: 90, height: 70 },
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  timelineStepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepNode: {
    alignItems: 'center',
    width: 60,
  },
  circleNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  stepLabel: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginTop: 6,
  },
  stepDate: {
    fontSize: 7,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: 'Inter_500Medium',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: 10,
  },
  partnerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  partnerRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  partnerRatingVal: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#64748B' },
  partnerActions: { flexDirection: 'row', gap: 6 },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierMapContainer: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    position: 'relative',
  },
  mapBg: { width: '100%', height: '100%' },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  mapPin: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mapPinDest: {
    alignItems: 'center',
    backgroundColor: '#7E22CE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pinText: { color: '#fff', fontSize: 8, fontFamily: 'Inter_700Bold', marginTop: 2 },
  distanceBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  distanceText: { color: '#000', fontSize: 9, fontFamily: 'Inter_700Bold' },
  accordionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  accordionBody: {
    marginTop: 16,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  itemMeta: { flex: 1 },
  itemName: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  itemQty: { fontSize: 10, marginTop: 1 },
  itemPrice: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginVertical: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  totalVal: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  billLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  billLinkText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#2563EB' },
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
