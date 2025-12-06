import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
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

type ProductDetailRouteParams = {
  ProductDetail: {
    productId: string;
  };
};

const ProductDetail: React.FC = () => {
  const route = useRoute<RouteProp<ProductDetailRouteParams, 'ProductDetail'>>();
  const {productId} = route.params;
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [highlightsExpanded, setHighlightsExpanded] = useState<boolean>(false);
  const {colors} = useTheme();
  const {addItem, getItemCount} = useCartStore();
  const insets = useSafeAreaInsets();

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
      addItem(productWithId);
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const cartCount = product ? getItemCount(product.id) : 0;
  const discountAmount =
    product && product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

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
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 8,
    },
    ratingText: {
      color: colors.secondary,
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
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
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
      gap: 12,
    },
    currentPrice: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    currentPriceText: {
      color: colors.white,
    },
    originalPrice: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    discountText: {
      color: colors.secondary,
    },
    card: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardContent: {
      flex: 1,
      marginLeft: 12,
    },
    cardTitle: {
      marginBottom: 4,
    },
    cardLink: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    cardLinkText: {
      color: colors.secondary,
    },
    policyCardsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 12,
    },
    policyCard: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    policyIcon: {
      marginBottom: 8,
    },
    policyText: {
      textAlign: 'center',
      fontSize: RFValue(10),
    },
    highlightsContent: {
      paddingTop: 8,
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
    },
    highlightValue: {
      fontFamily: Fonts.Medium,
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
    addToCartButton: {
      backgroundColor: '#FF6B9D',
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 32,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addToCartText: {
      color: colors.white,
      fontFamily: Fonts.SemiBold,
      fontSize: RFValue(16),
    },
    brandLogo: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
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
          <ProductImageCarousel images={product.images || []} />
          <AnimatedProductHeader
            productName={product.name}
            price={product.price}
            originalPrice={product.originalPrice}
            imageUrl={product.images?.[0]}
          />
        </CollapsibleHeaderContainer>

        <CollapsibleScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={RFValue(16)} color={colors.secondary} />
            <CustomText
              variant="h7"
              fontFamily={Fonts.Medium}
              style={styles.ratingText}>
              {product.rating || 4.1} ({product.reviewCount || 32921})
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

          {product.quantity && (
            <CustomText
              variant="h7"
              fontFamily={Fonts.Medium}
              style={styles.quantityText}>
              {product.quantity}
            </CustomText>
          )}

          <View style={styles.priceContainer}>
            <View style={styles.currentPrice}>
              <CustomText
                variant="h5"
                fontFamily={Fonts.SemiBold}
                style={styles.currentPriceText}>
                ₹{product.price.toLocaleString()}
              </CustomText>
            </View>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.Medium}
                  style={styles.originalPrice}>
                  ₹{product.originalPrice.toLocaleString()}
                </CustomText>
                <CustomText
                  variant="h7"
                  fontFamily={Fonts.Medium}
                  style={styles.discountText}>
                  ₹{discountAmount} OFF
                </CustomText>
              </>
            )}
          </View>

          <View style={styles.card}>
            <View
              style={[
                styles.brandLogo,
                {backgroundColor: colors.backgroundSecondary},
              ]}
            />
            <View style={styles.cardContent}>
              <CustomText
                variant="h6"
                fontFamily={Fonts.Medium}
                style={styles.cardTitle}>
                Get at ₹{Math.round(product.price * 0.89)} with coupon offers
              </CustomText>
              <Pressable style={styles.cardLink}>
                <CustomText
                  variant="h7"
                  fontFamily={Fonts.Medium}
                  style={styles.cardLinkText}>
                  View all offers
                </CustomText>
                <Icon
                  name="chevron-forward"
                  size={RFValue(14)}
                  color={colors.secondary}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            {product.brand && (
              <View
                style={[
                  styles.brandLogo,
                  {backgroundColor: colors.backgroundSecondary},
                ]}
              />
            )}
            <View style={styles.cardContent}>
              <CustomText
                variant="h6"
                fontFamily={Fonts.Medium}
                style={styles.cardTitle}>
                {product.brand ? `View all ${product.brand} products` : 'View brand products'}
              </CustomText>
              <Pressable style={styles.cardLink}>
                <Icon
                  name="chevron-forward"
                  size={RFValue(14)}
                  color={colors.text}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.policyCardsContainer}>
            <View style={styles.policyCard}>
              <Icon
                name="close-circle-outline"
                size={RFValue(24)}
                color={colors.text}
                style={styles.policyIcon}
              />
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={styles.policyText}>
                No Return Or Exchange
              </CustomText>
            </View>
            <View style={styles.policyCard}>
              <Icon
                name="flash-outline"
                size={RFValue(24)}
                color={colors.text}
                style={styles.policyIcon}
              />
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={styles.policyText}>
                Fast Delivery
              </CustomText>
            </View>
          </View>

          <CollapsibleSection title="Highlights" defaultExpanded={false}>
            <View style={styles.highlightsContent}>
              {product.brand && (
                <View style={styles.highlightRow}>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Regular}
                    style={styles.highlightLabel}>
                    Brand
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
                    Product Type
                  </CustomText>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Medium}
                    style={styles.highlightValue}>
                    {product.category}
                  </CustomText>
                </View>
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

          <CollapsibleSection title="Information" defaultExpanded={false}>
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

          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.addToCartButton}
            activeOpacity={0.8}>
            <CustomText style={styles.addToCartText}>Add to cart</CustomText>
          </TouchableOpacity>
        </CollapsibleScrollView>
      </CollapsibleContainer>
    </View>
  );
};

export default withCollapsibleContext(ProductDetail);

