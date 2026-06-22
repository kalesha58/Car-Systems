import {View, StyleSheet, Pressable} from 'react-native';
import React, {FC, ReactNode} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Fonts, MIN_TOUCH_TARGET, headerTopInset} from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from './CustomText';
import {useTheme} from '@hooks/useTheme';
import NotificationIcon from '@components/common/NotificationIcon';

interface CustomHeaderProps {
  title: string;
  search?: boolean;
  showNotificationIcon?: boolean;
  rightComponent?: ReactNode;
  onSearchPress?: () => void;
  transparent?: boolean;
  showBackButton?: boolean;
  backgroundColor?: string;
  titleColor?: string;
  iconColor?: string;
  onBackPress?: () => void;
}

const CustomHeader: FC<CustomHeaderProps> = ({
  title,
  search,
  showNotificationIcon = true,
  rightComponent,
  onSearchPress,
  transparent = false,
  showBackButton = true,
  backgroundColor,
  titleColor,
  iconColor,
  onBackPress,
}) => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const headerIconSize = Math.min(RFValue(20), 22);

  const styles = StyleSheet.create({
    flexRow: {
      justifyContent: 'space-between',
      paddingLeft: Math.max(12, insets.left),
      paddingRight: Math.max(12, insets.right),
      paddingVertical: 4,
      minHeight: MIN_TOUCH_TARGET,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: backgroundColor || (transparent ? 'transparent' : colors.cardBackground),
      borderBottomWidth: backgroundColor ? 0 : (transparent ? 0 : 0.6),
      borderColor: colors.border,
      overflow: 'visible',
    },
    text: {
      textAlign: 'center',
      flex: 1,
      color: titleColor || colors.text,
    },
    iconButton: {
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
    },
    headerBackPressable: {
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'visible',
    },
  });

  return (
    <View style={{
      paddingTop: headerTopInset(insets.top),
      backgroundColor: backgroundColor || (transparent ? 'transparent' : colors.cardBackground),
      overflow: 'visible',
    }}>
      <View style={styles.flexRow}>
        {showBackButton ? (
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            style={styles.headerBackPressable}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => {
              if (onBackPress) {
                onBackPress();
              } else if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}>
            <Icon name="chevron-back" color={iconColor || colors.text} size={headerIconSize} />
          </Pressable>
        ) : (
          <View style={{width: headerIconSize}} />
        )}
        <CustomText
          style={styles.text}
          variant="h5"
          fontFamily={Fonts.SemiBold}>
          {title}
        </CustomText>

        <View style={styles.rightActions}>
          {rightComponent || (
            <>
              {search && (
                <Pressable onPress={onSearchPress} style={styles.iconButton}>
                  <Icon name="search" color={iconColor || colors.text} size={headerIconSize} />
                </Pressable>
              )}
              {!search && showNotificationIcon && <NotificationIcon color={iconColor} />}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default CustomHeader;
