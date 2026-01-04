import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { getProducts } from '@service/productService';
import { IProduct } from '../../types/product/IProduct';
import LottieView from 'lottie-react-native';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';
import { navigate } from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCartStore } from '@state/cartStore';

const TopProductsSection: FC = () => {
    const seasonalTheme = useSeasonalTheme();
    const { colors } = useTheme();
    const [topProducts, setTopProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { addItem } = useCartStore();

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true);
                // Fetch first 3 products from API
                const response = await getProducts({
                    limit: 3
                });

                if (response?.success && response?.Response?.products) {
                    // Get first 3 products from response
                    setTopProducts(response.Response.products.slice(0, 3));
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

    const handleAddToCart = (product: IProduct) => {
        addItem(product);
    };

    const styles = StyleSheet.create({
        container: {
            paddingTop: 20,
            paddingBottom: 20,
            paddingHorizontal: 20,
            marginTop: -5,
            position: 'relative',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
        },
        cardsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        productCard: {
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: 8,
            padding: 8,
            // Shadow
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#e0e0e0',
        },
        productImage: {
            width: '100%',
            height: 100,
            borderRadius: 4,
            marginBottom: 8,
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
        },
        productName: {
            fontSize: RFValue(10),
            fontFamily: Fonts.Medium,
            color: colors.text,
            marginBottom: 4,
            height: 30, // Fixed height for 2 lines
            lineHeight: 15,
        },
        priceContainer: {
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 4,
            marginBottom: 8,
            flexWrap: 'wrap',
        },
        price: {
            fontSize: RFValue(12),
            fontFamily: Fonts.Bold,
            color: '#B12704',
        },
        discountPrice: {
            fontSize: RFValue(9),
            fontFamily: Fonts.Regular,
            color: '#565959',
            textDecorationLine: 'line-through',
        },
        discountBadge: {
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            backgroundColor: '#FF3B30',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
        },
        discountText: {
            fontSize: RFValue(8),
            fontFamily: Fonts.Bold,
            color: colors.white,
        },
        trainContainer: {
            width: '100%',
            height: 100,
            position: 'absolute',
            top: -50,
            zIndex: 10,
        },
        trainAnimation: {
            width: '100%',
            height: '100%',
        },
        addButton: {
            backgroundColor: '#FFD814', // Amazon-like add to cart button color
            paddingVertical: 6,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0,
        },
        addButtonText: {
            color: '#0F1111',
            fontSize: RFValue(9),
            fontFamily: Fonts.Medium,
        },
    });

    const calculateDiscount = (price: number, discountPrice: number) => {
        return Math.round(((discountPrice - price) / discountPrice) * 100);
    };

    return (
        <View style={[styles.container, { backgroundColor: seasonalTheme.colors.primary }]}>
            {/* Overlay animation (train, sleigh, etc.) above Top Picks - if available */}
            {seasonalTheme.animations.overlay && (
                <View style={styles.trainContainer}>
                    <LottieView
                        autoPlay
                        loop
                        speed={1}
                        style={styles.trainAnimation}
                        source={seasonalTheme.animations.overlay}
                    />
                </View>
            )}

            <View style={styles.header}>
                <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{ color: colors.white }}>
                    Top Picks
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
                        style={{ color: colors.white }}>
                        View All →
                    </CustomText>
                </TouchableOpacity>
            </View>

            <View style={styles.cardsContainer}>
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <View key={index} style={[styles.productCard, { height: 200 }]}>
                            <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 50 }} />
                        </View>
                    ))
                ) : topProducts.length > 0 ? (
                    topProducts.map((product: IProduct) => {
                        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
                        const originalPrice = product.originalPrice || product.price;
                        const hasDiscount = originalPrice > product.price;

                        return (
                            <TouchableOpacity
                                key={product.id}
                                style={styles.productCard}
                                onPress={() => handleProductPress(product)}
                                activeOpacity={0.9}
                            >
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.productImage}
                                    />
                                ) : (
                                    <View style={[styles.productImage, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Icon name="image-outline" size={30} color={colors.disabled} />
                                    </View>
                                )}

                                {hasDiscount && (
                                    <View style={styles.discountBadge}>
                                        <CustomText style={styles.discountText}>
                                            {calculateDiscount(product.price, originalPrice)}% off
                                        </CustomText>
                                    </View>
                                )}

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

                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => handleAddToCart(product)}
                                    activeOpacity={0.7}>
                                    <CustomText style={styles.addButtonText}>Add to Cart</CustomText>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={{ padding: 20, alignItems: 'center', width: '100%' }}>
                        <CustomText style={{ color: '#fff' }}>No top products found.</CustomText>
                    </View>
                )}
            </View>
        </View>
    );
};

export default TopProductsSection;
