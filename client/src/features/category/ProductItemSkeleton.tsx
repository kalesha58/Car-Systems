import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import {screenHeight} from '@utils/Scaling';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import {useTheme} from '@hooks/useTheme';

interface ProductItemSkeletonProps {
  index: number;
}

const ProductItemSkeleton: FC<ProductItemSkeletonProps> = ({index}) => {
  const {colors} = useTheme();
  const isSecondColumn = index % 2 !== 0;

  const styles = StyleSheet.create({
    container: {
      width: '45%',
      borderRadius: 10,
      backgroundColor: colors.cardBackground,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: isSecondColumn ? 10 : 0,
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
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      overflow: 'hidden',
    },
    content: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 12,
    },
    badge: {
      width: 60,
      height: 16,
      marginBottom: 8,
    },
    title: {
      height: 16,
      marginBottom: 6,
    },
    title2: {
      height: 16,
      width: '80%',
      marginBottom: 12,
    },
    priceContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    price: {
      height: 18,
      width: 70,
    },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <SkeletonLoader width="100%" height="100%" borderRadius={0} />
      </View>
      <View style={styles.content}>
        <SkeletonLoader style={styles.badge} />
        <SkeletonLoader style={styles.title} />
        <SkeletonLoader style={styles.title2} />
        <View style={styles.priceContainer}>
          <SkeletonLoader style={styles.price} />
          <SkeletonLoader style={styles.addButton} />
        </View>
      </View>
    </View>
  );
};

export default ProductItemSkeleton;

