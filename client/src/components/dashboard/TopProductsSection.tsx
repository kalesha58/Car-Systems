import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { productsList } from '@utils/dummyData';
import LottieView from 'lottie-react-native';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';
import { navigate } from '@utils/NavigationUtils';

const TopProductsSection: FC = () => {
    const seasonalTheme = useSeasonalTheme();
    const { colors } = useTheme();

    // Get top 3 products
    const topProducts = productsList.slice(0, 3);

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
                <TouchableOpacity onPress={() => navigate('Category')}>
                    <CustomText
                        variant="h8"
                        fontFamily={Fonts.Medium}
                        style={{ color: colors.white }}>
                        View All →
                    </CustomText>
                </TouchableOpacity>
            </View>

            <View style={styles.cardsContainer}>
                {topProducts.map((product: { id: number; name: string; image: string; price: number; discountPrice: number; quantity: string }) => (
                    <TouchableOpacity
                        key={product.id}
                        style={styles.productCard}
                        activeOpacity={0.7}>
                        <Image
                            source={{ uri: product.image }}
                            style={styles.productImage}
                        />

                        {product.discountPrice > product.price && (
                            <View style={styles.discountBadge}>
                                <CustomText style={styles.discountText}>
                                    {calculateDiscount(product.price, product.discountPrice)}% OFF
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
                            {product.discountPrice > product.price && (
                                <CustomText style={styles.discountPrice}>
                                    ₹{product.discountPrice}
                                </CustomText>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default TopProductsSection;
