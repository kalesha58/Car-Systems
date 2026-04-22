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
      marginBottom: 16,
      marginTop: 0,
      width: '100%',
      gap: 12,
    },
    walletItemWrapper: {
      flex: 1,
    },
  });

  // Calculate which items to show - matching reference design
  const items = [];
  if (!isDealer) {
    // Your orders
    items.push({ 
      icon: 'bag-outline', 
      label: t('profile.myOrders'), 
      onPress: () => navigation.navigate('OrdersList' as never) 
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.walletContainer}>
      {items.map((item) => (
        <View 
          key={item.icon} 
          style={styles.walletItemWrapper}
        >
          <WalletItem
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
          />
        </View>
      ))}
    </View>
  );
};

export default WalletSection;