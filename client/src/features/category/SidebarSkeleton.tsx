import React, {FC} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import {useTheme} from '@hooks/useTheme';

const SidebarSkeleton: FC = () => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    sideBar: {
      width: '24%',
      backgroundColor: colors.cardBackground,
      borderRightWidth: 0.8,
      borderRightColor: colors.border,
    },
    skeletonItem: {
      padding: 10,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    imageSkeleton: {
      width: '75%',
      height: 50,
      borderRadius: 50,
      marginBottom: 10,
    },
    textSkeleton: {
      width: '60%',
      height: 12,
      borderRadius: 4,
    },
  });

  // Show 6 skeleton items
  const skeletonItems = Array.from({length: 6}, (_, i) => i);

  return (
    <View style={styles.sideBar}>
      <ScrollView
        contentContainerStyle={{paddingBottom: 50}}
        showsVerticalScrollIndicator={false}>
        {skeletonItems.map((index) => (
          <View key={index} style={styles.skeletonItem}>
            <SkeletonLoader style={styles.imageSkeleton} />
            <SkeletonLoader style={styles.textSkeleton} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SidebarSkeleton;

