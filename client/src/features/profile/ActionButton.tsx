import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC, ReactNode} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightIcon?: string | ReactNode;
  showChevron?: boolean;
}

const ActionButton: FC<ActionButtonProps> = ({
  icon,
  label,
  onPress,
  rightIcon,
  showChevron = false,
}) => {
  const renderRightIcon = () => {
    if (rightIcon) {
      if (typeof rightIcon === 'string') {
        return <Icon name={rightIcon} color={Colors.disabled} size={RFValue(18)} />;
      }
      return rightIcon;
    }
    if (showChevron) {
      return (
        <Icon name="chevron-forward" color={Colors.disabled} size={RFValue(18)} />
      );
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Icon name={icon} color={Colors.text} size={RFValue(14)} />
        </View>
        <CustomText variant="h7" fontFamily={Fonts.Medium}>
          {label}
        </CustomText>
      </View>
      {renderRightIcon()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderRadius: 100,
    backgroundColor: Colors.backgroundSecondary,
  },
});

export default ActionButton;