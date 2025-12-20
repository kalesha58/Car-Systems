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

const TopProductsSection: FC = () => {
    const seasonalTheme = useSeasonalTheme();
    const { colors } = useTheme();
    const [topProducts, setTopProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

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
            backgroundColor: colors.iceBlue,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.winterBlueLight,
        },
        productImage: {
            width: '100%',
            height: 80,
            borderRadius: 8,
            marginBottom: 8,
        },
        productName: {
            fontSize: RFValue(10),
            fontFamily: Fonts.SemiBold,
            color: colors.text,
            marginBottom: 4,
        },
        priceContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        price: {
            fontSize: RFValue(11),
            fontFamily: Fonts.Bold,
            color: colors.winterBlueDark,
        },
        discountPrice: {
            fontSize: RFValue(9),
            fontFamily: Fonts.Regular,
            color: colors.disabled,
            textDecorationLine: 'line-through',
        },
        discountBadge: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: colors.winterBlue,
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
                        navigate('ProductCategories', {
                            initialCategoryId: 'all-products',
                            initialCategoryType: 'products',
                            sortBy: 'popularity',
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
                        <View key={index} style={styles.productCard}>
                            <ActivityIndicator size="small" color={colors.winterBlueDark} />
                        </View>
                    ))
                ) : topProducts.length > 0 ? (
                    topProducts.map((product: IProduct) => {
                        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
                        const originalPrice = product.originalPrice || product.price;
                        const hasDiscount = originalPrice > product.price;
                        
                        return (
                            <View
                                key={product.id}
                                style={styles.productCard}>
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.productImage}
                                    />
                                ) : (
                                    <View style={[styles.productImage, { backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' }]}>
                                        <CustomText style={{ fontSize: RFValue(8), color: colors.disabled }}>No Image</CustomText>
                                    </View>
                                )}

                                {hasDiscount && (
                                    <View style={styles.discountBadge}>
                                        <CustomText style={styles.discountText}>
                                            {calculateDiscount(product.price, originalPrice)}% OFF
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
                                        ₹{product.price}
                                    </CustomText>
                                    {hasDiscount && (
                                        <CustomText style={styles.discountPrice}>
                                            ₹{originalPrice}
                                        </CustomText>
                                    )}
                                </View>
                            </View>
                        );
                    })
                ) : null}
            </View>
        </View>
    );
};

export default TopProductsSection;
