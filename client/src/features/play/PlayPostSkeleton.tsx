import React, {FC} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';

import SkeletonLoader from '@components/ui/SkeletonLoader';
import {useTheme} from '@hooks/useTheme';
import {screenWidth} from '@utils/Scaling';

const PlayPostSkeleton: FC = () => {
  const {colors} = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const imageHeight = screenHeight * 0.5;

  const styles = StyleSheet.create({
    container: {
      width: screenWidth,
      backgroundColor: colors.background,
      marginBottom: screenHeight * 0.018,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: screenWidth * 0.04,
      paddingVertical: screenHeight * 0.01,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: screenWidth * 0.03,
    },
    avatarWrap: {
      width: screenWidth * 0.085,
      height: screenWidth * 0.085,
      borderRadius: screenWidth * 0.085 / 2,
      borderWidth: 1,
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
      height: RFValue(12),
      width: '45%',
      borderRadius: 4,
    },
    dateLine: {
      height: RFValue(10),
      width: '30%',
      borderRadius: 4,
    },
    image: {
      width: '100%',
      height: imageHeight,
      backgroundColor: colors.backgroundSecondary,
    },
    caption: {
      paddingHorizontal: screenWidth * 0.04,
      paddingTop: screenHeight * 0.01,
      paddingBottom: screenHeight * 0.012,
      gap: 6,
    },
    captionLine1: {
      height: RFValue(11),
      width: '90%',
      borderRadius: 4,
    },
    captionLine2: {
      height: RFValue(11),
      width: '70%',
      borderRadius: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <SkeletonLoader width="100%" height="100%" borderRadius={screenWidth * 0.085 / 2} />
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
