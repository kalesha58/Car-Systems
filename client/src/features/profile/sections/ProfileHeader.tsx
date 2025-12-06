import {View, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useAuthStore} from '@state/authStore';
import {useTranslation} from 'react-i18next';

const ProfileHeader: FC = () => {
  const {user} = useAuthStore();
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <CustomText variant="h3" fontFamily={Fonts.SemiBold}>
        {t('profile.yourAccount')}
      </CustomText>
      <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.phone}>
        {user?.phone || 'Not available'}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  phone: {
    marginTop: 4,
    opacity: 0.7,
  },
});

export default ProfileHeader;

