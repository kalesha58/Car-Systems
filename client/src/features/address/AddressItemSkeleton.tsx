import {View, StyleSheet} from 'react-native';
import React, {FC, useMemo} from 'react';
import {useTheme} from '@hooks/useTheme';
import SkeletonLoader from '@components/common/Skeleton/SkeletonLoader';

interface AddressItemSkeletonProps {
  index?: number;
}

const AddressItemSkeleton: FC<AddressItemSkeletonProps> = ({index = 0}) => {
  const {colors} = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: 15,
          paddingHorizontal: 10,
          borderTopWidth: index === 0 ? 0.7 : 0,
          borderColor: colors.border,
        },
        flexRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
        },
        contentContainer: {
          flex: 1,
          gap: 4,
        },
        nameSkeleton: {
          height: 18,
          width: '60%',
          borderRadius: 4,
          marginBottom: 4,
        },
        addressSkeleton: {
          height: 14,
          width: '90%',
          borderRadius: 4,
          marginTop: 4,
        },
        phoneSkeleton: {
          height: 12,
          width: '40%',
          borderRadius: 4,
          marginTop: 4,
        },
        menuSkeleton: {
          width: 24,
          height: 24,
          borderRadius: 12,
        },
      }),
    [colors, index],
  );

  return (
    <View style={styles.container}>
      <View style={styles.flexRow}>
        <SkeletonLoader width={40} height={40} borderRadius={20} style={styles.iconContainer} />
        <View style={styles.contentContainer}>
          <SkeletonLoader style={styles.nameSkeleton} />
          <SkeletonLoader style={styles.addressSkeleton} />
          <SkeletonLoader style={styles.phoneSkeleton} />
        </View>
        <SkeletonLoader style={styles.menuSkeleton} />
      </View>
    </View>
  );
};

export default AddressItemSkeleton;

