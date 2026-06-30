import { Alert } from 'react-native';

import type { DealerOnboardingStatus } from '../types/api';

export function getRegistrationStatusMessage(status: DealerOnboardingStatus): string {
  if (status === 'pending') {
    return 'Your business registration is pending approval. Inventory and dealer features will be available once approved.';
  }
  if (status === 'rejected') {
    return 'Your business registration was rejected. Please update your registration to try again.';
  }
  if (status === null || status === undefined) {
    return 'Please complete business registration to access inventory.';
  }
  return 'Business registration must be approved before you can manage inventory.';
}

export function showRegistrationBlockedAlert(
  status: DealerOnboardingStatus,
  options?: { onViewRegistration?: () => void },
): void {
  const message = getRegistrationStatusMessage(status);
  const buttons: Array<{ text: string; style?: 'cancel' | 'default'; onPress?: () => void }> = [
    { text: 'OK', style: 'cancel' },
  ];

  if (options?.onViewRegistration && (status === 'rejected' || status === null)) {
    buttons.unshift({
      text: 'View Registration',
      onPress: options.onViewRegistration,
    });
  }

  Alert.alert(
    status === 'pending' ? 'Registration Pending' : 'Registration Required',
    message,
    buttons,
  );
}
