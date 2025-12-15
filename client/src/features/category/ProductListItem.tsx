import React, {FC, useState} from 'react';
import {View, StyleSheet, Image, TouchableOpacity, Pressable} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import UniversalAdd from '@components/ui/UniversalAdd';
import {IProduct} from '../../types/product/IProduct';
import {useTheme} from '@hooks/useTheme';
import {navigate} from '@utils/NavigationUtils';
import {useFavoritesStore} from '@state/favoritesStore';
import {useCompareStore} from '@state/compareStore';
import {shareProduct} from '@utils/shareUtils';
import {useToast} from '@hooks/useToast';

interface ProductListItemProps {
  item: IProduct;
}

const ProductListItem: FC<ProductListItemProps> = ({item}) => {
  const {colors} = useTheme();
  const {showSuccess} = useToast();
  const {isFavorite, toggleFavorite} = useFavoritesStore();
  const {isInCompare, addItem, canAddMore, removeItem} = useCompareStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '';
  const itemId = item.id || (item as any)._id;
  const favorite = isFavorite(itemId);
  const inCompare = isInCompare(itemId);

  const handleFavorite = () => {
    toggleFavorite(itemId);
    showSuccess(favorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleCompare = () => {
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

  const handleShare = async () => {
    await shareProduct(item.name, itemId);
  };

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <TouchableOpacity
        style={[styles.actionButton, styles.favoriteButton]}
        onPress={handleFavorite}
        activeOpacity={0.7}>
        <Icon
          name={favorite ? 'heart' : 'heart-outline'}
          color="#fff"
          size={RFValue(20)}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.compareButton]}
        onPress={handleCompare}
        activeOpacity={0.7}>
        <Icon
          name={inCompare ? 'git-compare' : 'git-compare-outline'}
          color="#fff"
          size={RFValue(20)}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.shareButton]}
        onPress={handleShare}
        activeOpacity={0.7}>
        <Icon name="share-outline" color="#fff" size={RFValue(20)} />
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      marginHorizontal: 10,
      marginVertical: 6,
      borderRadius: 12,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    imageContainer: {
      width: 100,
      height: 100,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
      resizeMode: 'cover',
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: RFValue(14),
      marginBottom: 4,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    price: {
      fontSize: RFValue(16),
      marginRight: 8,
    },
    originalPrice: {
      fontSize: RFValue(12),
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 10,
    },
    actionButton: {
      width: 60,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    favoriteButton: {
      backgroundColor: '#ff3040',
    },
    compareButton: {
      backgroundColor: Colors.secondary,
    },
    shareButton: {
      backgroundColor: '#4A90E2',
    },
    menuButton: {
      padding: 4,
    },
  });

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Pressable
        style={styles.container}
        onPress={() => navigate('ProductDetail', {productId: itemId})}
        onLongPress={() => setIsMenuOpen(true)}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.image} />
          ) : (
            <Icon name="image-outline" size={RFValue(40)} color={colors.disabled} />
          )}
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <CustomText
                fontFamily={Fonts.SemiBold}
                variant="h6"
                style={styles.title}
                numberOfLines={2}>
                {item.name}
              </CustomText>
              {item.dealer && (
                <CustomText
                  fontSize={RFValue(10)}
                  fontFamily={Fonts.Regular}
                  style={{color: colors.disabled, marginTop: 2}}>
                  {item.dealer.businessName}
                </CustomText>
              )}
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleFavorite}
              activeOpacity={0.7}>
              <Icon
                name={favorite ? 'heart' : 'heart-outline'}
                color={favorite ? '#ff3040' : colors.text}
                size={RFValue(20)}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.priceContainer}>
            <CustomText fontFamily={Fonts.Bold} variant="h6" style={styles.price}>
              ₹{item.price?.toLocaleString()}
            </CustomText>
            {item.originalPrice && item.originalPrice > item.price && (
              <CustomText
                fontFamily={Fonts.Regular}
                variant="h8"
                style={styles.originalPrice}>
                ₹{item.originalPrice.toLocaleString()}
              </CustomText>
            )}
          </View>
          <View style={styles.actions}>
            <UniversalAdd item={item} />
            <TouchableOpacity
              onPress={handleCompare}
              activeOpacity={0.7}
              style={{padding: 4}}>
              <Icon
                name={inCompare ? 'git-compare' : 'git-compare-outline'}
                color={inCompare ? Colors.secondary : colors.text}
                size={RFValue(20)}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
};

export default ProductListItem;

