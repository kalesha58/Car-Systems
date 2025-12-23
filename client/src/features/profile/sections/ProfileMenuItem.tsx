import {View, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC, ReactNode} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';

interface IProfileMenuItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightComponent?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}

const ProfileMenuItem: FC<IProfileMenuItemProps> = ({
  icon,
  label,
  onPress,
  rightComponent,
  showChevron = true,
  isLast = false,
}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 0,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      overflow: 'visible',
    },
    labelContainer: {
      flex: 1,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={RFValue(24)} color={colors.text} />
        </View>
        <View style={styles.labelContainer}>
          <CustomText variant="h6" fontFamily={Fonts.Medium} style={{ color: colors.text }}>
            {label}
          </CustomText>
        </View>
      </View>
      {rightComponent || (showChevron && (
        <Icon
          name="chevron-forward"
          size={RFValue(18)}
          color={colors.disabled}
        />
      ))}
    </TouchableOpacity>
  );
};

export default ProfileMenuItem;

