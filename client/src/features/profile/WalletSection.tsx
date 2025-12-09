import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import WalletItem from './WalletItem';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';

const WalletSection = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    walletContainer: {
      justifyContent: 'space-around',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingVertical: 15,
      borderRadius: 15,
      marginVertical: 20,
    },
  });

  return (
    <View style={styles.walletContainer}>
      <WalletItem icon="wallet-outline" label={t('common.wallet')} />
      <WalletItem icon="chatbubble-ellipses-outline" label={t('common.support')} />
      <WalletItem
        icon="bag-outline"
        label={t('profile.myOrders')}
        onPress={() => {
          navigation.navigate('OrdersList' as never);
        }}
      />
    </View>
  );
};

export default WalletSection;