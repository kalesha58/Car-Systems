import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import React, { FC, useMemo } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts, Colors } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { IProduct } from '../../types/product/IProduct';
import { IDealerVehicle } from '../../types/vehicle/IVehicle';
import { IService } from '../../types/service/IService';

interface DealerInventorySectionProps {
  products: IProduct[];
  vehicles: IDealerVehicle[];
  services: IService[];
}

const DealerInventorySection: FC<DealerInventorySectionProps> = ({ products, vehicles, services }) => {
  const seasonalTheme = useSeasonalTheme();
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Combine all items and take top items (products first, then vehicles, then services)
  const allItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      image: string;
      price: number;
      originalPrice?: number;
      discountPercentage?: number;
      type: 'product' | 'vehicle' | 'service';
    }> = [];

    // Add products only (max 3)
    products.slice(0, 3).forEach((product) => {
      items.push({
        id: product.id || (product as any)._id,
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: product.discountPercentage,
        type: 'product',
      });
    });

    return items; // Return up to 3 products
  }, [products, vehicles, services]);

  const calculateDiscount = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  const handleItemPress = (item: typeof allItems[0]) => {
    if (item.type === 'product') {
      (navigation as any).navigate('ProductDetail', { productId: item.id });
    } else if (item.type === 'vehicle') {
      // Navigate to vehicle detail if route exists
      // (navigation as any).navigate('VehicleDetail', { vehicleId: item.id });
    } else if (item.type === 'service') {
      // Navigate to service detail if route exists
      // (navigation as any).navigate('ServiceDetail', { serviceId: item.id });
    }
  };

  const handleViewAll = () => {
    (navigation as any).navigate('DealerTabs', { screen: 'Inventory' });
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
      gap: 12,
      paddingRight: 20,
    },
    productCard: {
      width: 140,
      backgroundColor: (colors as any).iceBlue || colors.cardBackground,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: (colors as any).winterBlueLight || colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      position: 'relative',
    },
    productImage: {
      width: '100%',
      height: 80,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.backgroundSecondary,
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
      flexWrap: 'wrap',
    },
    price: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Bold,
      color: (colors as any).winterBlueDark || colors.secondary,
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
      backgroundColor: (colors as any).winterBlue || Colors.secondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      zIndex: 10,
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
    placeholderImage: {
      width: '100%',
      height: 80,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (allItems.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: seasonalTheme.colors.primary }]}>
      {/* Overlay animation (train, sleigh, etc.) above All Inventory - if available */}
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
          All Inventory
        </CustomText>
        <TouchableOpacity onPress={handleViewAll}>
          <CustomText variant="h8" fontFamily={Fonts.Medium} style={{ color: colors.white }}>
            View All →
          </CustomText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}>
        {allItems.map((item) => {
          const discountPercent = calculateDiscount(item.price, item.originalPrice);
          const hasDiscount = discountPercent > 0;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.productCard}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderImage}>
                  <CustomText style={{ color: colors.textSecondary, fontSize: RFValue(20) }}>
                    {item.type === 'product' ? '📦' : item.type === 'vehicle' ? '🚗' : '🔧'}
                  </CustomText>
                </View>
              )}

              {hasDiscount && (
                <View style={styles.discountBadge}>
                  <CustomText style={styles.discountText}>{discountPercent}% OFF</CustomText>
                </View>
              )}

              <CustomText style={styles.productName} numberOfLines={2}>
                {item.name}
              </CustomText>

              <View style={styles.priceContainer}>
                <CustomText style={styles.price}>₹{item.price}</CustomText>
                {hasDiscount && item.originalPrice && (
                  <CustomText style={styles.discountPrice}>₹{item.originalPrice}</CustomText>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default DealerInventorySection;
