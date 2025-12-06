import {View, Text, StyleSheet, Image} from 'react-native';
import React, {FC} from 'react';
import {screenHeight} from '@utils/Scaling';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import UniversalAdd from '@components/ui/UniversalAdd';
import {IProduct} from '../../types/product/IProduct';
import {useTheme} from '@hooks/useTheme';

interface ProductItemProps {
  item: IProduct;
  index: number;
}

const ProductItem: FC<ProductItemProps> = ({index, item}) => {
  const {colors} = useTheme();
  const isSecondColumn = index % 2 !== 0;
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '';

  const styles = StyleSheet.create({
    container: {
      width: '45%',
      borderRadius: 10,
      backgroundColor: colors.cardBackground,
      marginBottom: 10,
      marginLeft: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    imageContainer: {
      height: screenHeight * 0.12,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      overflow: 'hidden',
    },
    image: {
      height: '100%',
      width: '100%',
      aspectRatio: 1 / 1,
      resizeMode: 'contain',
    },
    placeholderImage: {
      height: '100%',
      width: '100%',
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 12,
    },
    dealerBadge: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: 4,
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      marginTop: 'auto',
    },
  });

  return (
    <View style={[styles.container, {marginRight: isSecondColumn ? 10 : 0}]}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
      </View>

      <View style={styles.content}>
        {item.dealer && (
          <View style={styles.dealerBadge}>
            <CustomText fontSize={RFValue(6)} fontFamily={Fonts.Medium}>
              {item.dealer.businessName}
            </CustomText>
          </View>
        )}

        <CustomText
          fontFamily={Fonts.Medium}
          variant="h8"
          numberOfLines={2}
          style={{marginVertical: 4}}>
          {item.name}
        </CustomText>

        <View style={styles.priceContainer}>
          <View>
            <CustomText variant="h8" fontFamily={Fonts.Medium}>
              ₹{item.price?.toLocaleString()}
            </CustomText>
            {item.originalPrice && item.originalPrice > item.price && (
              <CustomText
                fontFamily={Fonts.Medium}
                variant="h8"
                style={{opacity: 0.8, textDecorationLine: 'line-through'}}>
                ₹{item.originalPrice.toLocaleString()}
              </CustomText>
            )}
          </View>

          <UniversalAdd item={item} />
        </View>
      </View>
    </View>
  );
};

export default ProductItem;
