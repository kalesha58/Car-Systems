import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { getProducts } from '@service/productService';
import { IProduct } from '../../types/product/IProduct';
import { RFValue } from 'react-native-responsive-fontsize';
import { navigate } from '@utils/NavigationUtils';

const CompactProductGrid: FC = () => {
  const { colors } = useTheme();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        // Fetch recent/popular products as best sellers
        const response = await getProducts({
          limit: 8,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        if (response?.success && response?.Response?.products) {
          setProducts(response.Response.products.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching best sellers:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  const styles = StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    item: {
      width: '22%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    productCard: {
      width: '100%',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 8,
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      borderRadius: 6,
    },
    productName: {
      textAlign: 'center',
      marginBottom: 4,
      minHeight: RFValue(16),
    },
    price: {
      textAlign: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    loadingItem: {
      width: '22%',
      height: 80,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderProduct = (product: IProduct, index: number) => {
    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
    const displayPrice = product.originalPrice && product.originalPrice > product.price 
      ? product.price 
      : product.price;

    return (
      <TouchableOpacity
        key={product.id || index}
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => {
          navigate('ProductDetail', { productId: product.id });
        }}>
        <View style={styles.productCard}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, { backgroundColor: colors.disabled, justifyContent: 'center', alignItems: 'center' }]}>
                <CustomText style={{ fontSize: RFValue(6), color: colors.textSecondary }}>No Image</CustomText>
              </View>
            )}
          </View>
          <CustomText
            style={styles.productName}
            variant="h9"
            fontFamily={Fonts.Medium}
            numberOfLines={2}>
            {product.name}
          </CustomText>
          <CustomText style={styles.price} variant="h9" fontFamily={Fonts.Bold}>
            ₹{displayPrice}
          </CustomText>
        </View>
      </TouchableOpacity>
    );
  };

  // Render products in rows of 4
  const renderRows = () => {
    if (loading) {
      return (
        <>
          <View style={styles.loadingContainer}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.loadingItem}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ))}
          </View>
          <View style={styles.loadingContainer}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.loadingItem}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ))}
          </View>
        </>
      );
    }

    if (products.length === 0) {
      return null;
    }

    const rows = [];
    for (let i = 0; i < products.length; i += 4) {
      rows.push(
        <View key={i} style={styles.row}>
          {products.slice(i, i + 4).map((product, idx) => renderProduct(product, i + idx))}
        </View>
      );
    }
    return rows;
  };

  return <View style={styles.container}>{renderRows()}</View>;
};

export default CompactProductGrid;
