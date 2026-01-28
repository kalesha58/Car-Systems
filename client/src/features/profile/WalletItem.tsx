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
      paddingVertical: 20,
      paddingHorizontal: 12,
      width: '100%',
      minHeight: 90,
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }
        : {
            elevation: 1,
          }),
    },
    iconContainer: {
      marginBottom: 10,
    },
    labelText: {
      textAlign: 'center',
      color: colors.text,
      fontSize: RFValue(12),
    },
  });

  const content = (
    <View style={styles.walletItemContainer}>
      <View style={styles.iconContainer}>
        <Icon name={icon} color={colors.secondary} size={RFValue(28)} />
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