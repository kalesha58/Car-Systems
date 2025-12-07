import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
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

  const content = (
    <View style={styles.walletItemContainer}>
      <Icon name={icon} color={colors.text} size={RFValue(20)} />
      <CustomText variant="h8" fontFamily={Fonts.Medium}>
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
const styles = StyleSheet.create({
    walletItemContainer: {
        alignItems: 'center'
    }
})

export default WalletItem