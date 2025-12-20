import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { getProducts } from '@service/productService';
import { IProduct } from '@types/product/IProduct';

interface ProductsSectionProps {
    title: string;
    query?: {
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        category?: string;
    };
    backgroundColor?: string;
    showViewAll?: boolean;
    onViewAllPress?: () => void;
}

const ProductsSection: FC<ProductsSectionProps> = ({ 
    title, 
    query = { limit: 3, sortBy: 'createdAt', sortOrder: 'desc' },
    backgroundColor,
    showViewAll = true,
    onViewAllPress
}) => {
    const { colors } = useTheme();
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await getProducts(query);
                
                if (response?.success && response?.Response?.products) {
                    setProducts(response.Response.products.slice(0, query.limit || 3));
                }
            } catch (error) {
                console.error(`Error fetching products for ${title}:`, error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [title, query]);

    const styles = StyleSheet.create({
        container: {
            paddingTop: 20,
            paddingBottom: 20,
            paddingHorizontal: 20,
            marginTop: 10,
            position: 'relative',
            backgroundColor: backgroundColor || colors.background,
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
    });

    const calculateDiscount = (price: number, discountPrice: number) => {
        return Math.round(((discountPrice - price) / discountPrice) * 100);
    };

    const titleColor = backgroundColor ? colors.white : colors.text;
    const viewAllColor = backgroundColor ? colors.white : colors.text;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={{ color: titleColor }}>
                    {title}
                </CustomText>
                {showViewAll && (
                    <View>
                        <CustomText
                            variant="h8"
                            fontFamily={Fonts.Medium}
                            style={{ color: viewAllColor }}
                            onPress={onViewAllPress}>
                            View All →
                        </CustomText>
                    </View>
                )}
            </View>

            <View style={styles.cardsContainer}>
                {loading ? (
                    Array.from({ length: query.limit || 3 }).map((_, index) => (
                        <View key={index} style={styles.productCard}>
                            <ActivityIndicator size="small" color={colors.winterBlueDark} />
                        </View>
                    ))
                ) : products.length > 0 ? (
                    products.map((product: IProduct) => {
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
                ) : (
                    <View style={styles.productCard}>
                        <CustomText style={[styles.productName, { textAlign: 'center' }]}>
                            No products available
                        </CustomText>
                    </View>
                )}
            </View>
        </View>
    );
};

export default ProductsSection;
