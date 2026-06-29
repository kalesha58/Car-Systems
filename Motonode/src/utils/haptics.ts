import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export function lightHaptic(): void {
  ReactNativeHapticFeedback.trigger('impactLight', options);
}

export function mediumHaptic(): void {
  ReactNativeHapticFeedback.trigger('impactMedium', options);
}

export function successHaptic(): void {
  ReactNativeHapticFeedback.trigger('notificationSuccess', options);
}

export function selectionHaptic(): void {
  ReactNativeHapticFeedback.trigger('selection', options);
}
