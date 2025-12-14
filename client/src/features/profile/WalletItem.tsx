import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import React, {FC} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';

const WalletItem: FC<{
  icon: string;
  label: string;
  onPress?: () => void;
}> = ({icon, label, onPress}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    walletItemContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      flex: 1,
      minHeight: 80,
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }
        : {
            elevation: 2,
          }),
    },
    iconContainer: {
      marginBottom: 8,
    },
    labelText: {
      textAlign: 'center',
    },
  });

  const content = (
    <View style={styles.walletItemContainer}>
      <View style={styles.iconContainer}>
        <Icon name={icon} color={colors.text} size={RFValue(24)} />
      </View>
      <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.labelText}>
        {label}
      </CustomText>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default WalletItem;