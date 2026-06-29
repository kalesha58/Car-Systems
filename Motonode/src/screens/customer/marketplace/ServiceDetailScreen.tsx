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
import LinearGradient from 'react-native-linear-gradient';

import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { SERVICES, PRODUCTS } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { lightHaptic, successHaptic } from '@utils/haptics';

type ServiceDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceDetail
>;

export function ServiceDetailScreen({ route, navigation }: ServiceDetailScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startBooking } = useServiceBooking();
  const { id } = route.params;
  
  const service = SERVICES.find((s) => s.id === id) || {
    id: 's1',
    name: 'Premium Oil Change Service',
    category: 'Oil Change',
    price: 999,
    originalPrice: 1499,
    duration: '30-45 mins',
    rating: 4.7,
    reviews: 856,
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    description: 'Premium quality oil change using genuine oil and filter to keep your engine running smooth and efficient.',
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);

  // Dynamically populating dynamic images
  const serviceImages = [
    service.image,
    'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80',
  ];

  const serviceIncludes = [
    'Drain old engine oil',
    'Replace with premium quality engine oil',
    'Replace oil filter with genuine filter',
    'Multi-point inspection',
    'Top up essential fluids',
    'Reset service reminder',
  ];

  const suitability = [
    { label: 'Hatchback', icon: 'truck' },
    { label: 'Sedan', icon: 'truck' },
    { label: 'SUV', icon: 'truck' },
    { label: 'MUV', icon: 'truck' },
  ];

  // Add-ons list
  const addOns = [
    { id: 'a1', name: 'Air Filter Cleaning', price: 399, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80' },
    { id: 'a2', name: 'Cabin Filter', price: 699, image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80' },
    { id: 'a3', name: 'Engine Flush', price: 499, image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=200&auto=format&fit=crop&q=80' },
  ];

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
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <Feather name="share-2" size={20} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Feather name="heart" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Main Images Selector Row */}
        <View style={styles.imageContainerRow}>
          <View style={styles.thumbnailSidebar}>
            {serviceImages.map((imgUri, idx) => (
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
            <Image source={{ uri: serviceImages[activeImageIndex] }} style={styles.serviceImage} resizeMode="cover" />
            <View style={styles.topRatedBadge}>
              <Feather name="star" size={10} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.topRatedText}>Top Rated</Text>
            </View>
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>{activeImageIndex + 1} / {serviceImages.length}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Category & Title */}
          <Text style={styles.categoryText}>{service.category}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{service.name}</Text>

          {/* Rating Block */}
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4].map((star) => (
                <Feather key={star} name="star" size={14} color="#FBBF24" style={{ marginRight: 2 }} />
              ))}
              <Feather name="star" size={14} color="#E2E8F0" />
            </View>
            <Text style={[styles.ratingScore, { color: colors.textPrimary }]}>{service.rating}</Text>
            <Text style={styles.reviewsCount}>({service.reviews} reviews)</Text>
          </View>

          {/* Price Block */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: colors.textPrimary }]}>₹{service.price}</Text>
            {service.originalPrice && (
              <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>₹{service.originalPrice}</Text>
            )}
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>18% OFF</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>{service.description}</Text>

          {/* Trust Value Badges */}
          <View style={styles.trustBadgesRow}>
            <View style={styles.trustBadge}>
              <View style={styles.trustIconWrapper}>
                <Feather name="shield" size={14} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Genuine Parts</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>100% Genuine</Text>
              </View>
            </View>

            <View style={styles.trustBadge}>
              <View style={styles.trustIconWrapper}>
                <Feather name="clock" size={14} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Quick Service</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>{service.duration}</Text>
              </View>
            </View>

            <View style={styles.trustBadge}>
              <View style={styles.trustIconWrapper}>
                <Feather name="award" size={14} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Expert Technicians</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>Certified Experts</Text>
              </View>
            </View>
          </View>

          {/* Service Includes */}
          <View style={[styles.sectionCard, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Includes</Text>
            {serviceIncludes.map((include, idx) => (
              <View key={idx} style={styles.includeRow}>
                <Feather name="check-circle" size={14} color="#2563EB" style={{ marginTop: 2 }} />
                <Text style={[styles.includeText, { color: colors.textSecondary }]}>{include}</Text>
              </View>
            ))}
          </View>

          {/* Suitable For */}
          <View style={[styles.sectionCard, { borderColor: colors.border, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Suitable For</Text>
            <View style={styles.suitabilityRow}>
              {suitability.map((suit, idx) => (
                <View key={idx} style={[styles.suitChip, { borderColor: colors.border }]}>
                  <Feather name={suit.icon as 'truck'} size={12} color="#2563EB" />
                  <Text style={[styles.suitText, { color: colors.textSecondary }]}>{suit.label}</Text>
                </View>
              ))}
              <View style={[styles.suitChip, { borderColor: colors.border }]}>
                <Feather name="more-horizontal" size={12} color="#64748B" />
                <Text style={[styles.suitText, { color: colors.textSecondary }]}>More</Text>
              </View>
            </View>
          </View>

          {/* You May Also Need */}
          <View style={styles.addonsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>You May Also Need</Text>
            <View style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="chevron-right" size={12} color="#2563EB" />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalAddons}>
            {addOns.map((item) => (
              <View key={item.id} style={[styles.addonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image source={{ uri: item.image }} style={styles.addonImg} />
                <Text style={[styles.addonName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.addonPrice, { color: colors.textPrimary }]}>₹{item.price}</Text>
                <Pressable style={styles.addonAddBtn} onPress={() => successHaptic()}>
                  <Feather name="plus" size={10} color="#2563EB" />
                  <Text style={styles.addonAddBtnText}>Add</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Booking Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <View style={styles.quantityContainer}>
          <Pressable style={styles.qtyBtn} onPress={() => { lightHaptic(); qty > 1 && setQty(qty - 1); }}>
            <Feather name="minus" size={14} color="#1F2937" />
          </Pressable>
          <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{qty}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => { lightHaptic(); setQty(qty + 1); }}>
            <Feather name="plus" size={14} color="#1F2937" />
          </Pressable>
        </View>

        <Pressable
          style={[styles.bookBtn, { backgroundColor: '#2563EB' }]}
          onPress={() => {
            lightHaptic();
            startBooking(service.id);
            navigation.navigate(CustomerStackRoutes.ServiceBookingDateTime, {
              serviceId: service.id,
            });
          }}
        >
          <Feather name="calendar" size={18} color="#fff" />
          <View style={styles.bookBtnTextContainer}>
            <Text style={styles.bookBtnText}>Book Now</Text>
            <Text style={styles.bookBtnSub}>Get expert service for your vehicle</Text>
          </View>
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  serviceImage: { width: '100%', height: '100%' },
  topRatedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRatedText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
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
  content: { paddingHorizontal: 16, paddingTop: 16 },
  categoryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2563EB', marginBottom: 4 },
  name: { fontSize: 20, fontFamily: 'Inter_700Bold', lineHeight: 28, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  starsContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingScore: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  reviewsCount: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#2563EB' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  priceText: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  originalPrice: { fontSize: 14, fontFamily: 'Inter_400Regular', textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#15803D' },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  trustIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  trustTitle: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  trustSub: { fontSize: 8, fontFamily: 'Inter_400Regular', marginTop: 1 },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  includeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  includeText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },
  suitabilityRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  suitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  suitText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  addonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#2563EB' },
  horizontalAddons: { gap: 10 },
  addonCard: {
    width: 120,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  addonImg: { width: '100%', height: 60, borderRadius: 8, marginBottom: 6 },
  addonName: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 4 },
  addonPrice: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  addonAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  addonAddBtnText: { color: '#2563EB', fontSize: 10, fontFamily: 'Inter_700Bold' },
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 4,
    height: 48,
    backgroundColor: '#ffffff',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    width: 20,
    textAlign: 'center',
  },
  bookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  bookBtnTextContainer: {
    alignItems: 'flex-start',
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  bookBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontFamily: 'Inter_400Regular' },
});
