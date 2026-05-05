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
      width: '46%',
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      marginBottom: 16,
      marginLeft: '2.5%',
      borderWidth: 1,
      borderColor: colors.border + '50',
      overflow: 'hidden',
    },
    imageContainer: {
      height: screenHeight * 0.15,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      position: 'relative',
    },
    actionButtons: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'column',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    image: {
      height: '100%',
      width: '100%',
      resizeMode: 'contain',
    },
    placeholderImage: {
      height: '100%',
      width: '100%',
      backgroundColor: '#f4f4f4',
    },
    content: {
      padding: 12,
    },
    dealerBadge: {
      marginBottom: 4,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    priceInfo: {
      flex: 1,
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
              color={favorite ? '#ff3040' : colors.text}
              size={RFValue(16)}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCompare}
            activeOpacity={0.8}>
            <Icon
              name={inCompare ? 'git-compare' : 'git-compare-outline'}
              color={inCompare ? Colors.secondary : colors.text}
              size={RFValue(16)}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {item.dealer && (
          <TouchableOpacity
            style={styles.dealerBadge}
            onPress={handleDealerPress}
            activeOpacity={0.7}>
            <CustomText 
              fontSize={RFValue(9)} 
              fontFamily={Fonts.Medium}
              style={{color: Colors.secondary}}>
              {item.dealer.businessName}
            </CustomText>
          </TouchableOpacity>
        )}

        <CustomText
          fontFamily={Fonts.SemiBold}
          variant="h8"
          numberOfLines={2}
          style={{marginBottom: 4, height: RFValue(32)}}>
          {item.name}
        </CustomText>

        <View style={styles.priceContainer}>
          <View style={styles.priceInfo}>
            <CustomText variant="h7" fontFamily={Fonts.Bold}>
              ₹{item.price?.toLocaleString()}
            </CustomText>
            {item.originalPrice && item.originalPrice > item.price && (
              <CustomText
                fontFamily={Fonts.Medium}
                fontSize={RFValue(9)}
                style={{opacity: 0.6, textDecorationLine: 'line-through'}}>
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
