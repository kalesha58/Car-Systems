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

const ProfileHeader: FC = () => {
  const {user} = useAuthStore();
  const {t} = useTranslation();
  const {colors} = useTheme();

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
          <View style={[styles.placeholderContainer, {backgroundColor: colors.primary}]}>
            <CustomText variant="h2" fontFamily={Fonts.Bold} style={styles.placeholderText}>
              {getInitialLetter()}
            </CustomText>
          </View>
        )}
      </View>
      
      <CustomText variant="h3" fontFamily={Fonts.Bold} style={styles.accountTitle}>
        {t('profile.yourAccount') || 'Your account'}
      </CustomText>
      
      {user?.phone && (
        <CustomText variant="h6" fontFamily={Fonts.Medium} style={styles.phoneNumber}>
          {user.phone}
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
  },
  placeholderText: {
    color: '#fff',
  },
  accountTitle: {
    color: '#000',
    marginBottom: 8,
  },
  phoneNumber: {
    color: '#000',
    opacity: 0.8,
  },
});

export default ProfileHeader;

