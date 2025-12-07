import React, {FC} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {useTheme} from '@hooks/useTheme';
import {useEffect, useRef} from 'react';

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
  const {colors, isDark} = useTheme();
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
      width: typeof width === 'string' ? width : width,
      height,
      borderRadius,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
    },
  });

  return (
    <Animated.View style={[styles.skeleton, {opacity}, style]} />
  );
};

export const DashboardSkeleton: FC = () => {
  const {colors} = useTheme();

  return (
    <View style={{flex: 1, backgroundColor: colors.background, padding: 16}}>
      <SkeletonLoader width="60%" height={24} borderRadius={4} style={{marginBottom: 24}} />
      <SkeletonLoader width="100%" height={120} borderRadius={12} style={{marginBottom: 16}} />
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12}}>
        <SkeletonLoader width="48%" height={120} borderRadius={12} />
        <SkeletonLoader width="48%" height={120} borderRadius={12} />
        <SkeletonLoader width="48%" height={120} borderRadius={12} />
        <SkeletonLoader width="48%" height={120} borderRadius={12} />
      </View>
    </View>
  );
};

export default SkeletonLoader;

