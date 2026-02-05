import { View, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import { Colors, Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { useCartStore } from '@state/cartStore';
import { useTheme } from '@hooks/useTheme';
import { getProducts } from '@service/productService';
import { IProduct } from '../../types/product/IProduct';
import { navigate } from '@utils/NavigationUtils';
import SkeletonLoader from '@components/ui/SkeletonLoader';

interface RelatedProductsProps {
  currentProductIds?: (string | number)[];
  category?: string;
  brand?: string;
  limit?: number;
}

const RelatedProducts: FC<RelatedProductsProps> = ({
  currentProductIds = [],
  category,
  brand,
  limit = 10,
}) => {
  const { colors } = useTheme();
  const { addItem } = useCartStore();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductIds, category, brand]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);

      // First try to fetch by category if available
      let products: IProduct[] = [];

      if (category) {
        try {
          const categoryResponse = await getProducts({
            page: 1,
            limit: limit + currentProductIds.length + 5,
            category: category,
          });

          if (categoryResponse?.Response?.products) {
            products = categoryResponse.Response.products.filter(
              (product: IProduct) => !currentProductIds.includes(product.id),
            );
          }
        } catch (error) {
          console.log('Error fetching products by category:', error);
        }
      }

      // If we don't have enough products from category, try brand
      if (products.length < limit && brand) {
        try {
          const brandResponse = await getProducts({
            page: 1,
            limit: limit + currentProductIds.length + 5,
          });

          if (brandResponse?.Response?.products) {
            const brandProducts = brandResponse.Response.products.filter(
              (product: IProduct) =>
                !currentProductIds.includes(product.id) &&
                product.brand === brand &&
                !products.some(p => p.id === product.id),
            );
            products = [...products, ...brandProducts];
          }
        } catch (error) {
          console.log('Error fetching products by brand:', error);
        }
      }

      // If still not enough, fetch general products
      if (products.length < limit) {
        try {
          const generalResponse = await getProducts({
            page: 1,
            limit: limit + currentProductIds.length + 5,
          });

          if (generalResponse?.Response?.products) {
            const generalProducts = generalResponse.Response.products.filter(
              (product: IProduct) =>
                !currentProductIds.includes(product.id) &&
                !products.some(p => p.id === product.id),
            );
            products = [...products, ...generalProducts];
          }
        } catch (error) {
          console.log('Error fetching general products:', error);
        }
      }

      setRelatedProducts(products.slice(0, limit));
    } catch (error) {
      console.log('Error fetching related products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: IProduct) => {
    addItem(product);
  };

  const handleProductPress = (product: IProduct) => {
    navigate('ProductDetail', { productId: product.id });
  };

  if (relatedProducts.length === 0 && !loading) {
    return null;
  }

  const renderProductItem = ({ item }: { item: IProduct }) => {
    const discount =
      item.originalPrice && item.originalPrice > item.price
        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
        : 0;

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.cardBackground }]}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          {item.images?.[0] ? (
            <Image
              source={{ uri: item.images[0] }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Icon name="image-outline" size={RFValue(24)} color={colors.disabled} />
            </View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <CustomText style={styles.discountText}>{discount}% off</CustomText>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <CustomText
            numberOfLines={2}
            variant="h8"
            fontFamily={Fonts.Medium}
            style={styles.productName}>
            {item.name}
          </CustomText>

          <View style={styles.ratingRow}>
            <Icon name="star" size={RFValue(8)} color="#FFD700" />
            <CustomText style={styles.ratingText}>
              {item.rating || 4.2} ({item.reviewCount || 120})
            </CustomText>
          </View>

          <View style={styles.priceRow}>
            <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.price}>
              ₹{item.price.toLocaleString()}
            </CustomText>
            {item.originalPrice && item.originalPrice > item.price && (
              <CustomText style={styles.mrp}>
                ₹{item.originalPrice.toLocaleString()}
              </CustomText>
            )}
          </View>

          {item.stock > 0 ? (
            <CustomText style={styles.deliveryText} numberOfLines={1}>
              Free Delivery by {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
            </CustomText>
          ) : (
            <CustomText style={[styles.deliveryText, { color: colors.error }]}>
              Currently Unavailable
            </CustomText>
          )}

          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.border }]}
            onPress={() => handleAddToCart(item)}
            activeOpacity={0.7}>
            <CustomText
              variant="h9"
              fontFamily={Fonts.Medium}
              style={{ color: '#000', fontSize: RFValue(9) }}>
              Add to Cart
            </CustomText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.productCard, { backgroundColor: colors.cardBackground, width: 150 }]}>
          <SkeletonLoader width="100%" height={150} borderRadius={0} />
          <View style={styles.productInfo}>
            <SkeletonLoader width="90%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="40%" height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.title}>
          You might also like
        </CustomText>
      </View>

      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={relatedProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  title: {
    fontSize: RFValue(12),
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  productCard: {
    width: 110,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 90,
    width: '100%',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#cc0c39',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: RFValue(8),
    fontFamily: Fonts.Bold,
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: RFValue(10),
    lineHeight: 14,
    height: 28,
    marginBottom: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 3,
  },
  ratingText: {
    fontSize: RFValue(8),
    color: '#007185',
    fontFamily: Fonts.Regular,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 2,
  },
  price: {
    fontSize: RFValue(12),
    color: '#B12704',
  },
  mrp: {
    fontSize: RFValue(9),
    color: '#565959',
    textDecorationLine: 'line-through',
  },
  deliveryText: {
    fontSize: RFValue(8),
    color: '#565959',
    marginBottom: 6,
  },
  addButton: {
    backgroundColor: '#FFD814',
    paddingVertical: 5,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 0,
    elevation: 2,
  },
});

export default RelatedProducts;
