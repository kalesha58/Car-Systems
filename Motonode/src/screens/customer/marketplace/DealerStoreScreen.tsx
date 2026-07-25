import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import { useColors } from '@hooks/useColors';
import { DealerStoreSkeleton } from '@components/loaders';
import { StarRating } from '@components/reviews';
import { getDealerById } from '@services/dealer.service';
import { getProducts } from '@services/product.service';
import { getServicesByDealerId } from '@services/service.service';
import type { IDealer } from '@app-types/dealer';
import type { IProduct } from '@app-types/product';
import type { IService } from '@app-types/service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getProductId, getServiceId } from '@utils/displayMappers';
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
  const { items, total, addItem } = useCart();
  const { showToast } = useToast();

  const [dealer, setDealer] = useState<IDealer | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'services' | 'about' | 'reviews'>('shop');
  const [isFollowed, setIsFollowed] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    let cancelled = false;

    const loadDealerStore = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dealerRes, productsRes, servicesRes] = await Promise.all([
          getDealerById(id),
          getProducts({ dealerId: id, limit: 20 }),
          getServicesByDealerId(id, { limit: 20 }),
        ]);

        if (cancelled) return;

        if (dealerRes.success && dealerRes.Response) {
          setDealer(dealerRes.Response);
        }
        if (productsRes.success && productsRes.Response?.products) {
          setProducts(productsRes.Response.products);
        }
        if (servicesRes.success && servicesRes.Response?.services) {
          setServices(servicesRes.Response.services);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load store'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDealerStore();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const dealerName = dealer?.businessName ?? dealer?.name ?? 'Dealer Store';
  const dealerType = dealer?.dealerType ?? 'Auto Parts & Services Store';
  const dealerAddress = dealer?.address ?? dealer?.location ?? 'Address not available';
  const isOpen = dealer?.storeOpen !== false;

  // Store-level rating rolled up from the per-product aggregates the API returns.
  const reviewedProducts = useMemo(
    () =>
      products
        .filter((product) => (product.reviewCount ?? 0) > 0)
        .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)),
    [products],
  );

  const storeRating = useMemo(() => {
    const totalReviews = reviewedProducts.reduce(
      (sum, product) => sum + (product.reviewCount ?? 0),
      0,
    );
    if (totalReviews === 0) return { average: 0, totalReviews: 0 };

    const weighted = reviewedProducts.reduce(
      (sum, product) => sum + (product.averageRating ?? 0) * (product.reviewCount ?? 0),
      0,
    );

    return {
      average: Math.round((weighted / totalReviews) * 10) / 10,
      totalReviews,
    };
  }, [reviewedProducts]);

  const handleFollowToggle = () => {
    lightHaptic();
    setIsFollowed(!isFollowed);
  };

  if (loading) {
    return <DealerStoreSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <ChromeHeader style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]} contentPad={8}>
        <View style={styles.headerLeft}>
          <Pressable style={[styles.iconBtn, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {dealerName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={[styles.iconBtn, { borderColor: colors.border }]}>
            <Feather name="heart" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={[styles.iconBtn, { borderColor: colors.border }]}>
            <Feather name="share-2" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </ChromeHeader>

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
                  <Text style={styles.storeName}>{dealerName}</Text>
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={10} color="#fff" />
                  </View>
                </View>
                <Text style={styles.storeSub}>{dealerType}</Text>
                <Text style={styles.storeAddress}>{dealerAddress}</Text>
              </View>
              <Pressable
                style={[
                  styles.followBtn,
                  isFollowed ? { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: '#fff' } : { backgroundColor: '#ffffff' }
                ]}
                onPress={handleFollowToggle}
              >
                <Text style={[styles.followText, isFollowed ? { color: '#fff' } : { color: colors.primary }]}>
                  {isFollowed ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.profileFooter}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusText}>{isOpen ? 'Open' : 'Closed'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Circular Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="shield" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statTitle, { color: colors.textPrimary }]}>100% Genuine</Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Products</Text>
          </View>

          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="refresh-cw" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statTitle, { color: colors.textPrimary }]}>7 Days</Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Easy Returns</Text>
          </View>

          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="truck" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statTitle, { color: colors.textPrimary }]}>Fast</Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Delivery</Text>
          </View>

          <View style={styles.statBadge}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2F6' }]}>
              <Feather name="headphones" size={18} color={colors.primary} />
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
              style={[styles.tabButton, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.primary : colors.textSecondary },
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
              {products.length === 0 ? (
                <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>No products listed yet</Text>
              ) : (
              products.slice(0, 4).map((product) => (
                <Pressable
                  key={getProductId(product)}
                  style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => navigation.navigate(CustomerStackRoutes.ProductDetail, { id: getProductId(product) })}
                >
                  <Image source={{ uri: product.images?.[0] ?? '' }} style={styles.productImg} />
                  <Text style={[styles.productBrand, { color: colors.primary }]}>{product.brand}</Text>
                  <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {(product.reviewCount ?? 0) > 0 ? (
                    <View style={styles.productRatingRow}>
                      <Feather name="star" size={10} color={colors.starActive} />
                      <Text style={[styles.productRatingVal, { color: colors.textSecondary }]}>
                        {(product.averageRating ?? 0).toFixed(1)} ({product.reviewCount})
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.productPriceRow}>
                    <Text style={[styles.productPrice, { color: colors.textPrimary }]}>₹{product.price}</Text>
                    <Pressable
                      style={styles.addBtn}
                      onPress={() => {
                        lightHaptic();
                        addItem(product);
                        showToast(`${product.name} added to cart!`, 'success');
                      }}
                    >
                      <Feather name="plus" size={12} color={colors.primary} />
                      <Text style={styles.addBtnText}>Add</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))
              )}
            </ScrollView>
          </View>
        )}

        {activeTab === 'services' && (
          <View style={{ padding: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Services</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>
            {services.length === 0 ? (
              <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>No services listed yet</Text>
            ) : (
            services.map((service) => (
              <Pressable
                key={getServiceId(service)}
                style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate(CustomerStackRoutes.ServiceDetail, { id: getServiceId(service) })}
              >
                <Image source={{ uri: service.images?.[0] ?? '' }} style={styles.serviceImg} />
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service.name}</Text>
                  <Text style={[styles.serviceDuration, { color: colors.textSecondary }]}>
                    Duration: {service.durationMinutes} min
                  </Text>
                  <View style={styles.serviceBottom}>
                    <Text style={[styles.servicePrice, { color: colors.textPrimary }]}>₹{service.price}</Text>
                    <Pressable style={styles.serviceBookBtn} onPress={() => successHaptic()}>
                      <Text style={styles.serviceBookBtnText}>Book</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>About Store</Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              {dealerName} is your one-stop destination for genuine auto parts, accessories and professional car care services. Quality you can trust, service you can rely on.
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>Store Location</Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>{dealerAddress}</Text>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>Customer Reviews</Text>

            {storeRating.totalReviews === 0 ? (
              <View style={styles.reviewsEmpty}>
                <Feather name="message-square" size={30} color={colors.textTertiary} />
                <Text style={[styles.reviewsEmptyTitle, { color: colors.textPrimary }]}>
                  No reviews yet
                </Text>
                <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                  Reviews from this store's products will appear here.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.reviewsSummary}>
                  <View style={styles.ratingBigContainer}>
                    <Text style={[styles.ratingBig, { color: colors.textPrimary }]}>
                      {storeRating.average.toFixed(1)}
                    </Text>
                    <StarRating rating={storeRating.average} size={14} />
                    <Text style={[styles.reviewsCount, { color: colors.textSecondary }]}>
                      {storeRating.totalReviews.toLocaleString('en-IN')}{' '}
                      {storeRating.totalReviews === 1 ? 'review' : 'reviews'}
                    </Text>
                  </View>
                  <View style={styles.ratingBars}>
                    <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                      Averaged across {reviewedProducts.length}{' '}
                      {reviewedProducts.length === 1 ? 'product' : 'products'} in this store.
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>
                  Top rated products
                </Text>

                {reviewedProducts.map((product) => (
                  <Pressable
                    key={getProductId(product)}
                    style={[
                      styles.reviewedProductRow,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() =>
                      navigation.navigate(CustomerStackRoutes.ProductDetail, {
                        id: getProductId(product),
                      })
                    }
                  >
                    <Image source={{ uri: product.images?.[0] ?? '' }} style={styles.reviewedProductImg} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.serviceName, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>
                      <View style={styles.productRatingRow}>
                        <StarRating rating={product.averageRating ?? 0} size={11} />
                        <Text style={[styles.productRatingVal, { color: colors.textSecondary }]}>
                          {(product.averageRating ?? 0).toFixed(1)} ({product.reviewCount})
                        </Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <View style={styles.cartIndicator}>
          <View style={styles.cartBadgeWrapper}>
            <Feather name="shopping-cart" size={20} color={colors.primary} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{items.length}</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate(CustomerStackRoutes.Cart)}
        >
          <Text style={styles.checkoutText}>View Cart • ₹{total.toLocaleString('en-IN')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    borderBottomWidth: 1,
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
  emptyTabText: { fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 12 },
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
    gap: 4,
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
  reviewsEmpty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 28,
  },
  reviewsEmptyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  reviewedProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  reviewedProductImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
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
