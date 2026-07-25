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

import { CustomerStackRoutes } from '@constants/routes';
import { useCart, useWishlist, useToast } from '@context/index';
import { useColors } from '@hooks/useColors';
import { getProductById } from '@services/product.service';
import type { IProduct } from '@app-types/product';
import type { IReviewSummary } from '@app-types/review';
import { themeLight } from '@theme/colors';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getProductId } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import { ProductDetailSkeleton } from '@components/loaders';
import { ProductReviewsSection, StarRating } from '@components/reviews';

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

type ProductDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ProductDetail
>;

function formatDeliveryLabel(deliveryTimeMinutes?: number): string {
  if (!deliveryTimeMinutes || deliveryTimeMinutes <= 0) return '2-4 Days Delivery';
  const days = Math.max(1, Math.round(deliveryTimeMinutes / (24 * 60)));
  if (days === 1) return 'Within 1 day';
  return `Within ${days} days`;
}

export function ProductDetailScreen({ route, navigation }: ProductDetailScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Kept in sync by the reviews section so the header reflects new submissions.
  const [ratingOverride, setRatingOverride] = useState<IReviewSummary | null>(null);
  const { addItem, items, updateQuantity } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { showToast } = useToast();
  
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProductById(id);
        if (cancelled) return;
        const data = response.Response as any;
        let found = null;
        if (data) {
          if (Array.isArray(data.products)) {
            found = data.products[0];
          } else if (data.id || data._id) {
            found = data;
          }
        }
        if (found) {
          setProduct(found);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load product'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const productId = product ? getProductId(product) : id;
  const cartItem = items.find((i) => getProductId(i.product) === productId);
  const inCart = !!cartItem;
  const [localQty, setLocalQty] = useState(cartItem ? cartItem.quantity : 1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setLocalQty(cartItem ? cartItem.quantity : 1);
  }, [cartItem]);

  const productImages = product?.images?.length
    ? product.images
    : product
      ? ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80']
      : [];

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textPrimary }]}>
          {error ?? 'Product not found'}
        </Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const discount = product.discountPercentage ?? 0;
  const averageRating = ratingOverride?.averageRating ?? product.averageRating ?? 0;
  const reviewCount = ratingOverride?.reviewCount ?? product.reviewCount ?? 0;
  const inStock = product.stock > 0 && product.status === 'active';
  const dealerName = product.dealer?.businessName ?? 'Authorized Dealer';
  const dealerId = product.dealerId || product.dealer?.id || '';

  const wishlisted = isWishlisted(productId);

  const handleDecrease = () => {
    lightHaptic();
    if (localQty > 1) {
      const nextQty = localQty - 1;
      setLocalQty(nextQty);
      if (inCart) {
        updateQuantity(productId, nextQty);
      }
    } else if (localQty === 1 && inCart) {
      updateQuantity(productId, 0);
      setLocalQty(1);
    }
  };

  const handleIncrease = () => {
    lightHaptic();
    const nextQty = localQty + 1;
    setLocalQty(nextQty);
    if (inCart) {
      updateQuantity(productId, nextQty);
    }
  };

  const handleAddToCart = () => {
    successHaptic();
    addItem(product);
    if (localQty > 1) {
      updateQuantity(productId, localQty);
    }
    showToast(`${product.name} added to cart!`, 'success');
  };

  const benefits = [
    "Stronger oil film for maximum engine performance",
    "Reduced engine wear across various driving conditions",
    "Improved engine efficiency",
    "Excellent low temperature performance"
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Circular Header Buttons */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]}>
            <Feather name="share-2" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.card }]}
            onPress={() => {
              lightHaptic();
              toggleWishlist(productId);
            }}
          >
            <Feather name="heart" size={20} color={wishlisted ? colors.destructive : colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image Panel with Left Sidebar Selector */}
        <View style={styles.imageContainerRow}>
          {/* Left Thumbnails Selector Sidebar */}
          <View style={styles.thumbnailSidebar}>
            {productImages.map((imgUri, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.thumbnailWrapper,
                  { borderColor: activeImageIndex === idx ? '#E60012' : colors.border, backgroundColor: colors.card }
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

          {/* Main Product Image Panel */}
          <View style={[styles.mainImagePanel, { backgroundColor: colors.muted }]}>
            <Image source={{ uri: productImages[activeImageIndex] }} style={styles.productImage} resizeMode="cover" />
            {discount > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>{activeImageIndex + 1} / {productImages.length}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Brand & Name */}
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{product.name}</Text>

          {/* Rating Block */}
          {reviewCount > 0 ? (
            <View style={styles.ratingRow}>
              <StarRating rating={averageRating} size={14} />
              <Text style={[styles.ratingScore, { color: colors.textPrimary }]}>
                {averageRating.toFixed(1)}
              </Text>
              <Text style={styles.reviewsCount}>
                ({reviewCount.toLocaleString('en-IN')} {reviewCount === 1 ? 'review' : 'reviews'})
              </Text>
            </View>
          ) : (
            <View style={styles.ratingRow}>
              <StarRating rating={0} size={14} />
              <Text style={styles.reviewsCount}>No reviews yet</Text>
            </View>
          )}

          {/* Price Block */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.textPrimary }]}>₹{product.price.toLocaleString('en-IN')}</Text>
            {product.originalPrice != null && product.originalPrice > product.price && (
              <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>₹{product.originalPrice.toLocaleString('en-IN')}</Text>
            )}
            <View style={[styles.stockBadge, !inStock && { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.stockText, !inStock && { color: '#B91C1C' }]}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Trust Value Badges Row */}
          <View style={[styles.trustBadgesRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.trustBadge}>
              <View style={[styles.trustIconWrapper, { backgroundColor: colors.background }]}>
                <Feather name="shield" size={16} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>100% Genuine</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>Original Products</Text>
              </View>
            </View>

            <View style={styles.trustBadge}>
              <View style={[styles.trustIconWrapper, { backgroundColor: colors.background }]}>
                <Feather name="refresh-cw" size={16} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Easy Returns</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>7 Days Return</Text>
              </View>
            </View>

            <View style={styles.trustBadge}>
              <View style={[styles.trustIconWrapper, { backgroundColor: colors.background }]}>
                <Feather name="truck" size={16} color={colors.icon} />
              </View>
              <View>
                <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>Fast Delivery</Text>
                <Text style={[styles.trustSub, { color: colors.textSecondary }]}>
                  {formatDeliveryLabel(product.deliveryTimeMinutes)}
                </Text>
              </View>
            </View>
          </View>

          {/* Clickable Dealer Card */}
          <Pressable
            style={[styles.dealerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => dealerId && navigation.navigate(CustomerStackRoutes.DealerStore, { id: dealerId })}
          >
            <View style={[styles.dealerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="briefcase" size={20} color={colors.primary} />
            </View>
            <View style={styles.dealerInfo}>
              <Text style={[styles.dealerName, { color: colors.textPrimary }]}>{dealerName}</Text>
              <Text style={[styles.dealerLabel, { color: colors.textTertiary }]}>Authorized Dealer</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          {/* Description Section */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description ?? 'No description available.'}
          </Text>

          {/* Key Benefits */}
          <View style={[styles.benefitsCard, { borderColor: colors.border }]}>
            <Text style={[styles.benefitsTitle, { color: colors.textPrimary }]}>Key Benefits</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Feather name="check-circle" size={14} color="#FF1A1A" style={{ marginTop: 1 }} />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Specifications */}
          <View style={styles.specsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Specifications</Text>
            <Pressable style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="chevron-right" size={12} color={colors.icon} />
            </Pressable>
          </View>

          {/* Specifications List */}
          {(() => {
            const specs: Array<{ label: string; value: string }> = [];
            if (product.isSparePart) {
              if (product.vehicleBrandName) specs.push({ label: 'Compatible Brand', value: product.vehicleBrandName });
              if (product.vehicleModelName) specs.push({ label: 'Compatible Model', value: product.vehicleModelName });
              if (product.fitsYear) specs.push({ label: 'Fits Year', value: product.fitsYear });
              if (product.emissionStandard) specs.push({ label: 'Emission Standard', value: product.emissionStandard });
              if (product.color) specs.push({ label: 'Color', value: product.color });
              if (product.weight) specs.push({ label: 'Weight', value: product.weight });
            } else if (product.batteryTypeName) {
              specs.push({ label: 'Battery Type', value: product.batteryTypeName });
              if (product.voltageV) specs.push({ label: 'Voltage', value: `${product.voltageV}V` });
            }
            // Add custom specs from product.specifications
            if (product.specifications) {
              Object.entries(product.specifications).forEach(([k, v]) => {
                specs.push({ label: k, value: String(v) });
              });
            }

            if (specs.length === 0) return null;

            return (
              <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {specs.map((item, index) => (
                  <View key={index}>
                    <View style={styles.specItemRow}>
                      <Text style={[styles.specLabelText, { color: colors.textSecondary }]}>{item.label}</Text>
                      <Text style={[styles.specValueText, { color: colors.textPrimary }]}>{item.value}</Text>
                    </View>
                    {index < specs.length - 1 && <View style={[styles.specDivider, { backgroundColor: colors.border }]} />}
                  </View>
                ))}
              </View>
            );
          })()}

          <ProductReviewsSection
            productId={productId}
            productName={product.name}
            onSummaryChange={setRatingOverride}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <View style={[styles.quantityContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Pressable style={styles.qtyBtn} onPress={handleDecrease}>
            <Feather name="minus" size={14} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{localQty}</Text>
          <Pressable style={styles.qtyBtn} onPress={handleIncrease}>
            <Feather name="plus" size={14} color={colors.textPrimary} />
          </Pressable>
        </View>

        {inCart ? (
          <Pressable
            style={[
              styles.cartBtn,
              { backgroundColor: colors.primary }
            ]}
            onPress={() => {
              lightHaptic();
              navigation.navigate(CustomerStackRoutes.Cart);
            }}
          >
            <Feather name="arrow-right" size={18} color="#fff" />
            <Text style={styles.cartBtnText}>Go to Cart</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.cartBtn,
              { backgroundColor: '#E60012' }
            ]}
            onPress={handleAddToCart}
          >
            <Feather name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.cartBtnText}>Add to Cart</Text>
          </Pressable>
        )}
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
  scrollContent: { paddingBottom: 110 },
  imageContainerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 100,
    gap: 12,
    height: 280,
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
  productImage: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
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
  brand: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: themeLight.textSecondary, marginBottom: 4 },
  name: { fontSize: 20, fontFamily: 'Inter_700Bold', lineHeight: 28, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  starsContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingScore: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  reviewsCount: { fontSize: 12, fontFamily: 'Inter_500Medium', color: themeLight.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  price: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  originalPrice: { fontSize: 14, fontFamily: 'Inter_400Regular', textDecorationLine: 'line-through' },
  stockBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#15803D' },
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
    width: 30,
    height: 30,
    borderRadius: 15,
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
  dealerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  dealerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dealerInfo: { flex: 1 },
  dealerName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  dealerLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  benefitsCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
  },
  benefitsTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  benefitRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  benefitText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },
  specsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: themeLight.textSecondary },
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    width: 24,
    textAlign: 'center',
  },
  cartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  cartBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  notFound: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  backLink: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  specsCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    gap: 2,
  },
  specItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  specLabelText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  specValueText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  specDivider: {
    height: 1,
  },
});
