import { BusinessRegistration } from '../../models/BusinessRegistration';
import { SignUp } from '../../models/SignUp';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IDealerInfo {
  userId: string;
  businessName: string;
  status: string;
  type?: string;
  address?: string;
  phone?: string;
}

/**
 * Get dealer userId from dealerId (BusinessRegistration._id)
 * Verifies dealer exists and is approved
 */
export const getDealerUserId = async (dealerId: string): Promise<string> => {
  const businessRegistration = await BusinessRegistration.findById(dealerId);

  if (!businessRegistration) {
    throw new NotFoundError('Dealer not found');
  }

  if (businessRegistration.status !== 'approved') {
    throw new AppError(
      `Dealer account is ${businessRegistration.status}. Please wait for approval.`,
      403,
    );
  }

  return businessRegistration.userId;
};

/**
 * Get dealer info by dealerId (BusinessRegistration._id)
 * Returns userId and basic dealer information
 */
export const getDealerInfo = async (dealerId: string): Promise<IDealerInfo> => {
  logger.info(`getDealerInfo: Looking up dealer with dealerId: ${dealerId}`);
  
  const businessRegistration = await BusinessRegistration.findById(dealerId);

  if (!businessRegistration) {
    logger.warn(`getDealerInfo: BusinessRegistration not found for dealerId: ${dealerId}`);
    throw new NotFoundError('Dealer not found');
  }

  logger.info(`getDealerInfo: Found BusinessRegistration, userId: ${businessRegistration.userId}, status: ${businessRegistration.status}`);

  // Get user info
  const user = await SignUp.findById(businessRegistration.userId).select('name phone').lean();

  if (!user) {
    logger.error(`getDealerInfo: User not found for userId: ${businessRegistration.userId}`);
    throw new NotFoundError('Dealer user account not found');
  }

  const dealerInfo = {
    userId: businessRegistration.userId,
    businessName: businessRegistration.businessName,
    status: businessRegistration.status,
    type: businessRegistration.type,
    address: businessRegistration.address,
    phone: businessRegistration.phone || (user.phone as string),
  };

  logger.info(`getDealerInfo: Returning dealer info for dealerId: ${dealerId}`);
  return dealerInfo;
};

/**
 * Verify dealer is approved and can be contacted
 */
export const verifyDealerForChat = async (dealerId: string): Promise<IDealerInfo> => {
  const dealerInfo = await getDealerInfo(dealerId);

  if (dealerInfo.status !== 'approved') {
    throw new AppError(
      `Dealer account is ${dealerInfo.status}. Please wait for approval.`,
      403,
    );
  }

  return dealerInfo;
};
