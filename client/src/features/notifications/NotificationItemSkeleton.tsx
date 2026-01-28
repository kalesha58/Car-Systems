import { View, StyleSheet } from 'react-native';
import React, { FC, useMemo } from 'react';
import { useTheme } from '@hooks/useTheme';
import SkeletonLoader from '@components/common/Skeleton/SkeletonLoader';

interface NotificationItemSkeletonProps {
  index?: number;
}

const NotificationItemSkeleton: FC<NotificationItemSkeletonProps> = ({ index = 0 }) => {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.cardBackground,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          marginRight: 12,
        },
        textContainer: {
          flex: 1,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        },
        titleSkeleton: {
          flex: 1,
          height: 16,
          borderRadius: 4,
          marginRight: 8,
        },
        unreadDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        bodySkeleton: {
          height: 14,
          borderRadius: 4,
          marginBottom: 6,
        },
        timeSkeleton: {
          height: 12,
          width: '40%',
          borderRadius: 4,
          marginTop: 4,
        },
      }),
    [colors, index],
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SkeletonLoader width={40} height={40} borderRadius={20} style={styles.iconContainer} />
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <SkeletonLoader width="70%" height={16} borderRadius={4} style={styles.titleSkeleton} />
            <SkeletonLoader width={8} height={8} borderRadius={4} style={styles.unreadDot} />
          </View>
          <SkeletonLoader width="95%" height={14} borderRadius={4} style={styles.bodySkeleton} />
          <SkeletonLoader width="85%" height={14} borderRadius={4} style={styles.bodySkeleton} />
          <SkeletonLoader width="40%" height={12} borderRadius={4} style={styles.timeSkeleton} />
        </View>
      </View>
    </View>
  );
};

export default NotificationItemSkeleton;
