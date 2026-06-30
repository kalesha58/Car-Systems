import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { createTestDrive } from '@services/testDrive.service';
import { getVehicleById } from '@services/vehicle.service';
import type { IDealerVehicle } from '@app-types/vehicle';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getVehicleDisplayName, getVehicleId } from '@utils/displayMappers';
import { successHaptic, lightHaptic } from '@utils/haptics';
import { VehicleDetailSkeleton } from '@components/loaders';

const { height: screenHeight } = Dimensions.get('window');

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.DealerStore]: { id: string };
};

type VehicleDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.VehicleDetail
>;

export function VehicleDetailScreen({ route, navigation }: VehicleDetailScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [vehicle, setVehicle] = useState<IDealerVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [bookingDate, setBookingDate] = useState('Tomorrow');
  const [bookingSlot, setBookingSlot] = useState('10:00 AM - 12:00 PM');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadVehicle = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getVehicleById(id);
        if (cancelled) return;
        const data = response.Response as any;
        let found = null;
        if (data) {
          if (Array.isArray(data.vehicles)) {
            found = data.vehicles[0];
          } else if (data.id || data._id) {
            found = data;
          }
        }
        if (found) {
          setVehicle(found);
        } else {
          setError('Vehicle not found');
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load vehicle'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadVehicle();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const vehicleImages = useMemo(() => {
    if (!vehicle) return [];
    const primary = vehicle.images?.[0];
    if (vehicle.images && vehicle.images.length > 0) return vehicle.images;
    return primary ? [primary] : [];
  }, [vehicle]);

  const vehicleSpecs = useMemo(() => {
    if (!vehicle) return [];
    const specs: { label: string; value: string }[] = [];
    if (vehicle.fuelType) specs.push({ label: 'Fuel Type', value: vehicle.fuelType });
    if (vehicle.transmission) specs.push({ label: 'Transmission', value: vehicle.transmission });
    if (vehicle.mileage != null) specs.push({ label: 'Mileage', value: `${vehicle.mileage} km` });
    if (vehicle.color) specs.push({ label: 'Color', value: vehicle.color });
    if (vehicle.condition) specs.push({ label: 'Condition', value: vehicle.condition });
    vehicle.features?.forEach((feature) => specs.push({ label: 'Feature', value: feature }));
    return specs;
  }, [vehicle]);

  const displayName = vehicle ? getVehicleDisplayName(vehicle) : '';
  const dealerName = vehicle?.dealer?.businessName ?? 'Authorized Dealer';
  const dealerId = vehicle?.dealerId || vehicle?.dealer?.id || '';

  if (loading) {
    return <VehicleDetailSkeleton />;
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>{error ?? 'Vehicle not found'}</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleBookTestDrive = () => {
    lightHaptic();
    setIsBookingModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    successHaptic();
    setIsBookingSubmitting(true);
    setBookingError(null);

    const dateMap: Record<string, string> = {
      Today: new Date().toISOString().slice(0, 10),
      Tomorrow: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    };

    try {
      await createTestDrive({
        vehicleId: getVehicleId(vehicle),
        preferredDate: dateMap[bookingDate] ?? new Date().toISOString().slice(0, 10),
        preferredTime: bookingSlot.split(' - ')[0] ?? bookingSlot,
        notes: `Test drive for ${displayName}`,
      });
      setIsBookingSuccess(true);
    } catch (err) {
      setBookingError(getApiErrorMessage(err, 'Failed to book test drive'));
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleCloseBookingModal = () => {
    lightHaptic();
    setIsBookingModalVisible(false);
    setIsBookingSuccess(false);
    setBookingError(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.headerSide} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.headerForeground} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: colors.headerForeground }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
            <Feather name="share-2" size={20} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Multi-Image Sidebar selector */}
        <View style={styles.imageContainerRow}>
          <View style={styles.thumbnailSidebar}>
            {vehicleImages.map((imgUri, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.thumbnailWrapper,
                  {
                    borderColor: activeImageIndex === idx ? colors.textPrimary : colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => {
                  lightHaptic();
                  setActiveImageIndex(idx);
                }}
              >
                <Image source={{ uri: imgUri }} style={styles.thumbnailImg} resizeMode="cover" />
              </Pressable>
            ))}
          </View>

          <View style={[styles.mainImagePanel, { backgroundColor: colors.muted }]}>
            <Image source={{ uri: vehicleImages[activeImageIndex] ?? vehicle.images?.[0] }} style={styles.vehicleImage} resizeMode="cover" />
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>{activeImageIndex + 1} / {vehicleImages.length}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Brand & Name header */}
          <Text style={[styles.brandText, { color: colors.textSecondary }]}>{vehicle.brand.toUpperCase()}</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
            <View style={[styles.yearBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.yearText, { color: colors.textSecondary }]}>{vehicle.year}</Text>
            </View>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: colors.textPrimary }]}>₹{(vehicle.price / 100000).toFixed(2)} Lakh</Text>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Estimated on-road price</Text>
          </View>

          {/* Premium Quick Highlights grid */}
          <View style={styles.quickSpecsGrid}>
            <View style={[styles.specGridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.specIconWrapper, { backgroundColor: colors.muted }]}>
                <Feather name="droplet" size={16} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.specLabelTitle, { color: colors.textSecondary }]}>Fuel Type</Text>
                <Text style={[styles.specValueVal, { color: colors.textPrimary }]}>{vehicle.fuelType ?? '—'}</Text>
              </View>
            </View>

            <View style={[styles.specGridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.specIconWrapper, { backgroundColor: colors.muted }]}>
                <Feather name="settings" size={16} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.specLabelTitle, { color: colors.textSecondary }]}>Transmission</Text>
                <Text style={[styles.specValueVal, { color: colors.textPrimary }]}>{vehicle.transmission ?? '—'}</Text>
              </View>
            </View>

            <View style={[styles.specGridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.specIconWrapper, { backgroundColor: colors.muted }]}>
                <Feather name="trending-up" size={16} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.specLabelTitle, { color: colors.textSecondary }]}>Mileage / Range</Text>
                <Text style={[styles.specValueVal, { color: colors.textPrimary }]}>
                  {vehicle.mileage != null ? `${vehicle.mileage} km` : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Technical Specifications */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Specifications</Text>
          <View style={[styles.specsContainer, { borderColor: colors.border }]}>
            {vehicleSpecs.length > 0 ? (
              vehicleSpecs.map((spec, i) => (
                <View
                  key={`${spec.label}-${i}`}
                  style={[
                    styles.specRow,
                    i < vehicleSpecs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}
                >
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{spec.label}</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{spec.value}</Text>
                </View>
              ))
            ) : (
              <View style={styles.specRow}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Details</Text>
                <Text style={[styles.specValue, { color: colors.textPrimary }]}>Available on request</Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          
          {/* About Section */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About Vehicle</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {vehicle.description ?? 'Contact the dealer for more details about this vehicle.'}
          </Text>

          {/* Dealer Card */}
          <Pressable
            style={[styles.dealerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => dealerId && navigation.navigate(CustomerStackRoutes.DealerStore, { id: dealerId })}
          >
            <View style={[styles.dealerIcon, { backgroundColor: colors.primarySubtle }]}>
              <Feather name="briefcase" size={20} color={colors.link} />
            </View>
            <View style={styles.dealerInfo}>
              <Text style={[styles.dealerName, { color: colors.textPrimary }]}>{dealerName}</Text>
              <Text style={[styles.dealerLabel, { color: colors.textTertiary }]}>
                Authorized Dealer{vehicle.dealer?.address ? ` • ${vehicle.dealer.address}` : ''}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Pressable
              style={[styles.callBtn, { backgroundColor: colors.primarySubtle }]}
              onPress={(e) => { e.stopPropagation(); lightHaptic(); }}
            >
              <Feather name="phone" size={18} color={colors.link} />
            </Pressable>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.enquireBtn, { borderColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.enquireBtnText, { color: colors.primary }]}>Enquire Now</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.testDriveBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
          onPress={handleBookTestDrive}
        >
          <Feather name="truck" size={18} color={colors.primaryForeground} />
          <Text style={[styles.testDriveBtnText, { color: colors.primaryForeground }]}>Book Test Drive</Text>
        </Pressable>
      </View>

      {/* Test Drive Booking Modal Sheet */}
      <Modal
        visible={isBookingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseBookingModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBgPressable} onPress={handleCloseBookingModal} />
          
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Book a Test Drive</Text>
              <Pressable style={styles.closeBtn} onPress={handleCloseBookingModal}>
                <Feather name="x" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            {isBookingSuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrapper}>
                  <Feather name="check-circle" size={48} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Booking Confirmed!</Text>
                <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                  Your test drive for {displayName} has been booked for {bookingDate} at {bookingSlot}.
                </Text>
                <Pressable style={[styles.successDoneBtn, { backgroundColor: colors.primary }]} onPress={handleCloseBookingModal}>
                  <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Awesome</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.modalBody}>
                {/* Vehicle Quick Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
                  <Image source={{ uri: vehicle.images?.[0] ?? '' }} style={styles.summaryImg} />
                  <View>
                    <Text style={[styles.summaryBrand, { color: colors.link }]}>{vehicle.brand}</Text>
                    <Text style={[styles.summaryName, { color: colors.textPrimary }]}>{displayName}</Text>
                    <Text style={[styles.summarySpecs, { color: colors.textSecondary }]}>
                      {vehicle.fuelType ?? '—'} • {vehicle.transmission ?? '—'}
                    </Text>
                  </View>
                </View>

                {/* Date Selector */}
                <Text style={[styles.selectorLabel, { color: colors.textPrimary }]}>Select Date</Text>
                <View style={styles.selectorRow}>
                  {['Today', 'Tomorrow', 'Wed, July 1', 'Thu, July 2'].map((date) => (
                    <Pressable
                      key={date}
                      style={[
                        styles.selectorChip,
                        { backgroundColor: colors.card },
                        bookingDate === date
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { borderColor: colors.border },
                      ]}
                      onPress={() => {
                        lightHaptic();
                        setBookingDate(date);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          bookingDate === date
                            ? { color: colors.primaryForeground }
                            : { color: colors.textSecondary },
                        ]}
                      >
                        {date}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Time Slot Selector */}
                <Text style={[styles.selectorLabel, { color: colors.textPrimary, marginTop: 16 }]}>Select Time Slot</Text>
                <View style={styles.selectorRow}>
                  {['10:00 AM - 12:00 PM', '1:00 PM - 3:00 PM', '4:00 PM - 6:00 PM'].map((slot) => (
                    <Pressable
                      key={slot}
                      style={[
                        styles.selectorChip,
                        { backgroundColor: colors.card },
                        bookingSlot === slot
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { borderColor: colors.border },
                      ]}
                      onPress={() => {
                        lightHaptic();
                        setBookingSlot(slot);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          bookingSlot === slot
                            ? { color: colors.primaryForeground }
                            : { color: colors.textSecondary },
                        ]}
                      >
                        {slot}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {bookingError ? (
                  <Text style={[styles.bookingErrorText, { color: colors.destructive }]}>{bookingError}</Text>
                ) : null}

                {/* Confirm Action Button */}
                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={handleConfirmBooking}
                  disabled={isBookingSubmitting}
                >
                  {isBookingSubmitting ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.confirmBtnText, { color: colors.primaryForeground }]}>
                      Confirm Test Drive Booking
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  headerSide: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  headerSideRight: {
    justifyContent: 'flex-end',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
    height: 250,
  },
  thumbnailSidebar: {
    width: 54,
    gap: 8,
    justifyContent: 'center',
  },
  thumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 2,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  mainImagePanel: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    height: '100%',
    position: 'relative',
  },
  vehicleImage: { width: '100%', height: '100%' },
  pageIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageIndicatorText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, marginTop: 12, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  brandText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  yearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yearText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  priceRow: {
    marginBottom: 16,
  },
  priceText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  quickSpecsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  specGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  specIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specLabelTitle: {
    fontSize: 8,
    fontFamily: 'Inter_500Medium',
  },
  specValueVal: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    marginTop: 1,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  specsContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  specLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  specValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginVertical: 16 },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  dealerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, marginTop: 16, borderWidth: 1 },
  dealerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dealerInfo: { flex: 1 },
  dealerName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  dealerLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  callBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { flexDirection: 'row', gap: 12, borderTopWidth: 1, padding: 16, position: 'absolute', bottom: 0, left: 0, right: 0 },
  enquireBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, borderWidth: 1.5 },
  enquireBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  testDriveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12 },
  testDriveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  
  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBgPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: screenHeight * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryImg: {
    width: 60,
    height: 44,
    borderRadius: 6,
  },
  summaryBrand: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  summaryName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    marginTop: 1,
  },
  summarySpecs: {
    fontSize: 10,
    marginTop: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  bookingErrorText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  successIconWrapper: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  successSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  successDoneBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
