import { Alert } from 'react-native';
import { useAuthStore } from '@state/authStore';
import { storage } from '@state/storage';
import { resetAndNavigate, replace, navigate } from '@utils/NavigationUtils';
import { resetNavigationForDealerOnboarding } from './postAuthRouting';
import {
  acceptLatestPolicy,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  ILoginResult,
} from '@service/authService';

const checkUserRole = (role: string | string[] | undefined): string | null => {
  if (!role) {
    return null;
  }
  const roleArray = Array.isArray(role) ? role : [role];
  if (roleArray.includes('admin')) {
    return 'admin';
  }
  if (roleArray.includes('dealer')) {
    return 'dealer';
  }
  if (roleArray.includes('user')) {
    return 'user';
  }
  return null;
};

/**
 * Shared post-login routing for email and phone OTP flows.
 */
export const navigateAfterCustomerAuth = async (
  loginResult?: ILoginResult,
): Promise<void> => {
  if (loginResult?.requiresPolicyAcceptance) {
    Alert.alert(
      'Policy Update Required',
      'Please review and accept the latest Terms of Use and Privacy Policy to continue.',
      [
        { text: 'View Terms', onPress: () => navigate('SignupPolicies', { initialTab: 'terms' }) },
        { text: 'View Privacy', onPress: () => navigate('SignupPolicies', { initialTab: 'privacy' }) },
        {
          text: 'Accept & Continue',
          onPress: async () => {
            await acceptLatestPolicy(
              loginResult.currentTermsVersion || CURRENT_TERMS_VERSION,
              loginResult.currentPrivacyVersion || CURRENT_PRIVACY_VERSION,
            );
          },
        },
      ],
    );
  }

  const currentUser = useAuthStore.getState().user;
  if (!currentUser?.role) {
    resetAndNavigate('AddUserVehicle');
    return;
  }

  const userRole = checkUserRole(currentUser.role);
  const userId = currentUser.id || currentUser._id;

  if (userRole === 'admin') {
    resetAndNavigate('MainTabs');
    return;
  }

  if (userRole === 'dealer' && userId) {
    await resetNavigationForDealerOnboarding();
    return;
  }

  if (userRole === 'user' && userId) {
    const hasSkippedVehicle = storage.getString('hasSkippedVehicle') === 'true';
    if (hasSkippedVehicle) {
      resetAndNavigate('MainTabs');
      return;
    }
    try {
      const { getUserVehicles } = await import('@service/vehicleService');
      const vehiclesData = await getUserVehicles();
      const hasVehicles =
        vehiclesData?.Response &&
        Array.isArray(vehiclesData.Response) &&
        vehiclesData.Response.length > 0;

      if (hasVehicles) {
        storage.delete('hasSkippedVehicle');
        resetAndNavigate('MainTabs');
      } else {
        await replace('AddUserVehicle', { fromLogin: true });
      }
    } catch {
      const hasSkippedVehicle = storage.getString('hasSkippedVehicle') === 'true';
      if (hasSkippedVehicle) {
        resetAndNavigate('MainTabs');
      } else {
        await replace('AddUserVehicle', { fromLogin: true });
      }
    }
    return;
  }

  const hasSkippedVehicle = storage.getString('hasSkippedVehicle') === 'true';
  if (hasSkippedVehicle) {
    resetAndNavigate('MainTabs');
  } else {
    resetAndNavigate('AddUserVehicle');
  }
};

export const extractAuthErrorMessage = (error: unknown): string => {
  const err = error as {
    response?: { data?: { Response?: { ReturnMessage?: string }; message?: string; error?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.Response?.ReturnMessage ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
};
