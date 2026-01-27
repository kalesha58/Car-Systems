import {View, StyleSheet, Image, TouchableOpacity, Alert, Animated} from 'react-native';
import React, {FC, useRef, useState, useEffect} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Swipeable} from 'react-native-gesture-handler';
import {useCartStore} from '@state/cartStore';
import {useSavedForLaterStore} from '@state/savedForLaterStore';
import {useTheme} from '@hooks/useTheme';
import {IProduct} from '../../types/product/IProduct';

interface CartItem {
  _id: string | number;
  item: IProduct;
  count: number;
}

interface EnhancedOrderItemProps {
  item: CartItem;
  onRemove?: (item: CartItem) => void;
  onSaveForLater?: (item: CartItem) => void;
  maxStock?: number;
  showStockWarning?: boolean;
}

const EnhancedOrderItem: FC<EnhancedOrderItemProps> = ({
  item,
  onRemove,
  onSaveForLater,
  maxStock,
  showStockWarning = true,
}) => {
  const {colors} = useTheme();
  const productImage = item?.item?.images?.[0];
  const {addItem, removeItem, getItemCount} = useCartStore();
  const {saveItem, isSaved} = useSavedForLaterStore();
  const swipeableRef = useRef<Swipeable>(null);
  const [removed, setRemoved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Normalize item ID to handle both id and _id fields
  const itemId = item._id || item.item?.id || item.item?._id;
  const currentCount = getItemCount(itemId);
  const stock = maxStock ?? item.item?.stock ?? 999;
  const isLowStock = stock <= 5 && stock > 0;
  const isOutOfStock = stock === 0;
  const canIncrease = currentCount < stock;

  const handleIncrease = () => {
    if (canIncrease) {
      addItem(item.item);
    } else {
      Alert.alert('Stock Limit', `Only ${stock} items available in stock`);
    }
  };

  const handleDecrease = () => {
    if (currentCount > 0) {
      // If count is 1, item will be removed after this call
      const willBeRemoved = currentCount === 1;
      
      removeItem(itemId);
      
      // If item will be removed, show fade animation
      if (willBeRemoved) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setRemoved(true);
          onRemove?.(item);
          swipeableRef.current?.close();
        });
      }
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Item',
      `Remove ${item.item.name} from cart?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Remove item immediately
            const success = removeItem(itemId);
            if (success !== false) {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                setRemoved(true);
                onRemove?.(item);
                swipeableRef.current?.close();
              });
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleSaveForLater = () => {
    saveItem(item.item, currentCount);
    removeItem(itemId);
    onSaveForLater?.(item);
    swipeableRef.current?.close();
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderTopWidth: 0.6,
      borderTopColor: colors.border,
    },
    flexRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    imgContainer: {
      backgroundColor: colors.backgroundSecondary,
      padding: 10,
      borderRadius: 15,
      width: 70,
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    img: {
      width: 50,
      height: 50,
      borderRadius: 8,
    },
    placeholderImg: {
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    savedBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: colors.secondary,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    productInfo: {
      flex: 1,
      marginRight: 8,
    },
    stockWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    controlsContainer: {
      alignItems: 'flex-end',
      gap: 8,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 4,
      gap: 12,
      minWidth: 90,
      justifyContent: 'space-between',
    },
    quantityButton: {
      padding: 4,
      borderRadius: 4,
    },
    quantityButtonDisabled: {
      opacity: 0.4,
    },
    quantityText: {
      minWidth: 20,
      textAlign: 'center',
    },
    priceContainer: {
      alignItems: 'flex-end',
    },
    priceText: {
      color: colors.text,
    },
    unitPrice: {
      opacity: 0.6,
      marginTop: 2,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginVertical: 8,
      marginRight: 10,
    },
    actionButton: {
      width: 80,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      marginLeft: 8,
    },
    actionTouchable: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
    },
    actionText: {
      color: '#fff',
      marginTop: 4,
    },
  });

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View
          style={[
            styles.actionButton,
            {backgroundColor: colors.secondary},
            {transform: [{translateX}]},
          ]}>
          <TouchableOpacity
            style={styles.actionTouchable}
            onPress={handleSaveForLater}
            activeOpacity={0.7}>
            <IconIonicons name="bookmark-outline" size={RFValue(20)} color="#fff" />
            <CustomText
              fontSize={RFValue(10)}
              fontFamily={Fonts.Medium}
              style={styles.actionText}>
              Save
            </CustomText>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[
            styles.actionButton,
            {backgroundColor: colors.error || '#ff4444'},
            {transform: [{translateX}]},
          ]}>
          <TouchableOpacity
            style={styles.actionTouchable}
            onPress={handleRemove}
            activeOpacity={0.7}>
            <Icon name="delete-outline" size={RFValue(20)} color="#fff" />
            <CustomText
              fontSize={RFValue(10)}
              fontFamily={Fonts.Medium}
              style={styles.actionText}>
              Remove
            </CustomText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  if (removed) {
    return null;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}>
      <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
        <View style={styles.flexRow}>
          <View style={styles.imgContainer}>
            {productImage ? (
              <Image source={{uri: productImage}} style={styles.img} />
            ) : (
              <View style={[styles.img, styles.placeholderImg]}>
                <Icon name="image-off" size={RFValue(20)} color={colors.disabled} />
              </View>
            )}
            {isSaved(itemId) && (
              <View style={styles.savedBadge}>
                <IconIonicons name="bookmark" size={RFValue(12)} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.productInfo}>
              <CustomText numberOfLines={2} variant="h8" fontFamily={Fonts.Medium}>
                {item.item.name}
              </CustomText>
              {item.item.brand && (
                <CustomText variant="h9" style={{opacity: 0.6, marginTop: 2}}>
                  {item.item.brand}
                </CustomText>
              )}
              {showStockWarning && (
                <>
                  {isOutOfStock && (
                    <View style={styles.stockWarning}>
                      <Icon name="alert-circle" size={RFValue(12)} color={colors.error} />
                      <CustomText
                        variant="h9"
                        style={{color: colors.error, marginLeft: 4}}>
                        Out of stock
                      </CustomText>
                    </View>
                  )}
                  {isLowStock && !isOutOfStock && (
                    <View style={styles.stockWarning}>
                      <Icon name="alert" size={RFValue(12)} color="#ff9800" />
                      <CustomText variant="h9" style={{color: '#ff9800', marginLeft: 4}}>
                        Only {stock} left
                      </CustomText>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.controlsContainer}>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={handleDecrease}
                  disabled={currentCount === 0}>
                  <Icon
                    name="minus"
                    size={RFValue(14)}
                    color={currentCount === 0 ? colors.disabled : colors.text}
                  />
                </TouchableOpacity>
                <CustomText
                  fontFamily={Fonts.SemiBold}
                  variant="h8"
                  style={styles.quantityText}>
                  {currentCount}
                </CustomText>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    !canIncrease && styles.quantityButtonDisabled,
                  ]}
                  onPress={handleIncrease}
                  disabled={!canIncrease}>
                  <Icon
                    name="plus"
                    size={RFValue(14)}
                    color={!canIncrease ? colors.disabled : colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.priceContainer}>
                <CustomText
                  variant="h7"
                  fontFamily={Fonts.SemiBold}
                  style={styles.priceText}>
                  ₹{currentCount * (item.item.price || 0)}
                </CustomText>
                {currentCount > 1 && (
                  <CustomText variant="h9" style={styles.unitPrice}>
                    ₹{item.item.price || 0} each
                  </CustomText>
                )}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Swipeable>
  );
};

export default EnhancedOrderItem;

