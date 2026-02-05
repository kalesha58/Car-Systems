import React from 'react';
import { View, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import { goBack } from '@utils/NavigationUtils';
import { useTheme } from '@hooks/useTheme';
import { useCollapsibleContext } from '@r0b0t3d/react-native-collapsible';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shareProduct } from '@utils/shareUtils';
import { useToast } from '@hooks/useToast';

interface IAnimatedProductHeaderProps {
  productName: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  productId?: string;
  isWishlisted: boolean;
  onWishlistPress: () => void;
}

const AnimatedProductHeader: React.FC<IAnimatedProductHeaderProps> = ({
  productName,
  price,
  originalPrice,
  imageUrl,
  productId,
  isWishlisted,
  onWishlistPress,
}) => {
  const { colors } = useTheme();
  const { scrollY } = useCollapsibleContext();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();

  const handleShare = async () => {
    if (!productId) {
      showError('Product ID not available');
      return;
    }
    try {
      const shared = await shareProduct(productName, productId);
      if (shared) {
        showSuccess('Product shared successfully');
      }
    } catch (error) {
      showError('Failed to share product');
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [-200, 0], // Move further off-screen
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const backgroundColorAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const rgb = colors.cardBackground === '#ffffff'
      ? { r: 255, g: 255, b: 255 }
      : { r: 30, g: 30, b: 30 };
    return {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    };
  });

  const truncatedName =
    productName.length > 30 ? `${productName.substring(0, 30)}...` : productName;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      zIndex: 100,
    },
    backButton: {
      marginRight: 12,
      padding: 6,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbnail: {
      width: 40,
      height: 40,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      flex: 1,
    },
    productName: {
      fontSize: RFValue(12),
      marginBottom: 2,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    price: {
      fontSize: RFValue(12),
      color: colors.secondary,
    },
    originalPrice: {
      fontSize: RFValue(10),
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    rightIcons: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
    },
  });

  return (
    <Animated.View style={[styles.container, headerAnimatedStyle, backgroundColorAnimatedStyle]}>
      <Pressable onPress={() => goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={RFValue(20)} color={colors.text} />
      </Pressable>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Medium}
          numberOfLines={1}
          style={styles.productName}>
          {truncatedName}
        </CustomText>
        <View style={styles.priceContainer}>
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={styles.price}>
            ₹{price.toLocaleString()}
          </CustomText>
          {originalPrice && originalPrice > price && (
            <CustomText
              variant="h8"
              fontFamily={Fonts.Medium}
              style={styles.originalPrice}>
              ₹{originalPrice.toLocaleString()}
            </CustomText>
          )}
        </View>
      </View>
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Icon name="share-outline" size={RFValue(18)} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onWishlistPress}>
          <Icon name={isWishlisted ? 'heart' : 'heart-outline'} size={RFValue(18)} color={isWishlisted ? colors.error : colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default AnimatedProductHeader;
