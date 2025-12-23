import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import { goBack } from '@utils/NavigationUtils';
import { useTheme } from '@hooks/useTheme';
import { useCollapsibleContext } from '@r0b0t3d/react-native-collapsible';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@state/authStore';
import { useTranslation } from 'react-i18next';

const AnimatedProfileHeader: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { scrollY } = useCollapsibleContext();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [-200, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const backgroundColorAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [0, 1],
      Extrapolation.CLAMP,
    );
    // Use theme colors for proper dark mode support
    const rgb = isDark
      ? { r: 30, g: 30, b: 30 }
      : { r: 255, g: 255, b: 255 };
    return {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    };
  });

  const statusBarBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [0, 1],
      Extrapolation.CLAMP,
    );
    // Use theme colors for proper dark mode support
    const rgb = isDark
      ? { r: 30, g: 30, b: 30 }
      : { r: 255, g: 255, b: 255 };
    return {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    };
  });

  const getInitialLetter = (): string => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const accountTitle = t('profile.yourAccount') || 'Your account';
  const truncatedTitle = accountTitle.length > 25 ? `${accountTitle.substring(0, 25)}...` : accountTitle;

  const styles = StyleSheet.create({
    statusBarBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top,
      zIndex: 99,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      zIndex: 100,
    },
    backButton: {
      marginRight: 12,
    },
    thumbnail: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.backgroundSecondary,
      overflow: 'hidden',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    thumbnailPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: RFValue(14),
      marginBottom: 2,
    },
    subtitle: {
      fontSize: RFValue(11),
      opacity: 0.7,
    },
  });

  return (
    <>
      <Animated.View style={[styles.statusBarBackground, statusBarBackgroundStyle]} />
      <Animated.View style={[styles.container, headerAnimatedStyle, backgroundColorAnimatedStyle]}>
        <Pressable onPress={() => goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={RFValue(20)} color={colors.text} />
        </Pressable>
        <View style={styles.thumbnail}>
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <CustomText
                variant="h7"
                fontFamily={Fonts.Bold}
                style={{ color: '#fff' }}>
                {getInitialLetter()}
              </CustomText>
            </View>
          )}
        </View>
        <View style={styles.content}>
          <CustomText
            variant="h6"
            fontFamily={Fonts.Medium}
            numberOfLines={1}
            style={styles.title}>
            {truncatedTitle}
          </CustomText>
          {user?.name && (
            <CustomText
              variant="h8"
              fontFamily={Fonts.Regular}
              numberOfLines={1}
              style={styles.subtitle}>
              {user.name}
            </CustomText>
          )}
        </View>
      </Animated.View>
    </>
  );
};

export default AnimatedProfileHeader;

