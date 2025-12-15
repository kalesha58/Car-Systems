import React, {FC} from 'react';
import {View, StyleSheet, Image, TouchableOpacity, Pressable, Alert} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {IService} from '../../types/service/IService';
import {useTheme} from '@hooks/useTheme';
import {navigate} from '@utils/NavigationUtils';
import {useFavoritesStore} from '@state/favoritesStore';
import {useCompareStore} from '@state/compareStore';
import {shareProduct} from '@utils/shareUtils';
import {useToast} from '@hooks/useToast';

interface ServiceListItemProps {
  item: IService;
}

const ServiceListItem: FC<ServiceListItemProps> = ({item}) => {
  const {colors} = useTheme();
  const {showSuccess} = useToast();
  const {isFavorite, toggleFavorite} = useFavoritesStore();
  const {isInCompare, addItem, canAddMore, removeItem} = useCompareStore();
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '';
  const itemId = item.id || (item as any)._id;
  const itemName = 'name' in item ? item.name : 'Service';
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
        name: itemName,
        price: item.price,
        image: imageUrl,
        type: 'service',
      });
      showSuccess('Added to compare');
    } else {
      showSuccess('Maximum 3 items can be compared');
    }
  };

  const handleShare = async () => {
    await shareProduct(itemName, itemId);
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
    details: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 4,
      gap: 8,
    },
    detailText: {
      fontSize: RFValue(10),
      color: colors.disabled,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    price: {
      fontSize: RFValue(16),
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
  });

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Pressable
        style={styles.container}
        onPress={() => {
          try {
            navigate('ProductDetail', {productId: itemId});
          } catch {
            Alert.alert('Service Details', 'Service detail screen coming soon');
          }
        }}
        onLongPress={() => {}}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.image} />
          ) : (
            <Icon name="construct-outline" size={RFValue(40)} color={colors.disabled} />
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
                {itemName}
              </CustomText>
              <View style={styles.details}>
                <CustomText
                  fontSize={RFValue(10)}
                  fontFamily={Fonts.Regular}
                  style={styles.detailText}>
                  {item.serviceType} • {item.durationMinutes} min
                  {item.homeService ? ' • Home Service' : ' • Shop Service'}
                </CustomText>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleFavorite}
              activeOpacity={0.7}
              style={{padding: 4}}>
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
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => {
                try {
                  navigate('ProductDetail', {productId: itemId});
                } catch {
                  Alert.alert('Service Details', 'Service detail screen coming soon');
                }
              }}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: Colors.secondary,
              }}>
              <CustomText
                fontSize={RFValue(12)}
                fontFamily={Fonts.SemiBold}
                style={{color: '#fff'}}>
                View Details
              </CustomText>
            </TouchableOpacity>
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

export default ServiceListItem;

