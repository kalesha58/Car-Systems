import {View, Text, StyleSheet, Image, TouchableOpacity, Pressable} from 'react-native';
import React, {FC} from 'react';
import {screenHeight} from '@utils/Scaling';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import UniversalAdd from '@components/ui/UniversalAdd';
import Icon from 'react-native-vector-icons/Ionicons';
import {IProduct} from '../../types/product/IProduct';
import {useTheme} from '@hooks/useTheme';
import {navigate} from '@utils/NavigationUtils';
import {useFavoritesStore} from '@state/favoritesStore';
import {useCompareStore} from '@state/compareStore';
import {useToast} from '@hooks/useToast';

interface ProductItemProps {
  item: IProduct;
  index: number;
}

const ProductItem: FC<ProductItemProps> = ({index, item}) => {
  const {colors} = useTheme();
  const {showSuccess} = useToast();
  const {isFavorite, toggleFavorite} = useFavoritesStore();
  const {isInCompare, addItem, canAddMore, removeItem} = useCompareStore();
  const isSecondColumn = index % 2 !== 0;
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '';
  const itemId = item.id || (item as any)._id;
  const favorite = isFavorite(itemId);
  const inCompare = isInCompare(itemId);

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    toggleFavorite(itemId);
    showSuccess(favorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleCompare = (e: any) => {
    e.stopPropagation();
    if (inCompare) {
      removeItem(itemId);
      showSuccess('Removed from compare');
    } else if (canAddMore()) {
      addItem({
        id: itemId,
        name: item.name,
        price: item.price,
        image: imageUrl,
        type: 'product',
      });
      showSuccess('Added to compare');
    } else {
      showSuccess('Maximum 3 items can be compared');
    }
  };

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
      position: 'relative',
    },
    imageContainer: {
      height: screenHeight * 0.12,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#f4f4f4',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    },
    actionButtons: {
      position: 'absolute',
      top: 6,
      right: 6,
      flexDirection: 'row',
      gap: 6,
    },
    actionButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
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
      backgroundColor: '#f4f4f4',
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

  const handleProductPress = () => {
    navigate('ProductDetail', {productId: item.id});
  };

  const handleDealerPress = (e: any) => {
    e.stopPropagation();
    if (item.dealerId) {
      navigate('Category', {
        screen: 'ProductCategories',
        params: {
          dealerId: item.dealerId,
          initialCategoryType: 'products',
        },
      });
    }
  };

  return (
    <Pressable
      style={[styles.container, {marginRight: isSecondColumn ? 10 : 0}]}
      onPress={handleProductPress}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFavorite}
            activeOpacity={0.8}>
            <Icon
              name={favorite ? 'heart' : 'heart-outline'}
              color={favorite ? '#ff3040' : '#fff'}
              size={RFValue(14)}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCompare}
            activeOpacity={0.8}>
            <Icon
              name={inCompare ? 'git-compare' : 'git-compare-outline'}
              color={inCompare ? Colors.secondary : '#fff'}
              size={RFValue(14)}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {item.dealer && (
          <Pressable
            style={styles.dealerBadge}
            onPress={handleDealerPress}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <CustomText fontSize={RFValue(6)} fontFamily={Fonts.Medium}>
              {item.dealer.businessName}
            </CustomText>
          </Pressable>
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

          <Pressable onPress={(e) => {
            e.stopPropagation();
          }}>
            <UniversalAdd item={item} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export default ProductItem;
