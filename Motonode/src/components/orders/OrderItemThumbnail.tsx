import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

interface OrderItemThumbnailProps {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
}

export function OrderItemThumbnail({ uri, style, iconSize = 20 }: OrderItemThumbnailProps) {
  const colors = useColors();

  if (uri) {
    return <Image source={{ uri }} style={[styles.thumb, style]} resizeMode="cover" />;
  }

  return (
    <View
      style={[
        styles.thumb,
        styles.placeholder,
        { backgroundColor: colors.surfaceSecondary },
        style as StyleProp<ViewStyle>,
      ]}
    >
      <Feather name="package" size={iconSize} color={colors.textTertiary} />
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
