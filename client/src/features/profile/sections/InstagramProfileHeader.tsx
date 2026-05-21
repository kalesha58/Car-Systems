import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import React, { FC } from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import { useAuthStore } from '@state/authStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { shouldHidePhone, maskPhone } from '@utils/privacyUtils';
import type { IUserStats } from '@service/profileService';

interface InstagramProfileHeaderProps {
  stats?: IUserStats;
}

const InstagramProfileHeader: FC<InstagramProfileHeaderProps> = ({
  stats,
}) => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const posts = stats?.postsCount ?? 0;
  const vehicles = stats?.vehiclesCount ?? 0;
  const orders = stats?.ordersCount ?? 0;

  const getInitialLetter = (): string => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
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
      alignItems: 'flex-start',
      marginBottom: 14,
      gap: 16,
    },
    profileImageContainer: {
      width: 86,
      height: 86,
      borderRadius: 43,
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
      borderRadius: 41,
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
      borderRadius: 41,
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
    statsBlock: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: RFValue(17),
      fontFamily: Fonts.Bold,
      color: colors.text,
    },
    statLabel: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
      marginTop: 2,
    },
    userName: {
      fontSize: RFValue(17),
      fontFamily: Fonts.Bold,
      color: colors.text,
      marginBottom: 6,
    },
    bioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 6,
    },
    bioText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Medium,
      color: colors.textSecondary,
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

        <View style={styles.statsBlock}>
          <View style={styles.statCell}>
            <CustomText style={styles.statNumber}>{posts}</CustomText>
            <CustomText style={styles.statLabel} numberOfLines={1}>
              {t('profile.statPosts')}
            </CustomText>
          </View>
          <View style={styles.statCell}>
            <CustomText style={styles.statNumber}>{vehicles}</CustomText>
            <CustomText style={styles.statLabel} numberOfLines={1}>
              {t('profile.statVehicles')}
            </CustomText>
          </View>
          <View style={styles.statCell}>
            <CustomText style={styles.statNumber}>{orders}</CustomText>
            <CustomText style={styles.statLabel} numberOfLines={1}>
              {t('profile.statOrders')}
            </CustomText>
          </View>
        </View>
      </View>

      <CustomText style={styles.userName}>{user?.name || 'User'}</CustomText>
      {user?.phone && !shouldHidePhone() && (
        <View style={styles.bioItem}>
          <Icon name="call-outline" size={RFValue(14)} color={colors.textSecondary} />
          <CustomText style={styles.bioText}>{maskPhone(user.phone)}</CustomText>
        </View>
      )}
      {user?.email && (
        <View style={styles.bioItem}>
          <Icon name="mail-outline" size={RFValue(14)} color={colors.textSecondary} />
          <CustomText style={styles.bioText} numberOfLines={1}>
            {user.email}
          </CustomText>
        </View>
      )}
    </View>
  );
};

export default InstagramProfileHeader;
