import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '@utils/Constants';
import WalletItem from './WalletItem';
import {useTranslation} from 'react-i18next';

const WalletSection = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();

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

const styles = StyleSheet.create({
    walletContainer: {
        justifyContent: 'space-around',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundSecondary,
        paddingVertical: 15,
        borderRadius: 15,
        marginVertical: 20
    }
})
export default WalletSection