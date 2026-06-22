import {View, StyleSheet, Image, TouchableOpacity, Dimensions} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {navigate} from '@utils/NavigationUtils';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@hooks/useTheme';

interface CartSummaryProps {
  cartCount: number;
  cartImage: string;
}

const CartSummary: FC<CartSummaryProps> = ({cartCount, cartImage}) => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  
  // Responsive calculations
  const windowWidth = Dimensions.get('window').width;
  const isTablet = windowWidth >= 768;
  const isDesktop = windowWidth >= 1024;
  const isSmallMobile = windowWidth < 360;
  
  // Responsive values
  const getResponsiveValue = (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };

  const containerPadding = getResponsiveValue(
    isSmallMobile ? 10 : 12,
    windowWidth * 0.03,
    Math.min(windowWidth * 0.03, 40)
  );
  
  const imageSize = getResponsiveValue(
    isSmallMobile ? 28 : 32,
    windowWidth * 0.07,
    Math.min(windowWidth * 0.05, 48)
  );
  
  // Reduced gap on mobile
  const gapSize = getResponsiveValue(
    isSmallMobile ? 6 : 8,
    windowWidth * 0.025,
    16
  );
  
  // Much smaller button padding on mobile
  const buttonPaddingH = getResponsiveValue(
    isSmallMobile ? 16 : 20,
    windowWidth * 0.08,
    Math.min(windowWidth * 0.06, 80)
  );
  
  const buttonPaddingV = getResponsiveValue(6, 8, 10);

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: containerPadding,
      paddingVertical: getResponsiveValue(8, 10, 12),
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      ...(isDesktop && {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      }),
    },
    flexRowGap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: gapSize,
      flex: 1,
      marginRight: getResponsiveValue(8, 12, 16),
      minWidth: 0, // Allow shrinking
    },
    image: {
      width: imageSize,
      height: imageSize,
      borderRadius: imageSize * 0.25,
      borderColor: Colors.border,
      borderWidth: 1,
    },
    cartText: {
      fontSize: RFValue(getResponsiveValue(12, 16, 18)),
      flexShrink: 1, // Allow text to shrink
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: buttonPaddingV,
      borderRadius: getResponsiveValue(8, windowWidth * 0.02, 12),
      backgroundColor: Colors.secondary,
      paddingHorizontal: buttonPaddingH,
      minWidth: getResponsiveValue(70, 120, 140), // Reduced min width on mobile
      flexShrink: 0, // Don't shrink button
    },
    btnText: {
      marginRight: getResponsiveValue(4, windowWidth * 0.015, 8),
      color: '#fff',
      fontSize: RFValue(getResponsiveValue(12, 16, 18)),
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.flexRowGap}>
        <Image
          source={
            cartImage === null
              ? require('@assets/icons/bucket.png')
              : {
                  uri: cartImage,
                }
          }
          style={styles.image}
        />
        <CustomText fontFamily={Fonts.SemiBold} style={styles.cartText}>
          {cartCount} ITEM{cartCount > 1 ? 'S' : ''}
        </CustomText>
        <Icon
          name="arrow-drop-up"
          color={Colors.secondary}
          size={RFValue(getResponsiveValue(20, 28, 32))}
        />
      </View>

      <TouchableOpacity
        style={styles.btn}
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to Cart tab in MainTabs
          try {
            (navigation as any).navigate('MainTabs', {
              screen: 'Cart',
            });
          } catch (error) {
            // Fallback: try using the navigate utility
            try {
              navigate('MainTabs', { screen: 'Cart' });
            } catch (err) {
              console.error('Navigation error:', err);
            }
          }
        }}>
        <CustomText style={styles.btnText} fontFamily={Fonts.Medium}>
          Next
        </CustomText>
        <Icon name="arrow-right" color="#fff" size={RFValue(getResponsiveValue(18, 28, 32))} />
      </TouchableOpacity>
    </View>
  );
};


export default CartSummary;
