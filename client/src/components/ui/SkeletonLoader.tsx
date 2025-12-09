import React, {FC, useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {useTheme} from '@hooks/useTheme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const {colors} = useTheme();
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
      width,
      height,
      borderRadius,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        style,
        {
          opacity,
        },
      ]}
    />
  );
};

export default SkeletonLoader;

