import { View, StyleSheet, TouchableOpacity } from 'react-native';
import React, { FC, ReactNode } from 'react';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@hooks/useTheme';

interface IProfileMenuItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightComponent?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
  iconColor?: string;
  iconBackground?: string;
  subTitle?: string;
}

const ProfileMenuItem: FC<IProfileMenuItemProps> = ({
  icon,
  label,
  onPress,
  rightComponent,
  showChevron = true,
  isLast = false,
  iconColor,
  iconBackground,
  subTitle
}) => {
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 0,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: isDark ? '#333' : '#f0f0f0',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderRadius: 12, // Softer radius like modern apps
      backgroundColor: iconBackground || (isDark ? '#333' : '#f5f5f5'),
    },
    labelContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    subTitle: {
      marginTop: 2,
      color: colors.textSecondary
    }
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={RFValue(20)} color={iconColor || colors.text} />
        </View>
        <View style={styles.labelContainer}>
          <CustomText variant="h6" fontFamily={Fonts.Medium} style={{ color: colors.text }}>
            {label}
          </CustomText>
          {subTitle && (
            <CustomText variant="h9" fontFamily={Fonts.Regular} style={styles.subTitle}>
              {subTitle}
            </CustomText>
          )}
        </View>
      </View>
      {rightComponent || (showChevron && (
        <Icon
          name="chevron-forward"
          size={RFValue(16)}
          color={colors.disabled}
        />
      ))}
    </TouchableOpacity>
  );
};

export default ProfileMenuItem;
