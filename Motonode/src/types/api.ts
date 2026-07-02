export type SignupRole = 'user' | 'dealer';

export type ServerRole = 'user' | 'dealer' | 'admin' | 'guest';

export interface ServerUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: ServerRole | ServerRole[];
  profileImage?: string;
  address?: string;
  phoneVerified?: boolean;
}

export interface LoginResult {
  user: ServerUser;
  requiresPolicyAcceptance?: boolean;
  currentTermsVersion?: string;
  currentPrivacyVersion?: string;
}

export type DealerOnboardingStatus = 'pending' | 'approved' | 'rejected' | null;

export interface DealerOnboardingSnapshot {
  hasRegistration: boolean;
  status: DealerOnboardingStatus;
  registrationId: string | null;
  businessName: string | null;
  businessType: string | null;
  submittedAt: string | null;
}

export type DealerOnboardingDestination = 'DealerType' | 'BusinessRegistration' | 'DealerTabs';
