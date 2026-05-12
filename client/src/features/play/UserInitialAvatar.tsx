import React from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';

export function getDisplayInitials(displayName: string, fallbackId?: string): string {
  const trimmed = (displayName || '').trim();
  if (trimmed.length >= 1) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0].charAt(0);
      const b = parts[1].charAt(0);
      return `${a}${b}`.toUpperCase().slice(0, 2);
    }
    return trimmed.charAt(0).toUpperCase();
  }
  if (fallbackId && fallbackId.length >= 1) {
    const alnum = fallbackId.replace(/[^a-zA-Z0-9]/g, '');
    if (alnum.length >= 1) return alnum.charAt(0).toUpperCase();
  }
  return '?';
}

interface UserInitialAvatarProps {
  name: string;
  userId?: string;
  imageUri?: string | null;
  size: number;
  borderColor?: string;
  borderWidth?: number;
  fallbackBackgroundColor: string;
  initialsColor: string;
  fontSize?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

const UserInitialAvatar: React.FC<UserInitialAvatarProps> = ({
  name,
  userId,
  imageUri,
  size,
  borderColor,
  borderWidth = StyleSheet.hairlineWidth,
  fallbackBackgroundColor,
  initialsColor,
  fontSize,
  containerStyle,
}) => {
  const uri = imageUri?.trim();
  const hasPhoto = Boolean(uri);

  const borderStyle: ViewStyle =
    borderColor !== undefined && borderWidth > 0
      ? { borderWidth, borderColor }
      : { borderWidth: 0 };

  const computedFont = fontSize ?? Math.max(RFValue(11), Math.round(size * 0.38));

  if (hasPhoto) {
    return (
      <View
        style={[
          styles.wrap,
          { width: size, height: size, borderRadius: size / 2 },
          borderStyle,
          containerStyle,
        ]}>
        <Image source={{ uri: uri! }} style={{ width: size, height: size }} />
      </View>
    );
  }

  const initials = getDisplayInitials(name, userId);

  return (
    <View
      style={[
        styles.wrap,
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fallbackBackgroundColor,
        },
        borderStyle,
        containerStyle,
      ]}>
      <CustomText
        fontSize={computedFont}
        fontFamily={Fonts.SemiBold}
        style={{ color: initialsColor }}>
        {initials}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserInitialAvatar;
