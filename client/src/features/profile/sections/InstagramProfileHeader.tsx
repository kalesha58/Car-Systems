import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, { FC } from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import { useAuthStore } from '@state/authStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { navigate } from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import { shouldHidePhone, maskPhone } from '@utils/privacyUtils';

interface InstagramProfileHeaderProps {
  isDealer?: boolean;
}

const InstagramProfileHeader: FC<InstagramProfileHeaderProps> = ({
  isDealer = false,
}) => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const getInitialLetter = (): string => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleEditProfile = () => {
    navigate('EditProfile');
  };

  const handleShareProfile = () => {
    console.log('Share profile');
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: colors.background,
    },
    topSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 16,
    },
    profileImageContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      padding: 2,
      backgroundColor: isDark ? colors.border : '#F0F0F0',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    profileImageInner: {
      width: '100%',
      height: '100%',
      borderRadius: 38,
      borderWidth: 2,
      borderColor: colors.background,
      overflow: 'hidden',
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 38,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },
    placeholderText: {
      color: colors.secondary,
      fontSize: RFValue(30),
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    infoSection: {
      flex: 1,
      justifyContent: 'center',
    },
    userName: {
      fontSize: RFValue(18),
      fontFamily: Fonts.Bold,
      color: colors.text,
      marginBottom: 4,
    },
    bioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
      gap: 6,
    },
    bioText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 10,
    },
    primaryButton: {
      flex: 1,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: colors.white,
    },
    secondaryButton: {
      flex: 1,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageInner}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <CustomText variant="h2" fontFamily={Fonts.Bold} style={styles.placeholderText}>
                  {getInitialLetter()}
                </CustomText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <CustomText style={styles.userName}>{user?.name || 'User'}</CustomText>
          {user?.phone && !shouldHidePhone() && (
            <View style={styles.bioItem}>
              <Icon name="call-outline" size={RFValue(12)} color={colors.textSecondary} />
              <CustomText style={styles.bioText}>{maskPhone(user.phone)}</CustomText>
            </View>
          )}
          {user?.email && (
            <View style={styles.bioItem}>
              <Icon name="mail-outline" size={RFValue(12)} color={colors.textSecondary} />
              <CustomText style={styles.bioText} numberOfLines={1}>{user.email}</CustomText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleEditProfile}
          activeOpacity={0.8}>
          <CustomText style={styles.primaryButtonText}>{t('profile.editProfile')}</CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleShareProfile}
          activeOpacity={0.7}>
          <CustomText style={styles.secondaryButtonText}>{t('profile.shareProfile')}</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InstagramProfileHeader;
