import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';

interface InventoryItemSkeletonProps {
  type?: 'product' | 'vehicle' | 'service';
}

const InventoryItemSkeleton: FC<InventoryItemSkeletonProps> = ({type = 'product'}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    productCard: {
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      flexDirection: 'row',
      padding: 12,
      gap: 12,
      backgroundColor: colors.cardBackground,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    productInfo: {
      flex: 1,
      justifyContent: 'space-between',
      gap: 8,
      minWidth: 0,
    },
    productHeader: {
      marginBottom: 0,
    },
    productName: {
      height: RFValue(16),
      marginBottom: 4,
      borderRadius: 4,
    },
    brandText: {
      height: RFValue(12),
      width: '60%',
      borderRadius: 4,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 0,
    },
    price: {
      height: RFValue(18),
      width: 80,
      borderRadius: 4,
    },
    originalPrice: {
      height: RFValue(12),
      width: 60,
      borderRadius: 4,
    },
    discountBadge: {
      height: RFValue(16),
      width: 40,
      borderRadius: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 0,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaIcon: {
      width: RFValue(12),
      height: RFValue(12),
      borderRadius: 2,
    },
    metaText: {
      height: RFValue(12),
      width: 50,
      borderRadius: 4,
    },
    statusBadge: {
      height: RFValue(16),
      width: 60,
      borderRadius: 4,
    },
    productImageContainer: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.border,
      flexShrink: 0,
    },
  });

  return (
    <View style={styles.productCard}>
      {/* Left Side - Product Info */}
      <View style={styles.productInfo}>
        {/* Header */}
        <View style={styles.productHeader}>
          <SkeletonLoader style={styles.productName} />
          <SkeletonLoader style={styles.brandText} />
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <SkeletonLoader style={styles.price} />
          {type === 'product' && (
            <>
              <SkeletonLoader style={styles.originalPrice} />
              <SkeletonLoader style={styles.discountBadge} />
            </>
          )}
        </View>

        {/* Meta Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <SkeletonLoader style={styles.metaIcon} />
            <SkeletonLoader style={styles.metaText} />
          </View>
          {type === 'product' && (
            <View style={styles.metaItem}>
              <SkeletonLoader style={styles.metaIcon} />
              <SkeletonLoader style={styles.metaText} />
            </View>
          )}
          <SkeletonLoader style={styles.statusBadge} />
        </View>
      </View>

      {/* Right Side - Image Thumbnail */}
      <View style={styles.productImageContainer}>
        <SkeletonLoader width="100%" height="100%" borderRadius={8} />
      </View>
    </View>
  );
};

export default InventoryItemSkeleton;
