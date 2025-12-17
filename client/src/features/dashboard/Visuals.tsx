import { View, StyleSheet } from 'react-native';
import React from 'react';
import { screenHeight } from '@utils/Scaling';
import { useCollapsibleContext } from '@r0b0t3d/react-native-collapsible';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';

const Visuals: React.FC<{ showOverlay?: boolean }> = ({ showOverlay = true }) => {
  const { scrollY } = useCollapsibleContext();
  const seasonalTheme = useSeasonalTheme();

  const headerAniamtedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 120], [1, 0]);
    return { opacity };
  });

  return (
    <Animated.View style={[styles.container, headerAniamtedStyle, { backgroundColor: seasonalTheme.colors.primary }]}>
      {/* Background animation (snow, sakura, etc.) */}
      <View style={styles.animationContainer}>
        <LottieView
          autoPlay
          loop
          speed={0.5}
          style={styles.backgroundAnimation}
          source={seasonalTheme.animations.background}
        />
      </View>

      {/* Overlay animation (train, sleigh, etc.) - if available */}
      {showOverlay && seasonalTheme.animations.overlay && (
        <View style={styles.overlayContainer}>
          <LottieView
            autoPlay
            loop
            speed={1}
            style={styles.overlayAnimation}
            source={seasonalTheme.animations.overlay}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: screenHeight * 0.4,
  },
  gradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  animationContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 2,
  },
  backgroundAnimation: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    width: '100%',
    height: 150,
    position: 'absolute',
    bottom: 0,
    zIndex: 3,
  },
  overlayAnimation: {
    width: '100%',
    height: '100%',
  },
});

export default Visuals;
