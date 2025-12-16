import {View, StyleSheet, ScrollView, Image, TouchableOpacity} from 'react-native';
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

interface RelatedProductsProps {
  currentProductIds?: (string | number)[];
  limit?: number;
}

const RelatedProducts: FC<RelatedProductsProps> = ({
  currentProductIds = [],
  limit = 5,
}) => {
  const {colors} = useTheme();
  const {addItem} = useCartStore();
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductIds]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      // Fetch products excluding current cart items
      const response = await getProducts({
        page: 1,
        limit: limit + currentProductIds.length,
      });

      if (response?.data?.data) {
        const products = response.data.data.filter(
          (product: IProduct) => !currentProductIds.includes(product.id),
        );
        setRelatedProducts(products.slice(0, limit));
      }
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
          Frequently bought together
        </CustomText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {relatedProducts.map(product => (
          <TouchableOpacity
            key={product.id}
            style={[styles.productCard, {backgroundColor: colors.cardBackground}]}
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
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 10,
    gap: 12,
  },
  productCard: {
    width: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
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

