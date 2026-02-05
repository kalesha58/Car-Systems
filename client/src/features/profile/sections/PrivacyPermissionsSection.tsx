import { View, StyleSheet, Switch, TouchableOpacity, Platform, PermissionsAndroid, Alert } from 'react-native';
import React, { FC, useState, useEffect, useCallback } from 'react';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import ProfileMenuItem from './ProfileMenuItem';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { useToast } from '@hooks/useToast';
import { requestNotificationPermission } from '@service/notificationService';
import { requestLocationPermission } from '@utils/addressUtils';
import { getPrivacySettings, updatePrivacySettings, IPrivacySettings } from '@service/profileService';
import { defaultPrivacySettings } from '@utils/privacyUtils';

const PrivacyPermissionsSection: FC = () => {
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
    // Update local state when user privacy settings change
    if (user?.privacySettings) {
      setPrivacySettings(user.privacySettings);
    }
  }, [user?.privacySettings]);

  const loadPrivacySettings = async () => {
    try {
      setIsLoadingSettings(true);
      const settings = await getPrivacySettings();
      setPrivacySettings(settings);
      
      // Update user in auth store
      if (user) {
        setUser({ ...user, privacySettings: settings });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      // Use default settings on error
      setPrivacySettings(defaultPrivacySettings);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const storageGranted = await PermissionsAndroid.check(
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        
        const notificationGranted = Platform.Version >= 33
          ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
          : true;
        
        const locationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        
        const cameraGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );

        setPermissions({
          storage: storageGranted,
          notification: notificationGranted,
          location: locationGranted,
          camera: cameraGranted,
          microphone: false, // Microphone permission check not available in PermissionsAndroid
        });
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    } else {
      // iOS permissions are typically checked when requested
      setPermissions({
        storage: false,
        notification: false,
        location: false,
        camera: false,
        microphone: false,
      });
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        let permission;
        if (Platform.Version >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        } else {
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Storage Permission',
          message: 'Car Connect needs access to your storage to select images and files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissions(prev => ({ ...prev, storage: isGranted }));
        return isGranted;
      } catch (error) {
        console.error('Error requesting storage permission:', error);
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
        console.error('Error requesting camera permission:', error);
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
        console.error('Error requesting microphone permission:', error);
        return false;
      }
    }
    return true;
  };

  const handlePermissionRequest = async (type: 'storage' | 'notification' | 'location' | 'camera' | 'microphone') => {
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
    
    // If setting to private, automatically hide vehicle number
    if (field === 'isPrivate' && newSettings.isPrivate) {
      newSettings.hideVehicleNumber = true;
    }
    
    // If setting to public, show vehicle number
    if (field === 'isPrivate' && !newSettings.isPrivate) {
      newSettings.hideVehicleNumber = false;
    }
    
    // Optimistically update UI
    setPrivacySettings(newSettings);
    
    // Update user in auth store immediately
    if (user) {
      setUser({ ...user, privacySettings: newSettings });
    }

    try {
      setIsSavingSettings(true);
      const savedSettings = await updatePrivacySettings(newSettings);
      
      // Update with saved settings from server
      setPrivacySettings(savedSettings);
      if (user) {
        setUser({ ...user, privacySettings: savedSettings });
      }
      
      showSuccess(t('profile.privacySettingsUpdated') || 'Privacy settings updated');
    } catch (error) {
      // Revert on error
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
      marginBottom: 24,
      paddingHorizontal: 16,
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
    },
    permissionStatus: {
      fontSize: RFValue(11),
      color: colors.textSecondary,
      marginLeft: 8,
    },
  });

  const menuItems = [];

  // Privacy Settings
  menuItems.push({
    icon: 'lock-closed-outline',
    label: t('profile.privateProfile') || 'Private Profile',
    onPress: undefined,
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
    showChevron: false,
  });

  menuItems.push({
    icon: 'call-outline',
    label: t('profile.hidePhoneNumber') || 'Hide Phone Number',
    onPress: undefined,
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
    showChevron: false,
  });

  menuItems.push({
    icon: 'mail-outline',
    label: t('profile.hideEmail') || 'Hide Email',
    onPress: undefined,
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
    showChevron: false,
  });

  if (privacySettings.isPrivate) {
    menuItems.push({
      icon: 'car-outline',
      label: t('profile.hideVehicleNumber') || 'Hide Vehicle Number',
      onPress: undefined,
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
      showChevron: false,
    });
  }

  // Permissions
  menuItems.push({
    icon: 'folder-outline',
    label: t('profile.storagePermission') || 'Storage Permission',
    onPress: () => handlePermissionRequest('storage'),
    rightComponent: (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CustomText style={styles.permissionStatus}>
          {permissions.storage ? t('profile.granted') : t('profile.notGranted')}
        </CustomText>
      </View>
    ),
    showChevron: true,
  });

  menuItems.push({
    icon: 'notifications-outline',
    label: t('profile.notificationPermission') || 'Notification Permission',
    onPress: () => handlePermissionRequest('notification'),
    rightComponent: (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CustomText style={styles.permissionStatus}>
          {permissions.notification ? t('profile.granted') : t('profile.notGranted')}
        </CustomText>
      </View>
    ),
    showChevron: true,
  });

  menuItems.push({
    icon: 'location-outline',
    label: t('profile.locationPermission') || 'Location Permission',
    onPress: () => handlePermissionRequest('location'),
    rightComponent: (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CustomText style={styles.permissionStatus}>
          {permissions.location ? t('profile.granted') : t('profile.notGranted')}
        </CustomText>
      </View>
    ),
    showChevron: true,
  });

  menuItems.push({
    icon: 'camera-outline',
    label: t('profile.cameraPermission') || 'Camera Permission',
    onPress: () => handlePermissionRequest('camera'),
    rightComponent: (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CustomText style={styles.permissionStatus}>
          {permissions.camera ? t('profile.granted') : t('profile.notGranted')}
        </CustomText>
      </View>
    ),
    showChevron: true,
  });

  menuItems.push({
    icon: 'mic-outline',
    label: t('profile.microphonePermission') || 'Microphone Permission',
    onPress: () => handlePermissionRequest('microphone'),
    rightComponent: (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CustomText style={styles.permissionStatus}>
          {permissions.microphone ? t('profile.granted') : t('profile.notGranted')}
        </CustomText>
      </View>
    ),
    showChevron: true,
  });

  return (
    <View style={styles.container}>
      <CustomText variant="h8" fontFamily={Fonts.Bold} style={styles.sectionTitle}>
        {t('profile.privacyPermissions') || 'PRIVACY & PERMISSIONS'}
      </CustomText>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <ProfileMenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
            rightComponent={item.rightComponent}
            showChevron={item.showChevron !== false}
            isLast={index === menuItems.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

export default PrivacyPermissionsSection;
