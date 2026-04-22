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
import { shouldHidePhone, shouldHideEmail, maskPhone, maskEmail } from '@utils/privacyUtils';

interface InstagramProfileHeaderProps {
  postsCount?: number;
  vehiclesCount: number;
  ordersCount: number;
  isDealer?: boolean;
}

const InstagramProfileHeader: FC<InstagramProfileHeaderProps> = ({
  postsCount,
  vehiclesCount,
  ordersCount,
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
    // Share functionality - can be implemented with react-native-share or Linking
    // For now, just a placeholder
    console.log('Share profile');
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      backgroundColor: colors.background,
    },
    topSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    profileImageContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      padding: 3, // Space for the ring
      backgroundColor: isDark ? colors.border : '#F0F0F0', // Outer ring
      marginRight: 20,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    profileImageInner: {
      width: '100%',
      height: '100%',
      borderRadius: 42,
      borderWidth: 2,
      borderColor: colors.background, // Inner spacer ring
      overflow: 'hidden',
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 42,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },
    placeholderText: {
      color: colors.secondary,
      fontSize: RFValue(34),
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    statsWrapper: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statDivider: {
      width: 1,
      height: '60%',
      backgroundColor: colors.border,
      opacity: 0.3,
    },
    statNumber: {
      fontSize: RFValue(15),
      fontFamily: Fonts.Bold,
      color: colors.text,
    },
    statLabel: {
      fontSize: RFValue(9),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoSection: {
      marginBottom: 16,
    },
    userName: {
      fontSize: RFValue(16),
      fontFamily: Fonts.Bold,
      color: colors.text,
      marginBottom: 6,
    },
    bioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    bioText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 12,
    },
    primaryButton: {
      flex: 1.5,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.secondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    primaryButtonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: colors.white,
    },
    secondaryButton: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
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

        <View style={styles.statsWrapper}>
          <View style={styles.statsContainer}>
            {!isDealer && postsCount !== undefined && (
              <>
                <View style={styles.statItem}>
                  <CustomText style={styles.statNumber}>{postsCount}</CustomText>
                  <CustomText style={styles.statLabel}>{t('profile.posts')}</CustomText>
                </View>
                <View style={styles.statDivider} />
              </>
            )}
            <View style={styles.statItem}>
              <CustomText style={styles.statNumber}>{vehiclesCount}</CustomText>
              <CustomText style={styles.statLabel}>{t('profile.vehicles')}</CustomText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CustomText style={styles.statNumber}>{ordersCount}</CustomText>
              <CustomText style={styles.statLabel}>{t('profile.orders')}</CustomText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <CustomText style={styles.userName}>{user?.name || 'User'}</CustomText>
        {user?.email && !shouldHideEmail() && (
          <View style={styles.bioItem}>
            <Icon name="mail-outline" size={RFValue(12)} color={colors.textSecondary} />
            <CustomText style={styles.bioText}>{maskEmail(user.email)}</CustomText>
          </View>
        )}
        {user?.phone && !shouldHidePhone() && (
          <View style={styles.bioItem}>
            <Icon name="call-outline" size={RFValue(12)} color={colors.textSecondary} />
            <CustomText style={styles.bioText}>{maskPhone(user.phone)}</CustomText>
          </View>
        )}
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

