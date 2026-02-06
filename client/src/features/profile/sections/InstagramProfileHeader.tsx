import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, {FC} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useAuthStore} from '@state/authStore';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';
import {navigate} from '@utils/NavigationUtils';
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
  const {user} = useAuthStore();
  const {t} = useTranslation();
  const {colors, isDark} = useTheme();

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
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
    },
    topSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    profileImageContainer: {
      width: 86,
      height: 86,
      borderRadius: 43,
      position: 'relative',
      overflow: 'hidden',
      marginRight: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: isDark ? colors.border : '#DBDBDB',
    },
    profileImage: {
      width: '100%',
      height: '100%',
      borderRadius: 43,
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 43,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },
    placeholderText: {
      color: colors.textSecondary,
      fontSize: RFValue(32),
    },
    statsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: RFValue(16),
      fontFamily: Fonts.Bold,
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
    },
    infoSection: {
      marginBottom: 12,
    },
    userName: {
      fontSize: RFValue(14),
      fontFamily: Fonts.Bold,
      color: colors.text,
      marginBottom: 4,
    },
    bioText: {
      fontSize: RFValue(13),
      fontFamily: Fonts.Regular,
      color: colors.text,
      lineHeight: RFValue(18),
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    actionButton: {
      flex: 1,
      height: 32,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#DBDBDB',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? colors.cardBackground : colors.white,
    },
    actionButtonText: {
      fontSize: RFValue(13),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.profileImageContainer}>
          {user?.profileImage ? (
            <Image
              source={{uri: user.profileImage}}
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
        
        <View style={styles.statsContainer}>
          {!isDealer && postsCount !== undefined && (
            <View style={styles.statItem}>
              <CustomText style={styles.statNumber}>{postsCount}</CustomText>
              <CustomText style={styles.statLabel}>Posts</CustomText>
            </View>
          )}
          <View style={styles.statItem}>
            <CustomText style={styles.statNumber}>{vehiclesCount}</CustomText>
            <CustomText style={styles.statLabel}>Vehicles</CustomText>
          </View>
          <View style={styles.statItem}>
            <CustomText style={styles.statNumber}>{ordersCount}</CustomText>
            <CustomText style={styles.statLabel}>Orders</CustomText>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <CustomText style={styles.userName}>{user?.name || 'User'}</CustomText>
        {user?.email && !shouldHideEmail() && (
          <CustomText style={styles.bioText}>{maskEmail(user.email)}</CustomText>
        )}
        {user?.phone && !shouldHidePhone() && (
          <CustomText style={styles.bioText}>{maskPhone(user.phone)}</CustomText>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEditProfile}
          activeOpacity={0.7}>
          <CustomText style={styles.actionButtonText}>Edit profile</CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShareProfile}
          activeOpacity={0.7}>
          <CustomText style={styles.actionButtonText}>Share profile</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InstagramProfileHeader;

