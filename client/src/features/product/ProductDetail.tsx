import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';
import {getProductById} from '@service/productService';
import {IProduct} from '@types/product/IProduct';
import ProductImageCarousel from '@components/product/ProductImageCarousel';
import AnimatedProductHeader from '@components/product/AnimatedProductHeader';
import CollapsibleSection from '@components/ui/CollapsibleSection';
import Icon from 'react-native-vector-icons/Ionicons';
import {useCartStore} from '@state/cartStore';
import {
  CollapsibleContainer,
  CollapsibleScrollView,
  CollapsibleHeaderContainer,
  withCollapsibleContext,
} from '@r0b0t3d/react-native-collapsible';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@hooks/useToast';
import {navigate} from '@utils/NavigationUtils';
import {useNavigation} from '@react-navigation/native';

type ProductDetailRouteParams = {
  ProductDetail: {
    productId: string;
  };
};

const ProductDetail: React.FC = () => {
  const route = useRoute<RouteProp<ProductDetailRouteParams, 'ProductDetail'>>();
  const {productId} = route.params;
  const {t} = useTranslation();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [showDeliveryBanner, setShowDeliveryBanner] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const {colors} = useTheme();
  const {addItem, getItemCount} = useCartStore();
  const insets = useSafeAreaInsets();
  const {showSuccess} = useToast();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProductById(productId);
        if (response.success && response.Response) {
          let productData: IProduct | null = null;
          if (Array.isArray(response.Response.products)) {
            productData = response.Response.products[0] || null;
          } else if ((response.Response as any).id || (response.Response as any)._id) {
            productData = response.Response as IProduct;
          }
          if (productData) {
            setProduct(productData);
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

  const handleAddToCart = () => {
    if (product) {
      const productWithId = {...product, _id: product.id};
      for (let i = 0; i < quantity; i++) {
        addItem(productWithId);
      }
      
      // Show success toast
      showSuccess('Product added to cart successfully', 2000);
      
      // Navigate to cart after a short delay to show the toast
      setTimeout(() => {
        try {
          // Navigate to MainTabs and then to Cart tab
          (navigation as any).navigate('MainTabs', {
            screen: 'Cart',
          });
        } catch (error) {
          // Fallback: navigate to MainTabs first, then Cart
          try {
            (navigation as any).navigate('MainTabs');
            setTimeout(() => {
              (navigation as any).navigate('Cart');
            }, 100);
          } catch (err) {
            console.error('Error navigating to cart:', err);
          }
        }
      }, 500);
    }
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
      paddingBottom: 100,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
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
      paddingTop: 12,
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
    stockBadge: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    stockText: {
      color: '#FF6B35',
      fontFamily: Fonts.Medium,
    },
    offerTag: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    offerTagText: {
      color: colors.white,
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
    },
    quantityText: {
      paddingHorizontal: 16,
      paddingTop: 8,
      opacity: 0.7,
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
      paddingTop: 16,
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
      paddingTop: 8,
    },
    highlightRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
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
    viewMoreLink: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 4,
    },
    viewMoreText: {
      color: colors.secondary,
    },
    informationContent: {
      paddingTop: 8,
    },
    disclaimerText: {
      opacity: 0.7,
      lineHeight: 20,
    },
    emiBanner: {
      backgroundColor: colors.secondary,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    emiBannerText: {
      flex: 1,
    },
    emiBannerTitle: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      marginBottom: 4,
    },
    emiBannerSubtitle: {
      color: colors.white,
      opacity: 0.9,
      fontSize: RFValue(10),
    },
    emiBannerLink: {
      color: colors.white,
      fontFamily: Fonts.Medium,
      fontSize: RFValue(12),
    },
    gstinCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    gstinIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    gstinContent: {
      flex: 1,
    },
    gstinTitle: {
      fontFamily: Fonts.Medium,
      marginBottom: 4,
    },
    gstinSubtitle: {
      fontSize: RFValue(10),
      opacity: 0.7,
    },
    deliveryBanner: {
      backgroundColor: '#007AFF',
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deliveryBannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    deliveryIcon: {
      marginRight: 8,
    },
    deliveryText: {
      color: colors.white,
      fontFamily: Fonts.Medium,
      flex: 1,
    },
    deliveryCloseButton: {
      padding: 4,
    },
    fixedBottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: getResponsiveValue(isSmallMobile ? 12 : 16, 24, 32),
      paddingVertical: getResponsiveValue(12, 16, 20),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      ...(isDesktop && {
        maxWidth: 1200,
        alignSelf: 'center',
        left: 'auto',
        right: 'auto',
        width: '100%',
      }),
    },
    bottomBarLeft: {
      flex: 1,
      marginRight: getResponsiveValue(8, 12, 16),
      minWidth: 0, // Allow shrinking
    },
    bottomBarQuantity: {
      fontFamily: Fonts.Medium,
      marginBottom: getResponsiveValue(4, 6, 8),
      fontSize: RFValue(getResponsiveValue(12, 14, 16)),
    },
    bottomBarPrice: {
      fontFamily: Fonts.SemiBold,
      color: colors.secondary,
      marginBottom: getResponsiveValue(2, 4, 6),
      fontSize: RFValue(getResponsiveValue(16, 18, 20)),
    },
    bottomBarMrp: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
      fontSize: RFValue(getResponsiveValue(10, 12, 14)),
      marginLeft: getResponsiveValue(4, 6, 8),
    },
    bottomBarDiscount: {
      backgroundColor: '#007AFF',
      paddingHorizontal: getResponsiveValue(6, 8, 10),
      paddingVertical: getResponsiveValue(2, 4, 6),
      borderRadius: getResponsiveValue(6, 8, 10),
      marginLeft: getResponsiveValue(4, 6, 8),
    },
    bottomBarDiscountText: {
      color: colors.white,
      fontSize: RFValue(getResponsiveValue(8, 10, 12)),
      fontFamily: Fonts.Medium,
    },
    bottomBarTaxText: {
      fontSize: RFValue(getResponsiveValue(9, 11, 13)),
      opacity: 0.7,
      marginTop: getResponsiveValue(2, 4, 6),
    },
    bottomBarRight: {
      flex: isTablet ? 0 : 0, // Don't take flex space, use minWidth instead
      alignItems: 'flex-end',
      minWidth: getResponsiveValue(isSmallMobile ? 90 : 100, 140, 180),
      flexShrink: 0, // Don't shrink button
    },
    addToCartButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: getResponsiveValue(isSmallMobile ? 16 : 20, 32, 40),
      paddingVertical: getResponsiveValue(12, 16, 18),
      borderRadius: getResponsiveValue(8, 10, 12),
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: getResponsiveValue(isSmallMobile ? 80 : 100, 140, 180),
      flexDirection: 'row',
      gap: getResponsiveValue(4, 8, 10),
    },
    addToCartText: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(getResponsiveValue(12, 16, 18)),
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
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
      <CollapsibleContainer
        style={[styles.container, {marginTop: insets.top || 0}]}>
        <CollapsibleHeaderContainer containerStyle={{backgroundColor: 'transparent'}}>
          <ProductImageCarousel 
            images={product.images || []}
            productName={product.name}
            productPrice={product.price}
            productId={product.id}
          />
          <AnimatedProductHeader
            productName={product.name}
            price={product.price}
            originalPrice={product.originalPrice}
            imageUrl={product.images?.[0]}
            productId={product.id}
          />
        </CollapsibleHeaderContainer>

        <CollapsibleScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}>
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
            <CustomText
              variant="h4"
              fontFamily={Fonts.SemiBold}
              style={styles.productName}>
              {product.name}
            </CustomText>
            <Pressable onPress={handleWishlist} style={styles.wishlistButton}>
              <Icon
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={RFValue(20)}
                color={isWishlisted ? '#FF6B9D' : colors.text}
              />
            </Pressable>
          </View>

          {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
            <View style={styles.stockBadge}>
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={styles.stockText}>
                Only {product.stock} left
              </CustomText>
            </View>
          )}

          <View style={[styles.priceContainer, {paddingTop: 8}]}>
            {product.offers && product.offers.length > 0 ? (
              <View style={styles.offerTag}>
                <CustomText style={styles.offerTagText}>
                  {product.offers[0].title}
                </CustomText>
              </View>
            ) : (
              <View style={styles.offerTag}>
                <CustomText style={styles.offerTagText}>
                  No cost EMI offer
                </CustomText>
              </View>
            )}
          </View>

          {product.quantity && (
            <CustomText
              variant="h7"
              fontFamily={Fonts.Medium}
              style={styles.quantityText}>
              {product.quantity}
            </CustomText>
          )}

          <View style={[styles.priceContainer, {paddingTop: 12}]}>
            <CustomText
              variant="h5"
              fontFamily={Fonts.SemiBold}
              style={styles.currentPrice}>
              ₹{product.price.toLocaleString()}
            </CustomText>
            {hasDiscount && (
              <>
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.Medium}
                  style={styles.originalPrice}>
                  ₹{product.originalPrice?.toLocaleString()}
                </CustomText>
                <View style={styles.discountBadge}>
                  <CustomText style={styles.discountBadgeText}>
                    {discountPercentage}% OFF
                  </CustomText>
                </View>
              </>
            )}
          </View>

          <Pressable style={styles.viewDetailsLink}>
            <CustomText
              variant="h7"
              fontFamily={Fonts.Medium}
              style={styles.viewDetailsText}>
              View product details
            </CustomText>
            <Icon
              name="chevron-up"
              size={RFValue(14)}
              color={colors.secondary}
            />
          </Pressable>

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

          <CollapsibleSection title={t('product.highlights')} defaultExpanded={true}>
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
                  {Object.entries(product.specifications).slice(0, 3).map(([key, value]) => (
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
              <Pressable style={styles.viewMoreLink}>
                <CustomText
                  variant="h7"
                  fontFamily={Fonts.Medium}
                  style={styles.viewMoreText}>
                  View more
                </CustomText>
                <Icon
                  name="chevron-down"
                  size={RFValue(14)}
                  color={colors.secondary}
                />
              </Pressable>
            </View>
          </CollapsibleSection>

          <CollapsibleSection title="Info" defaultExpanded={false}>
            <View style={styles.informationContent}>
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={{marginBottom: 8}}>
                Disclaimer
              </CustomText>
              <CustomText
                variant="h7"
                fontFamily={Fonts.Regular}
                style={styles.disclaimerText}>
                All images are for representational purposes
              </CustomText>
            </View>
          </CollapsibleSection>

          <View style={styles.emiBanner}>
            <View style={styles.emiBannerText}>
              <CustomText style={styles.emiBannerTitle}>
                No Cost EMI Plans at ₹{Math.round(product.price / 3)}/month
              </CustomText>
              <CustomText style={styles.emiBannerSubtitle}>
                Applicable only on credit card payments
              </CustomText>
            </View>
            <Pressable>
              <CustomText style={styles.emiBannerLink}>View plans</CustomText>
            </Pressable>
          </View>

          <View style={styles.gstinCard}>
            <View style={styles.gstinIcon}>
              <Icon name="percent" size={RFValue(20)} color={colors.white} />
            </View>
            <View style={styles.gstinContent}>
              <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.gstinTitle}>
                Add GSTIN
              </CustomText>
              <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.gstinSubtitle}>
                Claim GST credit of 18% on this product.
              </CustomText>
            </View>
            <Icon name="chevron-forward" size={RFValue(16)} color={colors.text} />
          </View>

          {showDeliveryBanner && (
            <View style={styles.deliveryBanner}>
              <View style={styles.deliveryBannerContent}>
                <Icon
                  name="bicycle-outline"
                  size={RFValue(20)}
                  color={colors.white}
                  style={styles.deliveryIcon}
                />
                <CustomText style={styles.deliveryText}>
                  Get FREE delivery on your order above ₹149
                </CustomText>
              </View>
              <Pressable
                onPress={() => setShowDeliveryBanner(false)}
                style={styles.deliveryCloseButton}>
                <Icon name="close" size={RFValue(18)} color={colors.white} />
              </Pressable>
            </View>
          )}
        </CollapsibleScrollView>
      </CollapsibleContainer>
      
      <View style={[styles.fixedBottomBar, {paddingBottom: Math.max(insets.bottom, 12)}]}>
        <View style={styles.bottomBarLeft}>
          <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.bottomBarQuantity} numberOfLines={1}>
            {quantity} {product.quantity || 'set'}
          </CustomText>
          <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: getResponsiveValue(4, 6, 8), gap: getResponsiveValue(4, 6, 8), flexShrink: 1}}>
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={[styles.bottomBarPrice, {flexShrink: 0}]}>
              ₹{product.price.toLocaleString()}
            </CustomText>
            {hasDiscount && (
              <>
                <CustomText variant="h7" fontFamily={Fonts.Medium} style={[styles.bottomBarMrp, {flexShrink: 1}]} numberOfLines={1}>
                  MRP ₹{product.originalPrice?.toLocaleString()}
                </CustomText>
                <View style={styles.bottomBarDiscount}>
                  <CustomText style={styles.bottomBarDiscountText} numberOfLines={1}>
                    {discountPercentage}% OFF
                  </CustomText>
                </View>
              </>
            )}
          </View>
          <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.bottomBarTaxText} numberOfLines={1}>
            Inclusive of all taxes
          </CustomText>
        </View>
        <View style={styles.bottomBarRight}>
          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.addToCartButton}
            activeOpacity={0.8}>
            <CustomText style={styles.addToCartText}>Add to cart</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default withCollapsibleContext(ProductDetail);

