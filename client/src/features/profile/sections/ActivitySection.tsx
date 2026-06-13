import { View, StyleSheet } from 'react-native';
import React, { FC } from 'react';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@state/authStore';

const ActivitySection: FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isDealer = user?.role?.includes('dealer');

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      marginBottom: 12,
      fontSize: RFValue(13),
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  });

  const menuItems = [
    ...(!isDealer
      ? [
          {
            icon: 'car-sport-outline',
            label: t('profile.myTestDrives'),
            onPress: () => navigation.navigate('MyTestDrives' as never),
          },
          {
            icon: 'construct-outline',
            label: t('service.myBookings') || 'My Service Bookings',
            onPress: () => navigation.navigate('MyServiceBookings' as never),
          },
        ]
      : []),
    {
      icon: 'create-outline',
      label: t('profile.reviews'),
      onPress: () =>
        navigation.navigate(
          (isDealer ? 'DealerOrdersList' : 'OrdersList') as never,
        ),
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: t('profile.questionsAnswers'),
      onPress: () => navigation.navigate('MetAIChat' as never),
    },
  ];

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.Bold} style={styles.sectionTitle}>
        {t('profile.myActivity') || 'MY ACTIVITY'}
      </CustomText>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <ProfileMenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
            isLast={index === menuItems.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

export default ActivitySection;
