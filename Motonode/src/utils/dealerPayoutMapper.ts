import type { BusinessProfile } from '@data/dealerData';
import type { IBusinessRegistration } from '@app-types/dealer';

export type DealerBankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  accountType: string;
  verified: boolean;
};

export type DealerUpiAccount = {
  id: string;
  upiId: string;
  appName: string;
  appColor: string;
  appInitial: string;
  isPrimary: boolean;
};

export function mapRegistrationToPayoutData(
  registration: IBusinessRegistration | null,
  profile: BusinessProfile | null,
): { bank: DealerBankAccount; upiAccounts: DealerUpiAccount[] } {
  const payout = registration?.payout;
  const isApproved = registration?.status?.toLowerCase() === 'approved';

  const bank: DealerBankAccount = {
    accountHolderName:
      payout?.bank?.accountName ||
      profile?.ownerName ||
      registration?.businessName ||
      '',
    bankName: profile?.bankName || '',
    accountNumber: payout?.bank?.accountNumber || profile?.accountNumber || '',
    ifscCode: (payout?.bank?.ifsc || profile?.ifsc || '').toUpperCase(),
    branch: '',
    accountType: 'Current Account',
    verified: isApproved,
  };

  const upiId = (payout?.upiId || profile?.upiId || '').trim();
  const upiAccounts: DealerUpiAccount[] = upiId
    ? [
        {
          id: 'registration-upi',
          upiId,
          appName: 'UPI',
          appColor: '#4F46E5',
          appInitial: upiId[0]?.toUpperCase() || 'U',
          isPrimary: true,
        },
      ]
    : [];

  return { bank, upiAccounts };
}

export function hasBankPayoutDetails(bank: DealerBankAccount): boolean {
  return Boolean(bank.accountNumber.trim() && bank.ifscCode.trim());
}
