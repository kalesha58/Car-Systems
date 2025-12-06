import {View, StyleSheet, ScrollView, TouchableOpacity, FlatList} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useAuthStore} from '@state/authStore';
import {useCartStore} from '@state/cartStore';
import CustomHeader from '@components/ui/CustomHeader';
import ProfileOrderItem from './ProfileOrderItem';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';
import {storage, tokenStorage} from '@state/storage';
import {resetAndNavigate} from '@utils/NavigationUtils';
import WalletSection from './WalletSection';
import ProfileHeader from './sections/ProfileHeader';
import LanguageSection from './sections/LanguageSection';
import AccountSettingsSection from './sections/AccountSettingsSection';
import ActivitySection from './sections/ActivitySection';
import FeedbackSection from './sections/FeedbackSection';
import {useTranslation} from 'react-i18next';

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const {logout, user} = useAuthStore();
  const {clearCart} = useCartStore();
  const {t} = useTranslation();

  const fetchOrders = async () => {
    // const data = await fetchCustomerOrders(user?._id);
    // setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = () => {
    clearCart();
    logout();
    tokenStorage.clearAll();
    storage.clearAll();
    resetAndNavigate('CustomerLogin');
  };

  const renderOrders = ({item, index}: any) => {
    return <ProfileOrderItem item={item} index={index} />;
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={t('profile.title')} />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <ProfileHeader />
        <WalletSection />
        <LanguageSection />
        <AccountSettingsSection />
        <ActivitySection />
        <FeedbackSection />

        {orders.length > 0 && (
          <View style={styles.ordersSection}>
            <CustomText variant="h8" style={styles.sectionTitle}>
              {t('profile.pastOrders')}
            </CustomText>
            <FlatList
              data={orders}
              renderItem={renderOrders}
              keyExtractor={(item: any) => item?.orderId}
              scrollEnabled={false}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.logoutText}>
            {t('profile.logOut')}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollViewContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    marginBottom: 12,
    opacity: 0.7,
    paddingHorizontal: 4,
  },
  ordersSection: {
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
  },
});

export default Profile;
