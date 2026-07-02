import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { ChromeHeader } from '@components/common';

import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useMobileVerificationGate } from '@context/MobileVerificationContext';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { getServiceById } from '@services/service.service';
import type { IService } from '@app-types/service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getServiceDurationLabel, getServiceId } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import { ServiceDetailSkeleton } from '@components/loaders';

type ServiceDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceDetail
>;

export function ServiceDetailScreen({ route, navigation }: ServiceDetailScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startBooking } = useServiceBooking();
  const { runWithMobileCheck } = useMobileVerificationGate();
  const { id } = route.params;
  const [service, setService] = useState<IService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadService = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getServiceById(id);
        if (cancelled) return;
        const data = response.Response as any;
        let found = null;
        if (data) {
          if (Array.isArray(data.services)) {
            found = data.services[0];
          } else if (data.id || data._id) {
            found = data;
          }
        }
        if (found) {
          setService(found);
        } else {
          setError('Service not found');
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load service'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadService();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <ServiceDetailSkeleton />;
  }

  if (!service) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>{error ?? 'Service not found'}</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const serviceId = getServiceId(service);
  const durationLabel = getServiceDurationLabel(service);
  const serviceImages = service.images?.length
    ? service.images
    : ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80'];

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

  const addOns = [
    {
      id: 'a1',
      name: 'Air Filter Cleaning',
      price: 399,
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'a2',
      name: 'Cabin Filter',
      price: 699,
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'a3',
      name: 'Engine Flush',
      price: 499,
      image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=200&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.headerSide} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.headerForeground} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: colors.headerForeground }]}
          numberOfLines={1}
        >
          {service.name}
        </Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
            <Feather name="share-2" size={20} color={colors.headerForeground} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => lightHaptic()}>
            <Feather name="heart" size={20} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.imageContainerRow}>
          <View style={styles.thumbnailSidebar}>
            {serviceImages.map((imgUri, idx) => (
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
            <Image
              source={{ uri: serviceImages[activeImageIndex] }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
            <View style={[styles.topRatedBadge, { backgroundColor: colors.primary }]}>
              <Feather name="star" size={10} color={colors.primaryForeground} style={{ marginRight: 4 }} />
              <Text style={[styles.topRatedText, { color: colors.primaryForeground }]}>Top Rated</Text>
            </View>
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {activeImageIndex + 1} / {serviceImages.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <Text style={[styles.categoryText, { color: colors.link }]}>{service.category ?? 'Service'}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{service.name}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4].map((star) => (
                <Feather
                  key={star}
                  name="star"
                  size={14}
                  color={colors.starActive}
                  style={{ marginRight: 2 }}
                />
              ))}
              <Feather name="star" size={14} color={colors.border} />
            </View>
            <Text style={[styles.ratingScore, { color: colors.textPrimary }]}>4.7</Text>
            <Text style={[styles.reviewsCount, { color: colors.link }]}>(reviews)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: colors.textPrimary }]}>₹{service.price}</Text>
            <View style={[styles.discountBadge, { backgroundColor: colors.primarySubtle }]}>
              <Text style={[styles.discountText, { color: colors.success }]}>Best Price</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {service.description ?? 'Professional service for your vehicle.'}
          </Text>

          <View style={[styles.trustBadgesRow, { backgroundColor: colors.muted }]}>
            <View style={styles.trustBadge}>
              <View style={[styles.trustIconWrapper, { backgroundColor: colors.card }]}>
                <Feather name="shield" size={14} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Genuine Parts</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>100% Genuine</Text>
              </View>
            </View>

            <View style={styles.trustBadge}>
              <View style={[styles.trustIconWrapper, { backgroundColor: colors.card }]}>
                <Feather name="clock" size={14} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Quick Service</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>{durationLabel}</Text>
              </View>
            </View>

            <View style={styles.trustBadge}>
              <View style={[styles.trustIconWrapper, { backgroundColor: colors.card }]}>
                <Feather name="award" size={14} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Expert Technicians</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>Certified Experts</Text>
              </View>
            </View>
          </View>

          <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Includes</Text>
            {serviceIncludes.map((include, idx) => (
              <View key={idx} style={styles.includeRow}>
                <Feather name="check-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                <Text style={[styles.includeText, { color: colors.textSecondary }]}>{include}</Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.sectionCard,
              { borderColor: colors.border, backgroundColor: colors.card, marginTop: 16 },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Suitable For</Text>
            <View style={styles.suitabilityRow}>
              {suitability.map((suit, idx) => (
                <View
                  key={idx}
                  style={[styles.suitChip, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <Feather name={suit.icon as 'truck'} size={12} color={colors.icon} />
                  <Text style={[styles.suitText, { color: colors.textSecondary }]}>{suit.label}</Text>
                </View>
              ))}
              <View style={[styles.suitChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="more-horizontal" size={12} color={colors.textTertiary} />
                <Text style={[styles.suitText, { color: colors.textSecondary }]}>More</Text>
              </View>
            </View>
          </View>

          <View style={styles.addonsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>You May Also Need</Text>
            <Pressable style={styles.viewAllRow} onPress={() => lightHaptic()}>
              <Text style={[styles.viewAllText, { color: colors.link }]}>View All</Text>
              <Feather name="chevron-right" size={12} color={colors.link} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalAddons}
          >
            {addOns.map((item) => (
              <View
                key={item.id}
                style={[styles.addonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Image source={{ uri: item.image }} style={styles.addonImg} />
                <Text style={[styles.addonName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.addonPrice, { color: colors.textPrimary }]}>₹{item.price}</Text>
                <Pressable
                  style={[styles.addonAddBtn, { borderColor: colors.border, backgroundColor: colors.primarySubtle }]}
                  onPress={() => successHaptic()}
                >
                  <Feather name="plus" size={10} color={colors.link} />
                  <Text style={[styles.addonAddBtnText, { color: colors.link }]}>Add</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 },
        ]}
      >
        <Pressable
          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            void runWithMobileCheck(() => {
              lightHaptic();
              startBooking(serviceId);
              navigation.navigate(CustomerStackRoutes.ServiceBookingDateTime, {
                serviceId,
              });
            });
          }}
        >
          <Feather name="calendar" size={18} color={colors.primaryForeground} />
          <View style={styles.bookBtnTextContainer}>
            <Text style={[styles.bookBtnText, { color: colors.primaryForeground }]}>Book Now</Text>
            <Text style={styles.bookBtnSub}>Get expert service for your vehicle</Text>
          </View>
        </Pressable>
      </View>
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
    minWidth: 72,
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
  serviceImage: { width: '100%', height: '100%' },
  topRatedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRatedText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
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
  categoryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  name: { fontSize: 20, fontFamily: 'Inter_700Bold', lineHeight: 28, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  starsContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingScore: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  reviewsCount: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  priceText: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  discountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    justifyContent: 'center',
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
  viewAllText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  addonAddBtnText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  bottomBar: {
    borderTopWidth: 1,
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bookBtn: {
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
  bookBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  bookBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontFamily: 'Inter_400Regular' },
});
