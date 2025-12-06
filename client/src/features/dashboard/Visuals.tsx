import {View, Text, StyleSheet, Image} from 'react-native';
import React, {useMemo} from 'react';
import {screenHeight, screenWidth} from '@utils/Scaling';
import {useCollapsibleContext} from '@r0b0t3d/react-native-collapsible';
import Animated, {interpolate, useAnimatedStyle} from 'react-native-reanimated';
import {darkWeatherColors} from '@utils/Constants';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import {animations} from '@utils/animationConfig';

const Visuals = () => {
  const {scrollY} = useCollapsibleContext();
  
  const selectedAnimation = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * animations.length);
    return animations[randomIndex];
  }, []);
  
  const headerAniamtedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 120], [1, 0]);
    return {opacity};
  });

  return (
    <Animated.View style={[styles.container, headerAniamtedStyle]}>
      <LinearGradient colors={darkWeatherColors} style={styles.gradient} />
      <Image
        source={require('@assets/images/cloud.png')}
        style={styles.cloud}
      />
      <LottieView
        autoPlay={true}
        enableMergePathsAndroidForKitKatAndAbove={true}
        loop={true}
        style={styles.lottie}
        source={selectedAnimation.source}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  lottie: {
    width: '100%',
    height: 150,
    position: 'absolute',
    transform: [{scaleX: -1}],
  },
  gradient: {
    width: '100%',
    height: screenHeight * 0.4,
    position: 'absolute',
  },
  cloud: {
    width: screenWidth,
    resizeMode: 'stretch',
    height: 100,
  },
});

export default Visuals;
