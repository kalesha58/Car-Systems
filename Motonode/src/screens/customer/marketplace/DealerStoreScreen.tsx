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
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { CustomerStackRoutes } from '@constants/routes';
import { PRODUCTS, SERVICES, DEALERS } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { successHaptic, lightHaptic } from '@utils/haptics';

const { width } = Dimensions.get('window');

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
};

type DealerStoreScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  'DealerStore'
>;

export function DealerStoreScreen({ route, navigation }: DealerStoreScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  
  const dealer = DEALERS.find((d) => d.id === id) || {
    id: 'd1',
    name: 'Motonode Auto Hub',
    type: 'Auto Parts & Services Store',
    rating: 4.7,
    reviews: 512,
    distance: '1.2 km',
    isOpen: true,
    closingTime: '9 PM',
    address: 'Koramangala, Bengaluru',
  };

  const [activeTab, setActiveTab] = useState<'shop' | 'services' | 'about' | 'reviews'>('shop');
  const [isFollowed, setIsFollowed] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleFollowToggle = () => {
    lightHaptic();
    setIsFollowed(!isFollowed);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <LinearGradient
        colors={['#1D4ED8', '#3B82F6']}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]} numberOfLines={1}>
            {dealer.name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <Feather name="heart" size={22} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Feather name="share-2" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Shopfront Banner image */}
        <View style={styles.bannerImageContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80' }}
            style={styles.bannerImage}
          />
          <View style={styles.bannerOverlay} />
          
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.verifiedRow}>
                  <Text style={styles.storeName}>{dealer.name}</Text>
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={10} color="#fff" />
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={12} color="#FBBF24" />
                  <Text style={styles.ratingText}>{dealer.rating}</Text>
                  <Text style={styles.reviewsText}>({dealer.reviews} reviews)</Text>
                </View>
                <Text style={styles.storeSub}>{dealer.type}</Text>
                <Text style={styles.storeAddress}>{dealer.address}</Text>
              </View>
              <Pressable
                style={[
                  styles.followBtn,
                  isFollowed ? { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: '#fff' } : { backgroundColor: '#ffffff' }
                ]}
                onPress={handleFollowToggle}
              >
                <Text style={[styles.followText, isFollowed ? { color: '#fff' } : { color: '#2563EB' }]}>
                  {isFollowed ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.profileFooter}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: dealer.isOpen ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusText}>{dealer.isOpen ? 'Open' : 'Closed'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Circular Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="shield" size={18} color="#2563EB" />
            </View>
            <Text style={[styles.statTitle, { color: colors.textPrimary }]}>100% Genuine</Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Products</Text>
          </View>

          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="refresh-cw" size={18} color="#2563EB" />
            </View>
            <Text style={[styles.statTitle, { color: colors.textPrimary }]}>7 Days</Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Easy Returns</Text>
          </View>

          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="truck" size={18} color="#2563EB" />
            </View>
            <Text style={[styles.statTitle, { color: colors.textPrimary }]}>Fast</Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Delivery</Text>
          </View>

          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="headphones" size={18} color="#2563EB" />
            </View>
            <Text style={[styles.statTitle, { color: colors.textPrimary }]}>Expert</Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Support</Text>
          </View>
        </View>

        {/* Tabs Selectors */}
        <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
          {(['shop', 'services', 'about', 'reviews'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabButton, activeTab === tab && { borderBottomColor: '#2563EB', borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? '#2563EB' : colors.textSecondary },
                  activeTab === tab && { fontFamily: 'Inter_700Bold' },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'shop' && (
          <View style={{ padding: 16 }}>
            {/* Promo coupon banner */}
            <View style={styles.couponContainer}>
              <View style={styles.couponLeft}>
                <Text style={styles.couponTitle}>Flat 10% OFF</Text>
                <Text style={styles.couponSub}>on all orders above ₹2,999</Text>
              </View>
              <View style={styles.couponRight}>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeText}>HUB10</Text>
                </View>
                <Pressable style={styles.copyBtn} onPress={() => successHaptic()}>
                  <Text style={styles.copyBtnText}>Copy</Text>
                </Pressable>
              </View>
            </View>

            {/* Top Selling Products */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Selling Products</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {PRODUCTS.slice(0, 4).map((product) => (
                <Pressable
                  key={product.id}
                  style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => navigation.navigate(CustomerStackRoutes.ProductDetail, { id: product.id })}
                >
                  <Image source={{ uri: product.image }} style={styles.productImg} />
                  <Text style={[styles.productBrand, { color: colors.primary }]}>{product.brand}</Text>
                  <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.productRatingRow}>
                    <Feather name="star" size={10} color="#FBBF24" />
                    <Text style={[styles.productRatingVal, { color: colors.textSecondary }]}>{product.rating}</Text>
                  </View>
                  <View style={styles.productPriceRow}>
                    <Text style={[styles.productPrice, { color: colors.textPrimary }]}>₹{product.price}</Text>
                    <Pressable style={styles.addBtn} onPress={() => successHaptic()}>
                      <Feather name="plus" size={12} color="#2563EB" />
                      <Text style={styles.addBtnText}>Add</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {activeTab === 'services' && (
          <View style={{ padding: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Services</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>
            {SERVICES.map((service) => (
              <Pressable
                key={service.id}
                style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate(CustomerStackRoutes.ServiceDetail, { id: service.id })}
              >
                <Image source={{ uri: service.image }} style={styles.serviceImg} />
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service.name}</Text>
                  <Text style={[styles.serviceDuration, { color: colors.textSecondary }]}>Duration: {service.duration}</Text>
                  <View style={styles.serviceBottom}>
                    <Text style={[styles.servicePrice, { color: colors.textPrimary }]}>₹{service.price}</Text>
                    <Pressable style={styles.serviceBookBtn} onPress={() => successHaptic()}>
                      <Text style={styles.serviceBookBtnText}>Book</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>About Store</Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              {dealer.name} is your one-stop destination for genuine auto parts, accessories and professional car care services. Quality you can trust, service you can rely on.
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>Store Location</Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>{dealer.address}</Text>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>Customer Reviews</Text>
            <View style={styles.reviewsSummary}>
              <View style={styles.ratingBigContainer}>
                <Text style={[styles.ratingBig, { color: colors.textPrimary }]}>{dealer.rating}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Feather key={star} name="star" size={14} color="#FBBF24" />
                  ))}
                </View>
                <Text style={[styles.reviewsCount, { color: colors.textSecondary }]}>Based on {dealer.reviews} reviews</Text>
              </View>
              <View style={styles.ratingBars}>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <View key={stars} style={styles.barRow}>
                    <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{stars}★</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.barFill, { width: stars === 5 ? '78%' : stars === 4 ? '15%' : '2%' }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <View style={styles.cartIndicator}>
          <View style={styles.cartBadgeWrapper}>
            <Feather name="shopping-cart" size={20} color="#2563EB" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={[styles.checkoutBtn, { backgroundColor: '#2563EB' }]}
          onPress={() => navigation.navigate(CustomerStackRoutes.Cart)}
        >
          <Text style={styles.checkoutText}>View Cart • ₹4,798</Text>
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
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  bannerImageContainer: {
    height: 250,
    position: 'relative',
    marginTop: 60,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  profileCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  checkBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  reviewsText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  storeSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  storeAddress: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  followText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  profileFooter: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontFamily: 'Inter_600SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statBadge: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  statSub: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  couponContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  couponLeft: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#92400E',
  },
  couponSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 2,
  },
  couponRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  codeContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  copyBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  viewAllText: {
    fontSize: 11,
    color: '#2563EB',
    fontFamily: 'Inter_600SemiBold',
  },
  horizontalScroll: {
    gap: 12,
  },
  productCard: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  productImg: {
    width: '100%',
    height: 90,
    borderRadius: 8,
  },
  productBrand: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 6,
  },
  productName: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
    height: 32,
    lineHeight: 16,
  },
  productRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  productRatingVal: {
    fontSize: 10,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  addBtn: {
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
  addBtnText: {
    color: '#2563EB',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  serviceCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    gap: 12,
  },
  serviceImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  serviceDuration: {
    fontSize: 10,
    marginTop: 2,
  },
  serviceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  serviceBookBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  serviceBookBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  aboutTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingBigContainer: {
    alignItems: 'center',
  },
  ratingBig: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  reviewsCount: {
    fontSize: 10,
  },
  ratingBars: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 10,
    width: 24,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 16,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cartIndicator: {
    marginRight: 16,
  },
  cartBadgeWrapper: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
  },
  checkoutBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
