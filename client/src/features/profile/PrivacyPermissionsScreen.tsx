import React, { FC, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Switch, Platform, PermissionsAndroid } from 'react-native';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import ProfileMenuItem from './sections/ProfileMenuItem';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { useToast } from '@hooks/useToast';
import { requestNotificationPermission } from '@service/notificationService';
import { requestLocationPermission } from '@utils/addressUtils';
import { getPrivacySettings, updatePrivacySettings, IPrivacySettings } from '@service/profileService';
import { defaultPrivacySettings } from '@utils/privacyUtils';

const PrivacyPermissionsScreen: FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, setUser } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [privacySettings, setPrivacySettings] = useState<IPrivacySettings>(
    user?.privacySettings || defaultPrivacySettings,
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [permissions, setPermissions] = useState({
    storage: false,
    notification: false,
    location: false,
    camera: false,
    microphone: false,
  });

  useEffect(() => {
    checkPermissions();
    loadPrivacySettings();
  }, []);

  useEffect(() => {
    if (user?.privacySettings) {
      setPrivacySettings(user.privacySettings);
    }
  }, [user?.privacySettings]);

  const loadPrivacySettings = async () => {
    try {
      setIsLoadingSettings(true);
      const settings = await getPrivacySettings();
      setPrivacySettings(settings);
      if (user) {
        setUser({ ...user, privacySettings: settings });
      }
    } catch (error) {
      setPrivacySettings(defaultPrivacySettings);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const storageGranted =
          Platform.Version >= 33
            ? true
            : await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);

        const notificationGranted =
          Platform.Version >= 33
            ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
            : true;

        const locationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        const cameraGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );

        const microphoneGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );

        setPermissions({
          storage: storageGranted,
          notification: notificationGranted,
          location: locationGranted,
          camera: cameraGranted,
          microphone: microphoneGranted,
        });
      } catch (error) {
        // Keep defaults if permission checks fail.
      }
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          setPermissions(prev => ({ ...prev, storage: true }));
          return true;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'Car Connect needs access to your storage to select images and files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissions(prev => ({ ...prev, storage: isGranted }));
        return isGranted;
      } catch (error) {
        return false;
      }
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Car Connect needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissions(prev => ({ ...prev, camera: isGranted }));
        return isGranted;
      } catch (error) {
        return false;
      }
    }
    return true;
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Car Connect needs access to your microphone for voice features.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissions(prev => ({ ...prev, microphone: isGranted }));
        return isGranted;
      } catch (error) {
        return false;
      }
    }
    return true;
  };

  const handlePermissionRequest = async (
    type: 'storage' | 'notification' | 'location' | 'camera' | 'microphone',
  ) => {
    try {
      let granted = false;

      switch (type) {
        case 'storage':
          granted = await requestStoragePermission();
          break;
        case 'notification':
          granted = await requestNotificationPermission();
          setPermissions(prev => ({ ...prev, notification: granted }));
          break;
        case 'location':
          granted = await requestLocationPermission();
          setPermissions(prev => ({ ...prev, location: granted }));
          break;
        case 'camera':
          granted = await requestCameraPermission();
          break;
        case 'microphone':
          granted = await requestMicrophonePermission();
          break;
      }

      if (granted) {
        showSuccess(t('profile.permissionGranted') || 'Permission granted');
      } else {
        showError(t('profile.permissionDenied') || 'Permission denied');
      }
    } catch (error) {
      showError(t('profile.permissionError') || 'Error requesting permission');
    }
  };

  const handlePrivacyToggle = useCallback(async (field: keyof IPrivacySettings) => {
    if (isSavingSettings) return;

    const previousSettings = { ...privacySettings };
    const newSettings = { ...privacySettings, [field]: !privacySettings[field] };

    if (field === 'isPrivate' && newSettings.isPrivate) {
      newSettings.hideVehicleNumber = true;
    }
    if (field === 'isPrivate' && !newSettings.isPrivate) {
      newSettings.hideVehicleNumber = false;
    }

    setPrivacySettings(newSettings);
    if (user) {
      setUser({ ...user, privacySettings: newSettings });
    }

    try {
      setIsSavingSettings(true);
      const savedSettings = await updatePrivacySettings(newSettings);
      setPrivacySettings(savedSettings);
      if (user) {
        setUser({ ...user, privacySettings: savedSettings });
      }
      showSuccess(t('profile.privacySettingsUpdated') || 'Privacy settings updated');
    } catch (error) {
      setPrivacySettings(previousSettings);
      if (user) {
        setUser({ ...user, privacySettings: previousSettings });
      }
      showError(
        error instanceof Error
          ? error.message
          : t('profile.failedToUpdatePrivacy') || 'Failed to update privacy settings',
      );
    } finally {
      setIsSavingSettings(false);
    }
  }, [privacySettings, isSavingSettings, user, setUser, t, showSuccess, showError]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      fontSize: RFValue(13),
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      marginBottom: 16,
    },
    permissionStatus: {
      fontSize: RFValue(11),
      color: colors.textSecondary,
      marginLeft: 8,
    },
  });

  const privacyMenuItems = [
    {
      icon: 'lock-closed-outline',
      label: t('profile.privateProfile') || 'Private Profile',
      rightComponent: (
        <Switch
          value={privacySettings.isPrivate}
          onValueChange={() => handlePrivacyToggle('isPrivate')}
          disabled={isSavingSettings || isLoadingSettings}
          trackColor={{ false: '#E5E7EB', true: colors.secondary }}
          thumbColor={colors.white}
          ios_backgroundColor="#E5E7EB"
        />
      ),
    },
    {
      icon: 'call-outline',
      label: t('profile.hidePhoneNumber') || 'Hide Phone Number',
      rightComponent: (
        <Switch
          value={privacySettings.hidePhone}
          onValueChange={() => handlePrivacyToggle('hidePhone')}
          disabled={isSavingSettings || isLoadingSettings}
          trackColor={{ false: '#E5E7EB', true: colors.secondary }}
          thumbColor={colors.white}
          ios_backgroundColor="#E5E7EB"
        />
      ),
    },
    {
      icon: 'mail-outline',
      label: t('profile.hideEmail') || 'Hide Email',
      rightComponent: (
        <Switch
          value={privacySettings.hideEmail}
          onValueChange={() => handlePrivacyToggle('hideEmail')}
          disabled={isSavingSettings || isLoadingSettings}
          trackColor={{ false: '#E5E7EB', true: colors.secondary }}
          thumbColor={colors.white}
          ios_backgroundColor="#E5E7EB"
        />
      ),
    },
  ];

  if (privacySettings.isPrivate) {
    privacyMenuItems.push({
      icon: 'car-outline',
      label: t('profile.hideVehicleNumber') || 'Hide Vehicle Number',
      rightComponent: (
        <Switch
          value={privacySettings.hideVehicleNumber}
          onValueChange={() => handlePrivacyToggle('hideVehicleNumber')}
          disabled={isSavingSettings || isLoadingSettings}
          trackColor={{ false: '#E5E7EB', true: colors.secondary }}
          thumbColor={colors.white}
          ios_backgroundColor="#E5E7EB"
        />
      ),
    });
  }

  const permissionMenuItems = [
    {
      icon: 'folder-outline',
      label: t('profile.storagePermission') || 'Storage Permission',
      type: 'storage' as const,
      status: permissions.storage,
    },
    {
      icon: 'notifications-outline',
      label: t('profile.notificationPermission') || 'Notification Permission',
      type: 'notification' as const,
      status: permissions.notification,
    },
    {
      icon: 'location-outline',
      label: t('profile.locationPermission') || 'Location Permission',
      type: 'location' as const,
      status: permissions.location,
    },
    {
      icon: 'camera-outline',
      label: t('profile.cameraPermission') || 'Camera Permission',
      type: 'camera' as const,
      status: permissions.camera,
    },
    {
      icon: 'mic-outline',
      label: t('profile.microphonePermission') || 'Microphone Permission',
      type: 'microphone' as const,
      status: permissions.microphone,
    },
  ];

  return (
    <View style={styles.container}>
      <CustomHeader title={t('profile.privacyPermissions') || 'Privacy & Permissions'} />
      <View style={styles.content}>
        <CustomText variant="h8" fontFamily={Fonts.Bold} style={styles.sectionTitle}>
          {t('profile.privacyCenter') || 'PRIVACY'}
        </CustomText>
        <View style={styles.menuContainer}>
          {privacyMenuItems.map((item, index) => (
            <ProfileMenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              rightComponent={item.rightComponent}
              showChevron={false}
              isLast={index === privacyMenuItems.length - 1}
            />
          ))}
        </View>

        <CustomText variant="h8" fontFamily={Fonts.Bold} style={styles.sectionTitle}>
          {t('profile.permissions') || 'PERMISSIONS'}
        </CustomText>
        <View style={styles.menuContainer}>
          {permissionMenuItems.map((item, index) => (
            <ProfileMenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() => handlePermissionRequest(item.type)}
              rightComponent={(
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CustomText style={styles.permissionStatus}>
                    {item.status ? t('profile.granted') : t('profile.notGranted')}
                  </CustomText>
                </View>
              )}
              showChevron
              isLast={index === permissionMenuItems.length - 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default PrivacyPermissionsScreen;
