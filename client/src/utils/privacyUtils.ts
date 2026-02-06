import { useAuthStore } from '@state/authStore';
import { IPrivacySettings } from '@service/profileService';

/**
 * Default privacy settings
 */
export const defaultPrivacySettings: IPrivacySettings = {
  isPrivate: false,
  hidePhone: false,
  hideEmail: false,
  hideVehicleNumber: false,
};

/**
 * Check if phone number should be hidden
 */
export const shouldHidePhone = (): boolean => {
  const { user } = useAuthStore.getState();
  return user?.privacySettings?.hidePhone === true;
};

/**
 * Check if email should be hidden
 */
export const shouldHideEmail = (): boolean => {
  const { user } = useAuthStore.getState();
  return user?.privacySettings?.hideEmail === true;
};

/**
 * Check if vehicle number should be hidden
 */
export const shouldHideVehicleNumber = (): boolean => {
  const { user } = useAuthStore.getState();
  return (
    user?.privacySettings?.isPrivate === true &&
    user?.privacySettings?.hideVehicleNumber === true
  );
};

/**
 * Check if profile is private
 */
export const isProfilePrivate = (): boolean => {
  const { user } = useAuthStore.getState();
  return user?.privacySettings?.isPrivate === true;
};

/**
 * Mask phone number (shows last 4 digits)
 */
export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  if (shouldHidePhone()) {
    return phone.replace(/\d(?=\d{4})/g, '*'); // Shows last 4 digits
  }
  return phone;
};

/**
 * Mask email (shows first character and domain)
 */
export const maskEmail = (email: string): string => {
  if (!email) return '';
  if (shouldHideEmail()) {
    const [local, domain] = email.split('@');
    if (local && domain) {
      return `${local[0]}***@${domain}`;
    }
    return email;
  }
  return email;
};

/**
 * Mask vehicle number plate
 */
export const maskVehicleNumber = (numberPlate: string): string => {
  if (!numberPlate) return '';
  if (shouldHideVehicleNumber()) {
    // Show only last 2 characters
    return numberPlate.replace(/.(?=.{2})/g, '*');
  }
  return numberPlate;
};
