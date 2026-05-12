import React, {FC} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';

import SkeletonLoader from '@components/ui/SkeletonLoader';
import {useTheme} from '@hooks/useTheme';
import {screenWidth} from '@utils/Scaling';

const PlayPostSkeleton: FC = () => {
  const {colors} = useTheme();
  const windowDims = Dimensions.get('window');
  const imageHeight = Math.min(windowDims.width * 1.04, windowDims.height * 0.46);

  const styles = StyleSheet.create({
    container: {
      width: screenWidth,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
      gap: 12,
    },
    avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 1,
      overflow: 'hidden',
    },
    userMeta: {
      flex: 1,
      justifyContent: 'center',
      gap: 6,
    },
    nameLine: {
      height: RFValue(10),
      width: '45%',
      borderRadius: 4,
    },
    dateLine: {
      height: RFValue(8),
      width: '30%',
      borderRadius: 4,
    },
    image: {
      width: '100%',
      height: imageHeight,
      backgroundColor: colors.backgroundSecondary,
    },
    caption: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 18,
      gap: 6,
    },
    captionLine1: {
      height: RFValue(10),
      width: '90%',
      borderRadius: 4,
    },
    captionLine2: {
      height: RFValue(10),
      width: '70%',
      borderRadius: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <SkeletonLoader width="100%" height="100%" borderRadius={20} />
        </View>
        <View style={styles.userMeta}>
          <SkeletonLoader style={styles.nameLine} />
          <SkeletonLoader style={styles.dateLine} />
        </View>
      </View>

      <SkeletonLoader width="100%" height={imageHeight} borderRadius={0} style={styles.image} />

      <View style={styles.caption}>
        <SkeletonLoader style={styles.captionLine1} />
        <SkeletonLoader style={styles.captionLine2} />
      </View>
    </View>
  );
};

export default PlayPostSkeleton;
