import React, {FC, useState, useEffect, useCallback, useMemo} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getUnreadNotificationCount} from '@service/notificationService';

interface IWelcomeHeaderProps {
  businessName: string;
  onMessagePress: () => void;
  hasNotifications?: boolean;
}

const WelcomeHeader: FC<IWelcomeHeaderProps> = ({
  businessName,
  onMessagePress,
  hasNotifications,
}) => {
  const {colors, isDark} = useTheme();
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount]),
  );

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const handleNotificationPress = () => {
    (navigation as any).navigate('NotificationScreen');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    leftSection: {
      flex: 1,
    },
    greeting: {
      fontSize: RFValue(12),
      color: colors.textSecondary,
      marginBottom: 4,
    },
    businessName: {
      fontSize: RFValue(20),
      fontWeight: '700',
      color: colors.text,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'visible',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'visible',
      ...(isDark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }),
    },
    messageButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      ...(isDark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }),
    },
    notificationBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.error,
      borderWidth: 2,
      borderColor: colors.cardBackground,
    },
    notificationBadgeCount: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: colors.cardBackground,
    },
    badgeText: {
      color: colors.white,
      fontSize: RFValue(10),
      fontFamily: Fonts.SemiBold,
    },
  }), [colors, isDark]);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <CustomText variant="h8" style={styles.greeting}>
          Welcome back!
        </CustomText>
        <CustomText variant="h2" fontFamily={Fonts.Bold} style={styles.businessName}>
          {businessName}
        </CustomText>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={[styles.iconButton, { marginRight: 8 }]} 
          onPress={handleNotificationPress} 
          activeOpacity={0.7}
          testID="notification-icon-button">
          <IconIonicons 
            name="notifications-outline" 
            size={20} 
            color={colors.text} 
          />
          {unreadCount > 0 && (
            <View style={styles.notificationBadgeCount}>
              <CustomText style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </CustomText>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton} onPress={onMessagePress} activeOpacity={0.7}>
          <Icon name="message-circle" size={20} color={colors.text} />
          {hasNotifications && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeHeader;

