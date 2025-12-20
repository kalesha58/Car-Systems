import {View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions} from 'react-native';
import React, {FC, useEffect, useState} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {useCartStore} from '@state/cartStore';
import {useTheme} from '@hooks/useTheme';
import {getProducts} from '@service/productService';
import {IProduct} from '../../types/product/IProduct';
import {navigate} from '@utils/NavigationUtils';
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
  const {colors} = useTheme();
  const {addItem} = useCartStore();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Calculate card width for 3 products per row
  const screenWidth = Dimensions.get('window').width;
  const padding = 20; // Total horizontal padding (10 on each side)
  const gap = 12; // Gap between cards
  const cardWidth = (screenWidth - padding - (gap * 2)) / 3; // 3 cards per row

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
            limit: limit + currentProductIds.length + 5, // Fetch extra to account for filtering
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
    navigate('ProductDetail', {productId: product.id});
  };

  if (relatedProducts.length === 0 && !loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
          You may also like
        </CustomText>
        <CustomText variant="h9" style={{opacity: 0.6}}>
          {category ? `Similar products in ${category}` : 'Frequently bought together'}
        </CustomText>
      </View>

      {loading ? (
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View 
              key={i} 
              style={[
                styles.productCard, 
                {backgroundColor: colors.cardBackground, width: cardWidth}
              ]}>
              <SkeletonLoader width="100%" height={100} borderRadius={0} />
              <View style={styles.productInfo}>
                <SkeletonLoader width="90%" height={16} borderRadius={4} style={{marginBottom: 6}} />
                <SkeletonLoader width="70%" height={14} borderRadius={4} style={{marginBottom: 8}} />
                <SkeletonLoader width="100%" height={32} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {relatedProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productCard, 
                {backgroundColor: colors.cardBackground, width: cardWidth}
              ]}
              onPress={() => handleProductPress(product)}
              activeOpacity={0.7}>
              {product.images?.[0] ? (
                <Image
                  source={{uri: product.images[0]}}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productImage, styles.placeholderImage]}>
                  <Icon name="image-off" size={RFValue(30)} color={colors.disabled} />
                </View>
              )}
              <View style={styles.productInfo}>
                <CustomText
                  numberOfLines={2}
                  variant="h9"
                  fontFamily={Fonts.Medium}
                  style={styles.productName}>
                  {product.name}
                </CustomText>
                <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.productPrice}>
                  ₹{product.price}
                </CustomText>
                <TouchableOpacity
                  style={[styles.addButton, {backgroundColor: colors.secondary}]}
                  onPress={() => handleAddToCart(product)}
                  activeOpacity={0.7}>
                  <Icon name="plus" size={RFValue(14)} color="#fff" />
                  <CustomText
                    variant="h9"
                    fontFamily={Fonts.SemiBold}
                    style={styles.addButtonText}>
                    Add
                  </CustomText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  header: {
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: 12,
  },
  productCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.backgroundSecondary,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    marginBottom: 6,
    minHeight: 32,
  },
  productPrice: {
    marginBottom: 8,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
  },
});

export default RelatedProducts;

