import { Dealer, IPayoutCredentials } from '../../models/Dealer';
import { SignUp } from '../../models/SignUp';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IUpdatePayoutRequest {
  type: 'UPI' | 'BANK';
  upiId?: string;
  bank?: {
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}

/**
 * Validate UPI ID format
 */
const validateUPIId = (upiId: string): boolean => {
  // UPI ID format: username@paymentprovider (e.g., user@paytm, user@ybl)
  const upiRegex = /^[\w.-]+@[\w]+$/;
  return upiRegex.test(upiId);
};

/**
 * Validate IFSC code format
 */
const validateIFSC = (ifsc: string): boolean => {
  // IFSC format: 4 letters, 0, 6 alphanumeric (e.g., HDFC0001234)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.toUpperCase());
};

/**
 * Validate bank account number
 */
const validateAccountNumber = (accountNumber: string): boolean => {
  // Account number should be 9-18 digits
  const accountRegex = /^[0-9]{9,18}$/;
  return accountRegex.test(accountNumber);
};

/**
 * Update dealer payout credentials
 */
export const updateDealerPayout = async (
  userId: string,
  data: IUpdatePayoutRequest,
): Promise<IPayoutCredentials> => {
  try {
    // Find dealer by userId (assuming dealer has userId field or we need to find by email)
    // First, get user to find dealer
    const user = await SignUp.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Find dealer by email (assuming email matches)
    const dealer = await Dealer.findOne({ email: user.email });
    if (!dealer) {
      throw new NotFoundError('Dealer not found for this user');
    }

    // Validate payout credentials
    if (data.type === 'UPI') {
      if (!data.upiId || !validateUPIId(data.upiId)) {
        throw new AppError('Invalid UPI ID format. Expected format: username@paymentprovider', 400);
      }
      dealer.payout = {
        type: 'UPI',
        upiId: data.upiId.trim(),
      };
    } else if (data.type === 'BANK') {
      if (!data.bank) {
        throw new AppError('Bank details are required for BANK payout type', 400);
      }

      if (!data.bank.accountNumber || !validateAccountNumber(data.bank.accountNumber)) {
        throw new AppError('Invalid account number. Must be 9-18 digits', 400);
      }

      if (!data.bank.ifsc || !validateIFSC(data.bank.ifsc)) {
        throw new AppError('Invalid IFSC code format. Expected format: XXXX0XXXXX', 400);
      }

      if (!data.bank.accountName || !data.bank.accountName.trim()) {
        throw new AppError('Account name is required', 400);
      }

      dealer.payout = {
        type: 'BANK',
        bank: {
          accountNumber: data.bank.accountNumber.trim(),
          ifsc: data.bank.ifsc.trim().toUpperCase(),
          accountName: data.bank.accountName.trim(),
        },
      };
    } else {
      throw new AppError('Invalid payout type. Must be UPI or BANK', 400);
    }

    await dealer.save();

    logger.info(`Payout credentials updated for dealer: ${dealer.email}`, {
      type: data.type,
    });

    return dealer.payout;
  } catch (error) {
    logger.error('Error updating dealer payout:', error);
    throw error;
  }
};

/**
 * Get dealer payout credentials
 */
export const getDealerPayout = async (userId: string): Promise<IPayoutCredentials | null> => {
  try {
    const user = await SignUp.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const dealer = await Dealer.findOne({ email: user.email });
    if (!dealer) {
      throw new NotFoundError('Dealer not found for this user');
    }

    return dealer.payout || null;
  } catch (error) {
    logger.error('Error getting dealer payout:', error);
    throw error;
  }
};

