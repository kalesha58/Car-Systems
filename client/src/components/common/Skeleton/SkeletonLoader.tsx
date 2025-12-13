import React, { FC } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { useEffect, useRef } from 'react';

interface ISkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: FC<ISkeletonLoaderProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const styles = StyleSheet.create({
    skeleton: {
      width: width as any,
      height,
      borderRadius,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
    },
  });

  return (
    <Animated.View style={[styles.skeleton, { opacity }, style]} />
  );
};

export const DashboardContentSkeleton: FC = () => {
  return (
    <View>
      {/* Stats/Profit Card Area */}
      <SkeletonLoader width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        <SkeletonLoader width="31%" height={100} borderRadius={16} />
        <SkeletonLoader width="31%" height={100} borderRadius={16} />
        <SkeletonLoader width="31%" height={100} borderRadius={16} />
      </View>

      {/* Recent Activity / Content Area */}
      <View>
        <SkeletonLoader width={120} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
        <SkeletonLoader width="100%" height={70} borderRadius={12} style={{ marginBottom: 10 }} />
        <SkeletonLoader width="100%" height={70} borderRadius={12} style={{ marginBottom: 10 }} />
        <SkeletonLoader width="100%" height={70} borderRadius={12} style={{ marginBottom: 10 }} />
      </View>
    </View>
  );
}

export const DashboardSkeleton: FC = () => {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 12 }}>
      {/* Header Area */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
        <View>
          <SkeletonLoader width={150} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={200} height={14} borderRadius={4} />
        </View>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
      </View>

      <DashboardContentSkeleton />
    </View>
  );
};

export const ChatListSkeleton: FC = () => {
  const { colors } = useTheme();

  return (
    <View>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            padding: 12,
            marginBottom: 12,
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            alignItems: 'center',
          }}>
          <SkeletonLoader width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <SkeletonLoader width={120} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={180} height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default SkeletonLoader;

