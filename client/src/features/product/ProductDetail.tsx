import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts, Colors } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import { useTheme } from '@hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { getProductById } from '@service/productService';
import { IProduct } from '../../types/product/IProduct';
import ProductImageCarousel from '@components/product/ProductImageCarousel';
import AnimatedProductHeader from '@components/product/AnimatedProductHeader';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCartStore } from '@state/cartStore';
import {
  CollapsibleContainer,
  CollapsibleScrollView,
  CollapsibleHeaderContainer,
  withCollapsibleContext,
  StickyView,
} from '@r0b0t3d/react-native-collapsible';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@hooks/useToast';
import { navigate } from '@utils/NavigationUtils';
import { useNavigation } from '@react-navigation/native';
import { getDealerById } from '@service/dealerService';
import type { IDealer } from '../../types/dealer/IDealer';
import RelatedProducts from '@features/cart/RelatedProducts';
import SkeletonLoader from '@components/ui/SkeletonLoader';

type ProductDetailRouteParams = {
  ProductDetail: {
    productId: string;
  };
};

const ProductDetail: React.FC = () => {
  const route = useRoute<RouteProp<ProductDetailRouteParams, 'ProductDetail'>>();
  const { productId } = route.params;
  const { t } = useTranslation();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [dealer, setDealer] = useState<IDealer | null>(null);
  const [loadingDealer, setLoadingDealer] = useState<boolean>(false);
  const { colors } = useTheme();
  const { addItem } = useCartStore();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProductById(productId);
        if (response.success && response.Response) {
          let productData: IProduct | null = null;
          const responseData = response.Response as any;
          // Check if Response has products array (list response)
          if (responseData.products && Array.isArray(responseData.products)) {
            productData = responseData.products[0] || null;
          }
          // Check if Response is a single product object
          else if (responseData.id || responseData._id) {
            productData = responseData as IProduct;
          }
          if (productData) {
            setProduct(productData);
            // Fetch dealer information if dealerId is available
            if (productData.dealerId) {
              fetchDealerInfo(productData.dealerId);
            }
          } else {
            setError('Product not found');
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchDealerInfo = async (dealerId: string) => {
    try {
      setLoadingDealer(true);
      const response = await getDealerById(dealerId);
      if (response.success && response.Response) {
        // Handle both single dealer and dealer list response
        const dealerData = Array.isArray(response.Response.dealers)
          ? response.Response.dealers[0]
          : (response.Response as any);
        if (dealerData) {
          setDealer(dealerData as IDealer);
        }
      }
    } catch (err) {
      console.log('Error fetching dealer info:', err);
    } finally {
      setLoadingDealer(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Check stock availability
    if (product.stock === 0) {
      showError('Product is out of stock');
      return;
    }

    const productWithId = { ...product, _id: product.id };
    addItem(productWithId);

    // Show success toast
    showSuccess('Product added to cart successfully', 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Check stock availability
    if (product.stock === 0) {
      showError('Product is out of stock');
      return;
    }

    // Add to cart first
    const productWithId = { ...product, _id: product.id };
    addItem(productWithId);

    // Navigate to cart immediately
    setTimeout(() => {
      try {
        (navigation as any).navigate('MainTabs', {
          screen: 'Cart',
        });
      } catch (error) {
        try {
          (navigation as any).navigate('MainTabs');
          setTimeout(() => {
            (navigation as any).navigate('Cart');
          }, 100);
        } catch (err) {
          console.error('Error navigating to cart:', err);
        }
      }
    }, 300);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const discountPercentage =
    product && product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const hasDiscount = product && product.originalPrice && product.originalPrice > product.price;

  // Responsive calculations
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const isSmallMobile = screenWidth < 360;

  // Responsive values
  const getResponsiveValue = (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    content: {
      backgroundColor: colors.background,
      paddingBottom: 12,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 4,
      gap: 8,
    },
    ratingText: {
      color: colors.text,
    },
    productNameContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 2,
    },
    productName: {
      flex: 1,
      marginRight: 12,
    },
    wishlistButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compactStockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
      alignSelf: 'center',
    },
    stockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 2,
      gap: 4,
    },
    stockText: {
      color: '#FF6B35',
      fontFamily: Fonts.Medium,
      fontSize: RFValue(11),
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 8,
      flexWrap: 'wrap',
    },
    currentPrice: {
      color: colors.secondary,
      fontFamily: Fonts.SemiBold,
    },
    originalPrice: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
      marginLeft: 8,
    },
    discountBadge: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    discountBadgeText: {
      color: colors.white,
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
    },
    viewDetailsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 4,
    },
    viewDetailsText: {
      color: colors.secondary,
      fontFamily: Fonts.Medium,
    },
    serviceHighlightsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 12,
    },
    serviceCard: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 80,
    },
    serviceIcon: {
      marginBottom: 8,
    },
    serviceText: {
      textAlign: 'center',
      fontSize: RFValue(11),
      fontFamily: Fonts.Medium,
    },
    highlightsContent: {
      paddingTop: 4,
    },
    highlightRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    highlightLabel: {
      opacity: 0.7,
      flex: 1,
    },
    highlightValue: {
      fontFamily: Fonts.Medium,
      flex: 1,
      textAlign: 'right',
    },
    sectionContainer: {
      marginHorizontal: 16,
      marginTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      marginBottom: 12,
      paddingBottom: 8,
    },
    informationContent: {
      paddingTop: 4,
    },
    disclaimerText: {
      opacity: 0.7,
      lineHeight: 20,
    },
    actionButtonsSection: {
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderTopColor: colors.border,
      borderBottomColor: colors.border,
      paddingHorizontal: getResponsiveValue(isSmallMobile ? 12 : 16, 24, 32),
      paddingVertical: getResponsiveValue(12, 16, 20),
      marginTop: 0,
      marginBottom: 4,
    },
    actionButtonsPriceInfo: {
      marginBottom: getResponsiveValue(8, 12, 16),
    },
    actionButtonsPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: getResponsiveValue(4, 6, 8),
      gap: getResponsiveValue(4, 6, 8),
    },
    actionButtonsPrice: {
      fontFamily: Fonts.SemiBold,
      color: colors.secondary,
      fontSize: RFValue(getResponsiveValue(18, 20, 22)),
    },
    actionButtonsMrp: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
      fontSize: RFValue(getResponsiveValue(12, 14, 16)),
      color: colors.text,
    },
    actionButtonsDiscount: {
      backgroundColor: '#007AFF',
      paddingHorizontal: getResponsiveValue(6, 8, 10),
      paddingVertical: getResponsiveValue(2, 4, 6),
      borderRadius: getResponsiveValue(6, 8, 10),
    },
    actionButtonsDiscountText: {
      color: colors.white,
      fontSize: RFValue(getResponsiveValue(8, 10, 12)),
      fontFamily: Fonts.Medium,
    },
    actionButtonsTaxText: {
      fontSize: RFValue(getResponsiveValue(9, 11, 13)),
      opacity: 0.7,
      marginTop: getResponsiveValue(4, 6, 8),
      color: colors.text,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: getResponsiveValue(8, 10, 12),
      alignItems: 'center',
    },
    actionButtonsAddToCart: {
      flex: 1,
      backgroundColor: colors.secondary,
      paddingHorizontal: getResponsiveValue(isSmallMobile ? 12 : 14, 18, 20),
      paddingVertical: getResponsiveValue(10, 12, 14),
      borderRadius: getResponsiveValue(6, 8, 10),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: getResponsiveValue(4, 6, 8),
      minHeight: getResponsiveValue(40, 44, 48),
    },
    actionButtonsSecondary: {
      backgroundColor: colors.backgroundSecondary || '#f5f5f5',
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    actionButtonsBuyNow: {
      flex: 1,
      backgroundColor: colors.secondary,
      paddingHorizontal: getResponsiveValue(isSmallMobile ? 12 : 14, 18, 20),
      paddingVertical: getResponsiveValue(10, 12, 14),
      borderRadius: getResponsiveValue(6, 8, 10),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: getResponsiveValue(40, 44, 48),
    },
    actionButtonsDisabled: {
      backgroundColor: colors.disabled || '#cccccc',
      opacity: 0.6,
    },
    actionButtonsAddToCartText: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(getResponsiveValue(12, 13, 14)),
    },
    actionButtonsBuyNowText: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(getResponsiveValue(12, 13, 14)),
    },
    descriptionText: {
      lineHeight: 22,
      opacity: 0.8,
      marginTop: 8,
    },
    productDetailsContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
    },
    specsContainer: {
      gap: 12,
    },
    specRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    specLabel: {
      flex: 1,
      opacity: 0.7,
    },
    specValue: {
      flex: 1,
      textAlign: 'right',
    },
    dealerInfo: {
      marginTop: 12,
      gap: 10,
    },
    dealerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dealerText: {
      flex: 1,
      color: colors.text,
    },
    deliveryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    deliveryTextContainer: {
      flex: 1,
    },
    skeletonImage: {
      width: screenWidth,
      height: screenHeight * 0.5,
      backgroundColor: colors.backgroundSecondary,
    },
    skeletonTitle: { marginTop: 12, marginBottom: 8 },
    skeletonPrice: { marginTop: 8, marginBottom: 4 },
    skeletonText: { marginTop: 8 },
    skeletonButton: { marginTop: 16 },
    metricsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginTop: 8,
      gap: 12,
    },
    metricItem: {
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    metricIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.secondary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    metricText: {
      fontSize: RFValue(10),
      color: colors.text,
      fontFamily: Fonts.Medium,
      textAlign: 'center',
    },
    metricLabel: {
      fontSize: RFValue(8),
      color: colors.disabled,
      fontFamily: Fonts.Regular,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    detailLabel: {
      color: colors.disabled,
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
    },
    detailValue: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <CollapsibleContainer
          style={[styles.container, { marginTop: insets.top || 0 }]}>
          <CollapsibleHeaderContainer containerStyle={{ backgroundColor: 'transparent' }}>
            <SkeletonLoader width={screenWidth} height={screenHeight * 0.5} borderRadius={0} />
          </CollapsibleHeaderContainer>
          <CollapsibleScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={styles.ratingContainer}>
              <SkeletonLoader width={100} height={16} borderRadius={4} />
            </View>
            <View style={styles.productNameContainer}>
              <SkeletonLoader width="70%" height={24} borderRadius={4} style={styles.skeletonTitle} />
              <SkeletonLoader width={40} height={40} borderRadius={20} />
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              <SkeletonLoader width="40%" height={20} borderRadius={4} style={styles.skeletonPrice} />
              <SkeletonLoader width="60%" height={16} borderRadius={4} style={styles.skeletonText} />
            </View>
            <View style={styles.metricsRow}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.metricItem}>
                  <SkeletonLoader width={48} height={48} borderRadius={24} style={styles.metricIcon} />
                  <SkeletonLoader width={40} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                  <SkeletonLoader width={30} height={10} borderRadius={4} style={{ marginTop: 2 }} />
                </View>
              ))}
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <SkeletonLoader width="50%" height={18} borderRadius={4} />
              <SkeletonLoader width="100%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="95%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="90%" height={12} borderRadius={4} style={styles.skeletonText} />
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <SkeletonLoader width="50%" height={18} borderRadius={4} />
              <SkeletonLoader width="100%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="95%" height={12} borderRadius={4} style={styles.skeletonText} />
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: 16, flexDirection: 'row', gap: 12 }}>
              <SkeletonLoader width={120} height={48} borderRadius={24} style={styles.skeletonButton} />
              <SkeletonLoader width={120} height={48} borderRadius={24} style={styles.skeletonButton} />
            </View>
          </CollapsibleScrollView>
        </CollapsibleContainer>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <CustomText variant="h4" fontFamily={Fonts.Medium}>
          {error || 'Product not found'}
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedProductHeader
        productName={product.name}
        price={product.price}
        originalPrice={product.originalPrice}
        imageUrl={product.images?.[0]}
        productId={product.id}
        isWishlisted={isWishlisted}
        onWishlistPress={handleWishlist}
      />
      <CollapsibleContainer
        style={[styles.container, { marginTop: insets.top || 0 }]}>
        <CollapsibleHeaderContainer containerStyle={{ backgroundColor: 'transparent' }}>
          <ProductImageCarousel
            images={product.images || []}
            productName={product.name}
            productPrice={product.price}
            productId={product.id}
            isWishlisted={isWishlisted}
            onWishlistPress={handleWishlist}
          />

          <StickyView style={{ backgroundColor: colors.background, paddingTop: 0, marginTop: 0 }}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={RFValue(16)} color="#FFD700" />
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={styles.ratingText}>
                {product.rating || 4} ({product.reviewCount || 34})
              </CustomText>
            </View>
            <View style={styles.productNameContainer}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <CustomText
                    variant="h4"
                    fontFamily={Fonts.SemiBold}
                    style={{ color: colors.text }}>
                    {product.name}
                  </CustomText>

                  {product.stock === 0 ? (
                    <View style={[styles.compactStockBadge, { backgroundColor: colors.error + '20' }]}>
                      <Icon name="close-circle" size={RFValue(10)} color={colors.error} />
                      <CustomText
                        variant="h8"
                        fontFamily={Fonts.Medium}
                        style={[styles.stockText, { color: colors.error, fontSize: RFValue(10) }]}>
                        Out of stock
                      </CustomText>
                    </View>
                  ) : product.stock > 0 && product.stock <= 5 ? (
                    <View style={[styles.compactStockBadge, { backgroundColor: '#FF6B3520' }]}>
                      <Icon name="warning" size={RFValue(10)} color="#FF6B35" />
                      <CustomText
                        variant="h8"
                        fontFamily={Fonts.Medium}
                        style={[styles.stockText, { color: '#FF6B35', fontSize: RFValue(10) }]}>
                        Only {product.stock} left
                      </CustomText>
                    </View>
                  ) : product.stock > 5 ? (
                    <View style={[styles.compactStockBadge, { backgroundColor: colors.success + '20' }]}>
                      <Icon name="checkmark-circle" size={RFValue(10)} color={colors.success || '#4CAF50'} />
                      <CustomText
                        variant="h8"
                        fontFamily={Fonts.Medium}
                        style={[styles.stockText, { color: colors.success || '#4CAF50', fontSize: RFValue(10) }]}>
                        In stock
                      </CustomText>
                    </View>
                  ) : null}
                </View>
              </View>

            </View>
          </StickyView>
        </CollapsibleHeaderContainer>

        <CollapsibleScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}>

          {/* Action Buttons Section - Below Product Photo */}
          <View style={styles.actionButtonsSection}>
            <View style={styles.actionButtonsPriceInfo}>
              <View style={styles.actionButtonsPriceRow}>
                <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.actionButtonsPrice}>
                  ₹{product.price.toLocaleString()}
                </CustomText>
                {hasDiscount && (
                  <>
                    <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.actionButtonsMrp} numberOfLines={1}>
                      MRP ₹{(product.originalPrice || 0).toLocaleString()}
                    </CustomText>
                    <View style={styles.actionButtonsDiscount}>
                      <CustomText style={styles.actionButtonsDiscountText} numberOfLines={1}>
                        {discountPercentage}% OFF
                      </CustomText>
                    </View>
                  </>
                )}
              </View>
              <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.actionButtonsTaxText} numberOfLines={1}>
                Inclusive of all taxes
              </CustomText>
            </View>
            {product.stock === 0 ? (
              <TouchableOpacity
                style={[styles.actionButtonsAddToCart, styles.actionButtonsDisabled]}
                disabled>
                <CustomText style={styles.actionButtonsAddToCartText}>Out of Stock</CustomText>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  onPress={handleAddToCart}
                  style={[styles.actionButtonsAddToCart, styles.actionButtonsSecondary]}
                  activeOpacity={0.8}>
                  <Icon name="cart-outline" size={RFValue(16)} color={colors.secondary} />
                  <CustomText style={[styles.actionButtonsAddToCartText, { color: colors.secondary }]}>Add to cart</CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBuyNow}
                  style={styles.actionButtonsBuyNow}
                  activeOpacity={0.8}>
                  <CustomText style={styles.actionButtonsBuyNowText}>Buy Now</CustomText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsRow}>
            {product.category && (
              <View style={styles.metricItem}>
                <View style={styles.metricIcon}>
                  <Icon name="grid-outline" size={RFValue(20)} color={Colors.secondary} />
                </View>
                <CustomText style={styles.metricText} numberOfLines={1}>
                  {product.category}
                </CustomText>
                <CustomText style={styles.metricLabel}>Category</CustomText>
              </View>
            )}
            {product.brand && (
              <View style={styles.metricItem}>
                <View style={styles.metricIcon}>
                  <Icon name="pricetag-outline" size={RFValue(20)} color={Colors.secondary} />
                </View>
                <CustomText style={styles.metricText} numberOfLines={1}>
                  {product.brand}
                </CustomText>
                <CustomText style={styles.metricLabel}>Brand</CustomText>
              </View>
            )}
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Icon
                  name={product.stock > 0 ? "checkmark-circle-outline" : "close-circle-outline"}
                  size={RFValue(20)}
                  color={Colors.secondary}
                />
              </View>
              <CustomText style={styles.metricText}>
                {product.stock}
              </CustomText>
              <CustomText style={styles.metricLabel}>Stock</CustomText>
            </View>
            {product.vehicleType && (
              <View style={styles.metricItem}>
                <View style={styles.metricIcon}>
                  <Icon name="car-outline" size={RFValue(20)} color={Colors.secondary} />
                </View>
                <CustomText style={styles.metricText} numberOfLines={1}>
                  {product.vehicleType}
                </CustomText>
                <CustomText style={styles.metricLabel}>Type</CustomText>
              </View>
            )}
          </View>

          {/* Product Description */}
          {product.description && (
            <View style={styles.sectionContainer}>
              <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
                Overview
              </CustomText>
              <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.descriptionText}>
                {product.description}
              </CustomText>
            </View>
          )}

          {/* Product Details */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <View style={styles.sectionContainer}>
              <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
                Product Details
              </CustomText>
              <View style={{ gap: 8 }}>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <CustomText style={styles.detailLabel}>{key}</CustomText>
                    <CustomText style={styles.detailValue}>{String(value)}</CustomText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Dealer Information */}
          {dealer && (
            <View style={styles.sectionContainer}>
              <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
                Seller Information
              </CustomText>
              <View style={styles.dealerInfo}>
                <View style={styles.dealerRow}>
                  <Icon name="storefront" size={RFValue(18)} color={colors.secondary} />
                  <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.dealerText}>
                    {dealer.businessName || dealer.name}
                  </CustomText>
                </View>
                {dealer.address && (
                  <View style={styles.dealerRow}>
                    <Icon name="location" size={RFValue(18)} color={colors.text} style={{ opacity: 0.6 }} />
                    <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.dealerText}>
                      {dealer.address}
                    </CustomText>
                  </View>
                )}
                {dealer.phone && (
                  <View style={styles.dealerRow}>
                    <Icon name="call" size={RFValue(18)} color={colors.text} style={{ opacity: 0.6 }} />
                    <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.dealerText}>
                      {dealer.phone}
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Delivery Time Estimate */}
          <View style={styles.sectionContainer}>
            <View style={styles.deliveryInfo}>
              <Icon name="time-outline" size={RFValue(20)} color={colors.secondary} />
              <View style={styles.deliveryTextContainer}>
                <CustomText variant="h7" fontFamily={Fonts.Medium}>
                  Estimated Delivery
                </CustomText>
                <CustomText variant="h8" fontFamily={Fonts.Regular} style={{ opacity: 0.7, marginTop: 2 }}>
                  {product.stock > 0 ? '2-3 business days' : 'Currently unavailable'}
                </CustomText>
              </View>
            </View>
          </View>

          <View style={styles.serviceHighlightsContainer}>
            <View style={styles.serviceCard}>
              <Icon
                name="people-outline"
                size={RFValue(24)}
                color={colors.text}
                style={styles.serviceIcon}
              />
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={styles.serviceText}>
                {t('product.support247')}
              </CustomText>
            </View>
            <View style={styles.serviceCard}>
              <Icon
                name="bicycle-outline"
                size={RFValue(24)}
                color={colors.text}
                style={styles.serviceIcon}
              />
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={styles.serviceText}>
                {t('product.fastDelivery')}
              </CustomText>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <CustomText
              variant="h6"
              fontFamily={Fonts.SemiBold}
              style={styles.sectionTitle}>
              {t('product.highlights')}
            </CustomText>
            <View style={styles.highlightsContent}>
              {product.brand && (
                <View style={styles.highlightRow}>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Regular}
                    style={styles.highlightLabel}>
                    {t('product.brand')}
                  </CustomText>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Medium}
                    style={styles.highlightValue}>
                    {product.brand}
                  </CustomText>
                </View>
              )}
              {product.category && (
                <View style={styles.highlightRow}>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Regular}
                    style={styles.highlightLabel}>
                    {t('product.productType')}
                  </CustomText>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Medium}
                    style={styles.highlightValue}>
                    {product.category}
                  </CustomText>
                </View>
              )}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <View key={key} style={styles.highlightRow}>
                      <CustomText
                        variant="h7"
                        fontFamily={Fonts.Regular}
                        style={styles.highlightLabel}>
                        {key}
                      </CustomText>
                      <CustomText
                        variant="h7"
                        fontFamily={Fonts.Medium}
                        style={styles.highlightValue}>
                        {String(value)}
                      </CustomText>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <CustomText
              variant="h6"
              fontFamily={Fonts.SemiBold}
              style={styles.sectionTitle}>
              Info
            </CustomText>
            <View style={styles.informationContent}>
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={{ marginBottom: 8 }}>
                Disclaimer
              </CustomText>
              <CustomText
                variant="h7"
                fontFamily={Fonts.Regular}
                style={styles.disclaimerText}>
                All images are for representational purposes
              </CustomText>
            </View>
          </View>

          {/* Related Products */}
          {product && (
            <RelatedProducts
              currentProductIds={[product.id]}
              category={product.category}
              brand={product.brand}
              limit={10}
            />
          )}
        </CollapsibleScrollView>
      </CollapsibleContainer>
    </View>
  );
};

export default withCollapsibleContext(ProductDetail);

