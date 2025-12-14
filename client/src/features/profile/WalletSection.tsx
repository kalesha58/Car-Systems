import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import WalletItem from './WalletItem';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';

const WalletSection = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const isDealer = user?.role?.includes('dealer');

  const styles = StyleSheet.create({
    walletContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 12,
      marginBottom: 20,
      marginTop: 20,
    },
  });

  return (
    <View style={styles.walletContainer}>
      {!isDealer && (
        <WalletItem
          icon="wallet-outline"
          label={t('common.wallet')}
          onPress={() => {
            // TODO: Navigate to wallet screen when implemented
          }}
        />
      )}

      <WalletItem 
        icon="chatbubble-ellipses-outline" 
        label={t('common.support')}
        onPress={() => {
          // TODO: Navigate to support screen when implemented
        }}
      />

      {!isDealer && (
        <WalletItem
          icon="bag-outline"
          label={t('profile.myOrders')}
          onPress={() => {
            navigation.navigate('OrdersList' as never);
          }}
        />
      )}
    </View>
  );
};

export default WalletSection;