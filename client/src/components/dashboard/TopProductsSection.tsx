import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { getProducts } from '@service/productService';
import { IProduct } from '../../types/product/IProduct';
import { navigate } from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/Ionicons';

const TopProductsSection: FC = () => {
    const { colors } = useTheme();
    const [topProducts, setTopProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true);
                // Fetch first 4 products from API for 2x2 grid
                const response = await getProducts({
                    limit: 4
                });

                if (response?.success && response?.Response?.products) {
                    // Get first 4 products from response
                    setTopProducts(response.Response.products.slice(0, 4));
                }
            } catch (error) {
                console.error('Error fetching top products:', error);
                setTopProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();
    }, []);

    const handleProductPress = (product: IProduct) => {
        navigate('ProductDetail', { productId: product.id });
    };

    const styles = StyleSheet.create({
        container: {
            paddingTop: 12,
            paddingBottom: 12,
            paddingHorizontal: 15,
            marginTop: -5,
            position: 'relative',
            backgroundColor: colors.backgroundSecondary,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        productCard: {
            width: '48%',
            backgroundColor: colors.cardBackground,
            borderRadius: 6,
            padding: 0,
            marginBottom: 8,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            position: 'relative',
        },
        imageContainer: {
            width: '100%',
            height: 80,
            backgroundColor: colors.backgroundSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
        },
        productImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
        },
        productInfo: {
            padding: 6,
        },
        productName: {
            fontSize: RFValue(9),
            fontFamily: Fonts.Medium,
            color: colors.text,
            marginBottom: 4,
            minHeight: 28,
            lineHeight: 14,
        },
        priceContainer: {
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 4,
            marginBottom: 4,
            flexWrap: 'wrap',
        },
        price: {
            fontSize: RFValue(11),
            fontFamily: Fonts.Bold,
            color: colors.secondary,
        },
        discountPrice: {
            fontSize: RFValue(8),
            fontFamily: Fonts.Regular,
            color: colors.disabled,
            textDecorationLine: 'line-through',
        },
        discountBadge: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.secondary,
            paddingVertical: 3,
            paddingHorizontal: 6,
            alignItems: 'center',
            justifyContent: 'center',
        },
        discountText: {
            fontSize: RFValue(8),
            fontFamily: Fonts.Bold,
            color: colors.white,
        },
    });

    const calculateDiscount = (price: number, discountPrice: number) => {
        return Math.round(((discountPrice - price) / discountPrice) * 100);
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={{ color: colors.text }}>
                    Continue shopping deals
                </CustomText>
                <TouchableOpacity
                    onPress={() => {
                        navigate('Category', {
                            screen: 'ProductCategories',
                            params: {
                                initialCategoryId: 'all-products',
                                initialCategoryType: 'products',
                                sortBy: 'popularity'
                            }
                        });
                    }}
                    activeOpacity={0.7}>
                    <CustomText
                        variant="h8"
                        fontFamily={Fonts.Medium}
                        style={{ color: colors.secondary }}>
                        View All →
                    </CustomText>
                </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <View key={index} style={[styles.productCard, { height: 140 }]}>
                            <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 40 }} />
                        </View>
                    ))
                ) : topProducts.length > 0 ? (
                    topProducts.map((product: IProduct) => {
                        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
                        const originalPrice = product.originalPrice || product.price;
                        const hasDiscount = originalPrice > product.price;
                        const discountPercent = hasDiscount ? calculateDiscount(product.price, originalPrice) : 0;

                        return (
                            <TouchableOpacity
                                key={product.id}
                                style={styles.productCard}
                                onPress={() => handleProductPress(product)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.imageContainer}>
                                    {imageUrl ? (
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={styles.productImage}
                                        />
                                    ) : (
                                        <Icon name="image-outline" size={40} color={colors.disabled} />
                                    )}
                                </View>

                                <View style={styles.productInfo}>
                                    <CustomText
                                        style={styles.productName}
                                        numberOfLines={2}>
                                        {product.name}
                                    </CustomText>

                                    <View style={styles.priceContainer}>
                                        <CustomText style={styles.price}>
                                            ₹{product.price.toLocaleString()}
                                        </CustomText>
                                        {hasDiscount && (
                                            <CustomText style={styles.discountPrice}>
                                                ₹{originalPrice.toLocaleString()}
                                            </CustomText>
                                        )}
                                    </View>
                                </View>

                                {hasDiscount && (
                                    <View style={styles.discountBadge}>
                                        <CustomText style={styles.discountText}>
                                            {discountPercent}% off
                                        </CustomText>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={{ padding: 20, alignItems: 'center', width: '100%' }}>
                        <CustomText style={{ color: colors.text }}>No products found.</CustomText>
                    </View>
                )}
            </View>
        </View>
    );
};

export default TopProductsSection;
