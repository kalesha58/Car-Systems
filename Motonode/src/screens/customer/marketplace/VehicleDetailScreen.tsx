import React, { useState } from 'react';
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

import { CustomerStackRoutes } from '@constants/routes';
import { useAuth, useBookings } from '@context/index';
import { VEHICLES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { successHaptic, lightHaptic } from '@utils/haptics';

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
  const { user } = useAuth();
  const { createTestDriveBooking } = useBookings();
  const { id } = route.params;
  const vehicle = VEHICLES.find((v) => v.id === id);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Booking Modal States
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [bookingDate, setBookingDate] = useState('Tomorrow');
  const [bookingSlot, setBookingSlot] = useState('10:00 AM - 12:00 PM');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  // Selector state for dynamic image previews
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const vehicleImages = vehicle ? (
    vehicle.type === 'bike' ? [
      vehicle.image,
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80',
    ] : [
      vehicle.image,
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551830820-330a71b99659?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609429019995-8c40f49535a5?w=500&auto=format&fit=crop&q=80',
    ]
  ) : [];

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Vehicle not found</Text>
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

  const handleConfirmBooking = () => {
    successHaptic();
    setIsBookingSubmitting(true);
    setTimeout(async () => {
      const dateMap: Record<string, string> = {
        Today: new Date().toISOString().slice(0, 10),
        Tomorrow: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      };
      await createTestDriveBooking({
        customerId: user?.id ?? 'u1',
        customerName: user?.name ?? 'Customer',
        customerPhone: user?.phone ?? '',
        dealerId: vehicle.dealerId,
        dealerName: vehicle.dealerName,
        vehicleListingId: vehicle.id,
        vehicleName: vehicle.name,
        vehicleBrand: vehicle.brand,
        vehicleImage: vehicle.image,
        date: dateMap[bookingDate] ?? new Date().toISOString().slice(0, 10),
        timeSlot: bookingSlot.split(' - ')[0] ?? bookingSlot,
        notes: `Test drive for ${vehicle.name}`,
      });
      setIsBookingSubmitting(false);
      setIsBookingSuccess(true);
    }, 1500);
  };

  const handleCloseBookingModal = () => {
    lightHaptic();
    setIsBookingModalVisible(false);
    setIsBookingSuccess(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Panel */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]}>
          <Feather name="share-2" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Multi-Image Sidebar selector */}
        <View style={styles.imageContainerRow}>
          <View style={styles.thumbnailSidebar}>
            {vehicleImages.map((imgUri, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.thumbnailWrapper,
                  { borderColor: activeImageIndex === idx ? '#2563EB' : '#E2E8F0' }
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

          <View style={styles.mainImagePanel}>
            <Image source={{ uri: vehicleImages[activeImageIndex] }} style={styles.vehicleImage} resizeMode="cover" />
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>{activeImageIndex + 1} / {vehicleImages.length}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Brand & Name header */}
          <Text style={styles.brandText}>{vehicle.brand.toUpperCase()}</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{vehicle.name}</Text>
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{vehicle.year}</Text>
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
              <View style={styles.specIconWrapper}>
                <Feather name="droplet" size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.specLabelTitle, { color: colors.textSecondary }]}>Fuel Type</Text>
                <Text style={[styles.specValueVal, { color: colors.textPrimary }]}>{vehicle.fuel}</Text>
              </View>
            </View>

            <View style={[styles.specGridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.specIconWrapper}>
                <Feather name="settings" size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.specLabelTitle, { color: colors.textSecondary }]}>Transmission</Text>
                <Text style={[styles.specValueVal, { color: colors.textPrimary }]}>{vehicle.transmission}</Text>
              </View>
            </View>

            <View style={[styles.specGridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.specIconWrapper}>
                <Feather name="trending-up" size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.specLabelTitle, { color: colors.textSecondary }]}>Mileage / Range</Text>
                <Text style={[styles.specValueVal, { color: colors.textPrimary }]}>{vehicle.mileage}</Text>
              </View>
            </View>
          </View>

          {/* Technical Specifications */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Specifications</Text>
          <View style={[styles.specsContainer, { borderColor: colors.border }]}>
            {vehicle.specs.map((spec, i) => (
              <View
                key={spec.label}
                style={[
                  styles.specRow,
                  i < vehicle.specs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }
                ]}
              >
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{spec.label}</Text>
                <Text style={[styles.specValue, { color: colors.textPrimary }]}>{spec.value}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          
          {/* About Section */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About Vehicle</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{vehicle.description}</Text>

          {/* Dealer Card */}
          <Pressable
            style={[styles.dealerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate(CustomerStackRoutes.DealerStore, { id: vehicle.dealerId || 'd1' })}
          >
            <View style={[styles.dealerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="briefcase" size={20} color={colors.primary} />
            </View>
            <View style={styles.dealerInfo}>
              <Text style={[styles.dealerName, { color: colors.textPrimary }]}>{vehicle.dealerName}</Text>
              <Text style={[styles.dealerLabel, { color: colors.textTertiary }]}>Authorized Dealer • Koramangala</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Pressable
              style={[styles.callBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={(e) => { e.stopPropagation(); lightHaptic(); }}
            >
              <Feather name="phone" size={18} color={colors.primary} />
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
          style={({ pressed }) => [styles.testDriveBtn, { backgroundColor: '#2563EB', opacity: pressed ? 0.9 : 1 }]}
          onPress={handleBookTestDrive}
        >
          <Feather name="truck" size={18} color="#fff" />
          <Text style={styles.testDriveBtnText}>Book Test Drive</Text>
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
                  <Feather name="check-circle" size={48} color="#10B981" />
                </View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Booking Confirmed!</Text>
                <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                  Your test drive for {vehicle.name} has been booked for {bookingDate} at {bookingSlot}.
                </Text>
                <Pressable style={[styles.successDoneBtn, { backgroundColor: '#2563EB' }]} onPress={handleCloseBookingModal}>
                  <Text style={styles.doneBtnText}>Awesome</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.modalBody}>
                {/* Vehicle Quick Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
                  <Image source={{ uri: vehicle.image }} style={styles.summaryImg} />
                  <View>
                    <Text style={[styles.summaryBrand, { color: colors.primary }]}>{vehicle.brand}</Text>
                    <Text style={[styles.summaryName, { color: colors.textPrimary }]}>{vehicle.name}</Text>
                    <Text style={[styles.summarySpecs, { color: colors.textSecondary }]}>{vehicle.fuel} • {vehicle.transmission}</Text>
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
                        bookingDate === date ? { backgroundColor: '#2563EB', borderColor: '#2563EB' } : { borderColor: colors.border }
                      ]}
                      onPress={() => {
                        lightHaptic();
                        setBookingDate(date);
                      }}
                    >
                      <Text style={[styles.chipText, bookingDate === date ? { color: '#ffffff' } : { color: colors.textSecondary }]}>
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
                        bookingSlot === slot ? { backgroundColor: '#2563EB', borderColor: '#2563EB' } : { borderColor: colors.border }
                      ]}
                      onPress={() => {
                        lightHaptic();
                        setBookingSlot(slot);
                      }}
                    >
                      <Text style={[styles.chipText, bookingSlot === slot ? { color: '#ffffff' } : { color: colors.textSecondary }]}>
                        {slot}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Confirm Action Button */}
                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: '#2563EB' }]}
                  onPress={handleConfirmBooking}
                  disabled={isBookingSubmitting}
                >
                  {isBookingSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm Test Drive Booking</Text>
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
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageContainerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 100,
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#F8FAFC',
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
  brandText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#2563EB', letterSpacing: 1, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  yearBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yearText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#64748B' },
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
    backgroundColor: '#EFF6FF',
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
  testDriveBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  
  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBgPressable: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: '#ffffff',
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
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
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
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
