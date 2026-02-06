import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import React, {FC} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useAuthStore} from '@state/authStore';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';
import { shouldHidePhone, maskPhone } from '@utils/privacyUtils';

const ProfileHeader: FC = () => {
  const {user} = useAuthStore();
  const {t} = useTranslation();
  const {colors, isDark} = useTheme();

  const getInitialLetter = (): string => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileImageContainer}>
        {user?.profileImage ? (
          <Image
            source={{uri: user.profileImage}}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderContainer, {backgroundColor: colors.white}]}>
            <CustomText variant="h2" fontFamily={Fonts.Bold} style={styles.placeholderText}>
              {getInitialLetter()}
            </CustomText>
          </View>
        )}
      </View>
      
      <CustomText variant="h3" fontFamily={Fonts.Bold} style={[styles.accountTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
        {t('profile.yourAccount') || 'Your account'}
      </CustomText>
      
      {user?.phone && !shouldHidePhone() && (
        <CustomText variant="h6" fontFamily={Fonts.Medium} style={[styles.phoneNumber, { color: colors.textSecondary }]}>
          {maskPhone(user.phone)}
        </CustomText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  placeholderText: {
    color: '#666666',
  },
  accountTitle: {
    marginBottom: 8,
    fontWeight: '700',
  },
  phoneNumber: {
    opacity: 0.9,
  },
});

export default ProfileHeader;

