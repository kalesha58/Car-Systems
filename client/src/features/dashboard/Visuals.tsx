import { View, StyleSheet } from 'react-native';
import React from 'react';
import { screenHeight } from '@utils/Scaling';
import { useCollapsibleContext } from '@r0b0t3d/react-native-collapsible';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';
import { useVisualEffectsStore } from '@state/visualEffectsStore';

const Visuals: React.FC<{ showOverlay?: boolean }> = ({ showOverlay = true }) => {
  const { scrollY } = useCollapsibleContext();
  const seasonalTheme = useSeasonalTheme();
  const visualEffects = useVisualEffectsStore(state => state.config);

  const headerAniamtedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 120], [1, 0]);
    return { opacity };
  });

  const shouldShowOverlay =
    showOverlay &&
    seasonalTheme.showOverlayOnHome &&
    !!seasonalTheme.animations.overlay;

  const backgroundKey = `${visualEffects.enabled}-${visualEffects.backgroundEffect}-${visualEffects.backgroundSpeed}-${visualEffects.headerColor ?? 'default'}`;
  const overlayKey = `${visualEffects.enabled}-${visualEffects.overlayEffect}`;

  return (
    <Animated.View style={[styles.container, headerAniamtedStyle, { backgroundColor: seasonalTheme.colors.primary }]}>
      {seasonalTheme.animations.background && (
        <View style={styles.animationContainer}>
          <LottieView
            key={backgroundKey}
            autoPlay
            loop
            speed={seasonalTheme.backgroundSpeed}
            style={styles.backgroundAnimation}
            source={seasonalTheme.animations.background}
          />
        </View>
      )}

      {shouldShowOverlay && (
        <View style={styles.overlayContainer}>
          <LottieView
            key={overlayKey}
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
