import React, { FC, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import { updateStoreStatus, getBusinessRegistrationByUserId, IBusinessRegistration } from '@service/dealerService';
import { useTranslation } from 'react-i18next';
import { useToast } from '@hooks/useToast';
import { useAuthStore } from '@state/authStore';

interface StationOpenToggleProps {
  label?: string;
  icon?: string;
}

const StationOpenToggle: FC<StationOpenToggleProps> = ({ 
  label = 'Station Open',
  icon = 'storefront-outline',
}) => {
  const { colors: theme } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const { user } = useAuthStore();
  const [businessRegistration, setBusinessRegistration] = useState<IBusinessRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchBusinessRegistration = async () => {
      if (!user?.id) return;
      try {
        const registration = await getBusinessRegistrationByUserId(user.id);
        setBusinessRegistration(registration);
      } catch (error) {
        console.error('Error fetching business registration:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessRegistration();
  }, [user?.id]);

  const handleToggle = async () => {
    if (!businessRegistration) return;
    
    try {
      setUpdating(true);
      const newStatus = !businessRegistration.storeOpen;
      await updateStoreStatus(businessRegistration.id, { storeOpen: newStatus });
      setBusinessRegistration({ ...businessRegistration, storeOpen: newStatus });
      showSuccess(
        newStatus 
          ? (t('dealer.stationOpened') || 'Station opened')
          : (t('dealer.stationClosed') || 'Station closed')
      );
    } catch (error: any) {
      showError(error?.response?.data?.message || t('dealer.failedToUpdateStatus') || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border || 'transparent',
    },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: businessRegistration?.storeOpen ? theme.success + '20' : theme.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
    },
    label: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: theme.text,
      marginBottom: 2,
    },
    status: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
    },
    toggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: businessRegistration?.storeOpen ? theme.success : theme.backgroundSecondary,
      justifyContent: 'center',
      alignItems: businessRegistration?.storeOpen ? 'flex-end' : 'flex-start',
      paddingHorizontal: 3,
    },
    toggleCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.white || '#FFFFFF',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.success} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleToggle}
      disabled={updating}
      activeOpacity={0.7}>
      <View style={styles.leftContainer}>
        <View style={styles.iconContainer}>
          <IconIonicons name={icon} size={RFValue(20)} color={businessRegistration?.storeOpen ? theme.success : theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <CustomText style={styles.label}>
            {label}
          </CustomText>
          <CustomText style={styles.status}>
            {businessRegistration?.storeOpen 
              ? (t('dealer.open') || 'Open')
              : (t('dealer.closed') || 'Closed')}
          </CustomText>
        </View>
      </View>
      {updating ? (
        <ActivityIndicator size="small" color={businessRegistration?.storeOpen ? theme.success : theme.primary} />
      ) : (
        <View style={styles.toggle}>
          <View style={styles.toggleCircle} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default StationOpenToggle;
