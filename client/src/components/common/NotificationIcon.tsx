import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts, MIN_TOUCH_TARGET } from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@hooks/useTheme';
import { getUnreadNotificationCount } from '@service/notificationService';
import { hasAuthenticatedSession } from '@service/authService';
import { useAuthStore } from '@state/authStore';
import CustomText from '@components/ui/CustomText';

interface NotificationIconProps {
  onPress?: () => void;
  color?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ onPress, color }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!hasAuthenticatedSession()) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasAuthenticatedSession()) {
        setUnreadCount(0);
        return;
      }
      loadUnreadCount();
    }, [loadUnreadCount]),
  );

  useEffect(() => {
    if (!hasAuthenticatedSession()) {
      setUnreadCount(0);
      return;
    }
    loadUnreadCount();
    const interval = setInterval(() => {
      if (!hasAuthenticatedSession()) {
        setUnreadCount(0);
        return;
      }
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount, user]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      (navigation as any).navigate('NotificationScreen');
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      marginRight: 8,
    },
    iconButton: {
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
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
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.iconButton} activeOpacity={0.7} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Icon name="notifications-outline" size={RFValue(24)} color={color || colors.text} />
      </TouchableOpacity>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <CustomText style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </CustomText>
        </View>
      )}
    </View>
  );
};

export default NotificationIcon;
