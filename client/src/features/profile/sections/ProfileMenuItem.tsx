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
}

const ProfileMenuItem: FC<IProfileMenuItemProps> = ({
  icon,
  label,
  onPress,
  rightComponent,
  showChevron = true,
}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
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
          <Icon name={icon} size={RFValue(20)} color={colors.text} />
        </View>
        <CustomText variant="h6" fontFamily={Fonts.Medium}>
          {label}
        </CustomText>
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

