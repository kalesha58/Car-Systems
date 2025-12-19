import React, {useEffect, useState} from 'react';
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
import {useRoute, RouteProp} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import {useTranslation} from 'react-i18next';
import {getProductById} from '@service/productService';
import {IProduct} from '@types/product/IProduct';
import ProductImageCarousel from '@components/product/ProductImageCarousel';
import AnimatedProductHeader from '@components/product/AnimatedProductHeader';
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
import {getDealerById} from '@service/dealerService';
import {IDealer} from '@types/dealer/IDealer';
import RelatedProducts from '@features/cart/RelatedProducts';
import SkeletonLoader from '@components/ui/SkeletonLoader';

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
  const [showProductDetails, setShowProductDetails] = useState<boolean>(false);
  const [dealer, setDealer] = useState<IDealer | null>(null);
  const [loadingDealer, setLoadingDealer] = useState<boolean>(false);
  const {colors} = useTheme();
  const {addItem, getItemCount} = useCartStore();
  const insets = useSafeAreaInsets();
  const {showSuccess, showError} = useToast();
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
    
    if (quantity > product.stock) {
      showError(`Only ${product.stock} items available in stock`);
      return;
    }

    const productWithId = {...product, _id: product.id};
    for (let i = 0; i < quantity; i++) {
      addItem(productWithId);
    }
    
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
    
    if (quantity > product.stock) {
      showError(`Only ${product.stock} items available in stock`);
      return;
    }

    // Add to cart first
    const productWithId = {...product, _id: product.id};
    for (let i = 0; i < quantity; i++) {
      addItem(productWithId);
    }
    
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

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    
    if (newQuantity < 1) {
      setQuantity(1);
      return;
    }
    
    if (newQuantity > product.stock) {
      showError(`Only ${product.stock} items available in stock`);
      setQuantity(product.stock);
      return;
    }
    
    setQuantity(newQuantity);
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 6,
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
    sectionContainer: {
      marginHorizontal: 16,
      marginTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      marginBottom: 12,
      paddingBottom: 8,
    },
    informationContent: {
      paddingTop: 8,
    },
    disclaimerText: {
      opacity: 0.7,
      lineHeight: 20,
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
      alignItems: 'flex-end',
      flexShrink: 0,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      gap: getResponsiveValue(8, 12, 16),
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    addToCartButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: getResponsiveValue(isSmallMobile ? 14 : 18, 24, 28),
      paddingVertical: getResponsiveValue(12, 16, 18),
      borderRadius: getResponsiveValue(8, 10, 12),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: getResponsiveValue(4, 6, 8),
      minWidth: getResponsiveValue(isSmallMobile ? 90 : 100, 120, 140),
    },
    secondaryButton: {
      backgroundColor: colors.backgroundSecondary || '#f5f5f5',
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    buyNowButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: getResponsiveValue(isSmallMobile ? 16 : 20, 28, 32),
      paddingVertical: getResponsiveValue(12, 16, 18),
      borderRadius: getResponsiveValue(8, 10, 12),
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: getResponsiveValue(isSmallMobile ? 80 : 90, 110, 130),
    },
    disabledButton: {
      backgroundColor: colors.disabled || '#cccccc',
      opacity: 0.6,
    },
    addToCartText: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(getResponsiveValue(12, 14, 16)),
    },
    buyNowText: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(getResponsiveValue(12, 14, 16)),
    },
    quantitySelectorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    quantityLabel: {
      color: colors.text,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 4,
      gap: 16,
    },
    quantityButton: {
      padding: 8,
      borderRadius: 4,
    },
    quantityButtonDisabled: {
      opacity: 0.4,
    },
    quantityValue: {
      minWidth: 30,
      textAlign: 'center',
      color: colors.text,
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
    skeletonTitle: {marginTop: 12, marginBottom: 8},
    skeletonPrice: {marginTop: 8, marginBottom: 4},
    skeletonText: {marginTop: 8},
    skeletonButton: {marginTop: 16},
    metricsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginTop: 16,
      gap: 16,
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
          style={[styles.container, {marginTop: insets.top || 0}]}>
          <CollapsibleHeaderContainer containerStyle={{backgroundColor: 'transparent'}}>
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
            <View style={{paddingHorizontal: 16}}>
              <SkeletonLoader width="40%" height={20} borderRadius={4} style={styles.skeletonPrice} />
              <SkeletonLoader width="60%" height={16} borderRadius={4} style={styles.skeletonText} />
            </View>
            <View style={styles.metricsRow}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.metricItem}>
                  <SkeletonLoader width={48} height={48} borderRadius={24} style={styles.metricIcon} />
                  <SkeletonLoader width={40} height={12} borderRadius={4} style={{marginTop: 4}} />
                  <SkeletonLoader width={30} height={10} borderRadius={4} style={{marginTop: 2}} />
                </View>
              ))}
            </View>
            <View style={{paddingHorizontal: 16, marginTop: 16}}>
              <SkeletonLoader width="50%" height={18} borderRadius={4} />
              <SkeletonLoader width="100%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="95%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="90%" height={12} borderRadius={4} style={styles.skeletonText} />
            </View>
            <View style={{paddingHorizontal: 16, marginTop: 24}}>
              <SkeletonLoader width="50%" height={18} borderRadius={4} />
              <SkeletonLoader width="100%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="95%" height={12} borderRadius={4} style={styles.skeletonText} />
            </View>
            <View style={{paddingHorizontal: 16, marginTop: 16, flexDirection: 'row', gap: 12}}>
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

          {/* Stock Status */}
          {product.stock === 0 ? (
            <View style={[styles.stockBadge, {backgroundColor: colors.error + '20'}]}>
              <Icon name="close-circle" size={RFValue(16)} color={colors.error} />
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={[styles.stockText, {color: colors.error}]}>
                Out of stock
              </CustomText>
            </View>
          ) : product.stock > 0 && product.stock <= 5 ? (
            <View style={styles.stockBadge}>
              <Icon name="warning" size={RFValue(16)} color="#FF6B35" />
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={styles.stockText}>
                Only {product.stock} left
              </CustomText>
            </View>
          ) : product.stock > 5 ? (
            <View style={[styles.stockBadge, {backgroundColor: colors.success + '20'}]}>
              <Icon name="checkmark-circle" size={RFValue(16)} color={colors.success || '#4CAF50'} />
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={[styles.stockText, {color: colors.success || '#4CAF50'}]}>
                In stock
              </CustomText>
            </View>
          ) : null}

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

          {/* Quantity Selector */}
          <View style={styles.quantitySelectorContainer}>
            <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.quantityLabel}>
              Quantity
            </CustomText>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(quantity - 1)}
                disabled={quantity === 1 || product.stock === 0}>
                <Icon
                  name="remove"
                  size={RFValue(18)}
                  color={quantity === 1 || product.stock === 0 ? colors.disabled : colors.text}
                />
              </TouchableOpacity>
              <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.quantityValue}>
                {quantity}
              </CustomText>
              <TouchableOpacity
                style={[styles.quantityButton, quantity >= product.stock && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stock || product.stock === 0}>
                <Icon
                  name="add"
                  size={RFValue(18)}
                  color={quantity >= product.stock || product.stock === 0 ? colors.disabled : colors.text}
                />
              </TouchableOpacity>
            </View>
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
              <View style={{gap: 8}}>
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
                    <Icon name="location" size={RFValue(18)} color={colors.text} style={{opacity: 0.6}} />
                    <CustomText variant="h8" fontFamily={Fonts.Regular} style={styles.dealerText}>
                      {dealer.address}
                    </CustomText>
                  </View>
                )}
                {dealer.phone && (
                  <View style={styles.dealerRow}>
                    <Icon name="call" size={RFValue(18)} color={colors.text} style={{opacity: 0.6}} />
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
                <CustomText variant="h8" fontFamily={Fonts.Regular} style={{opacity: 0.7, marginTop: 2}}>
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

          {/* Related Products */}
          {product && (
            <RelatedProducts
              currentProductIds={[product.id]}
              limit={5}
            />
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
              ₹{(product.price * quantity).toLocaleString()}
            </CustomText>
            {hasDiscount && (
              <>
                <CustomText variant="h7" fontFamily={Fonts.Medium} style={[styles.bottomBarMrp, {flexShrink: 1}]} numberOfLines={1}>
                  MRP ₹{((product.originalPrice || 0) * quantity).toLocaleString()}
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
          {product.stock === 0 ? (
            <TouchableOpacity
              style={[styles.addToCartButton, styles.disabledButton]}
              disabled>
              <CustomText style={styles.addToCartText}>Out of Stock</CustomText>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                onPress={handleAddToCart}
                style={[styles.addToCartButton, styles.secondaryButton]}
                activeOpacity={0.8}>
                <Icon name="cart-outline" size={RFValue(16)} color={colors.secondary} />
                <CustomText style={[styles.addToCartText, {color: colors.secondary}]}>Add to cart</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBuyNow}
                style={styles.buyNowButton}
                activeOpacity={0.8}>
                <CustomText style={styles.buyNowText}>Buy Now</CustomText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default withCollapsibleContext(ProductDetail);

