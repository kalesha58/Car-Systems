import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

interface PromoBannerProps {
  onPress?: () => void;
}

export function PromoBanner({ onPress }: PromoBannerProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Feather name="tag" size={20} color="#2563EB" />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>First Service Free!</Text>
            <Text style={styles.subtitle}>
              Book any mechanic service and get ₹200 off
            </Text>
          </View>
          <Pressable
            style={styles.btn}
            onPress={onPress}
          >
            <Text style={styles.btnText}>Book Now</Text>
            <Feather name="chevron-right" size={12} color="#fff" />
          </Pressable>
        </View>
        <Feather
          name="tool"
          size={84}
          color="#2563EB"
          style={styles.watermark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#EFF6FF', // Light blue tint
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE', // Slightly darker blue circular badge
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#1E3A8A', // Dark blue
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#1E3A8A',
    opacity: 0.8,
    lineHeight: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB', // Pill blue button
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2,
  },
  btnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  watermark: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    opacity: 0.06, // Highly transparent wrench icon
  },
});
