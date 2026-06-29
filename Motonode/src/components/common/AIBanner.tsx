import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface AIBannerProps {
  onPress?: () => void;
}

export function AIBanner({ onPress }: AIBannerProps) {
  const colors = useColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  const handlePress = () => {
    lightHaptic();
    onPress?.();
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={{ opacity }}>
            <Feather name="cpu" size={28} color="#fff" />
          </Animated.View>
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Your Automotive Companion</Text>
          <Text style={styles.description}>Diagnose issues, find parts, book services & more</Text>
        </View>
        <Pressable style={styles.chatBtn} onPress={handlePress}>
          <Text style={styles.chatBtnText}>Chat Now</Text>
          <Feather name="chevron-right" size={14} color="#2563EB" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    height: 130,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  description: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatBtnText: { color: '#2563EB', fontSize: 13, fontFamily: 'Inter_700Bold' },
});
