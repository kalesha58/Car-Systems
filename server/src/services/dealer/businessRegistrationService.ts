import { BusinessRegistration, IBusinessRegistrationDocument } from '../../models/BusinessRegistration';
import { SignUp } from '../../models/SignUp';
import {
  IBusinessRegistration,
  ICreateBusinessRegistrationRequest,
  IUpdateBusinessRegistrationRequest,
  IUpdateBusinessRegistrationStatusRequest,
} from '../../types/dealer/businessRegistration';
import { NotFoundError, ConflictError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { sendBusinessRegistrationSubmittedEmail } from '../../utils/emailService';

/**
 * Convert business registration document to interface
 */
export const businessRegistrationToInterface = (
  doc: IBusinessRegistrationDocument,
): IBusinessRegistration => {
  return {
    id: (doc._id as any).toString(),
    businessName: doc.businessName,
    type: doc.type,
    address: doc.address,
    phone: doc.phone,
    gst: doc.gst,
    payout: doc.payout,
    shopPhotos: doc.shopPhotos || [],
    documents: doc.documents || [],
    status: doc.status,
    approvalCode: doc.approvalCode,
    userId: doc.userId,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get business registration by ID
 */
export const getBusinessRegistrationById = async (
  id: string,
): Promise<IBusinessRegistration> => {
  try {
    const registration = await BusinessRegistration.findById(id);

    if (!registration) {
      throw new NotFoundError('Business registration not found');
    }

    return businessRegistrationToInterface(registration);
  } catch (error) {
    logger.error('Error getting business registration by ID:', error);
    throw error;
  }
};

/**
 * Get business registration by user ID
 */
export const getBusinessRegistrationByUserId = async (
  userId: string,
): Promise<IBusinessRegistration | null> => {
  try {
    const registration = await BusinessRegistration.findOne({ userId });

    if (!registration) {
      return null;
    }

    return businessRegistrationToInterface(registration);
  } catch (error) {
    logger.error('Error getting business registration by user ID:', error);
    throw error;
  }
};

/**
 * Create business registration
 */
export const createBusinessRegistration = async (
  userId: string,
  data: ICreateBusinessRegistrationRequest,
): Promise<IBusinessRegistration> => {
  try {
    // Check if user already has a registration
    const existing = await BusinessRegistration.findOne({ userId });

    if (existing) {
      throw new ConflictError('Business registration already exists for this user');
    }

    // Validate required fields
    if (!data.businessName?.trim()) {
      throw new AppError('Business name is required', 400);
    }

    if (!data.type) {
      throw new AppError('Business type is required', 400);
    }

    if (!data.address?.trim()) {
      throw new AppError('Address is required', 400);
    }

    if (!data.phone?.trim()) {
      throw new AppError('Phone number is required', 400);
    }

    // Validate required uploads (shop photos + documents)
    if (!Array.isArray((data as any).shopPhotos) || (data as any).shopPhotos.length < 1) {
      throw new AppError('At least one shop photo is required', 400);
    }
    if (!Array.isArray((data as any).documents) || (data as any).documents.length < 1) {
      throw new AppError('At least one document is required', 400);
    }

    // Validate payout information if provided
    if (data.payout) {
      if (!data.payout.type || !['UPI', 'BANK'].includes(data.payout.type)) {
        throw new AppError('Invalid payout type. Must be UPI or BANK', 400);
      }

      if (data.payout.type === 'UPI') {
        if (!data.payout.upiId?.trim()) {
          throw new AppError('UPI ID is required when payout type is UPI', 400);
        }
        // Validate UPI ID format: username@paymentprovider
        const upiRegex = /^[\w.-]+@[\w]+$/;
        if (!upiRegex.test(data.payout.upiId.trim())) {
          throw new AppError('Invalid UPI ID format. Expected format: username@paymentprovider', 400);
        }
      } else if (data.payout.type === 'BANK') {
        if (!data.payout.bank) {
          throw new AppError('Bank details are required when payout type is BANK', 400);
        }
        if (!data.payout.bank.accountNumber?.trim()) {
          throw new AppError('Account number is required', 400);
        }
        if (!data.payout.bank.ifsc?.trim()) {
          throw new AppError('IFSC code is required', 400);
        }
        if (!data.payout.bank.accountName?.trim()) {
          throw new AppError('Account holder name is required', 400);
        }
        // Validate IFSC format: XXXX0XXXXX
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(data.payout.bank.ifsc.trim().toUpperCase())) {
          throw new AppError('Invalid IFSC code format. Expected format: XXXX0XXXXX', 400);
        }
      }
    }

    // Prepare payout object for saving
    let payoutData: any = undefined;
    if (data.payout) {
      if (data.payout.type === 'UPI') {
        payoutData = {
          type: 'UPI',
          upiId: data.payout.upiId?.trim(),
        };
      } else if (data.payout.type === 'BANK' && data.payout.bank) {
        payoutData = {
          type: 'BANK',
          bank: {
            accountNumber: data.payout.bank.accountNumber.trim(),
            ifsc: data.payout.bank.ifsc.trim().toUpperCase(),
            accountName: data.payout.bank.accountName.trim(),
          },
        };
      }
    }

    // Create business registration with pending status - requires admin approval
    const registrationData: any = {
      businessName: data.businessName.trim(),
      type: data.type,
      address: data.address.trim(),
      phone: data.phone.trim(),
      gst: data.gst?.trim() || undefined,
      payout: payoutData,
      status: 'pending', // Requires admin approval
      userId,
      // Validation above (lines 110-115) ensures shopPhotos and documents exist and are non-empty
      shopPhotos: data.shopPhotos,
      documents: data.documents,
    };

    logger.info('Creating business registration with data:', {
      userId,
      hasShopPhotos: !!(registrationData.shopPhotos && registrationData.shopPhotos.length > 0),
      shopPhotosCount: registrationData.shopPhotos?.length || 0,
      hasDocuments: !!(registrationData.documents && registrationData.documents.length > 0),
      documentsCount: registrationData.documents?.length || 0,
    });

    const registration = new BusinessRegistration(registrationData);
    await registration.save();

    logger.info(`Business registration created with pending status for user: ${userId}`);

    // Send confirmation email (do not fail registration if email fails)
    try {
      const user = await SignUp.findById(userId).select('name email');
      // Primary recipient: configured notify email (or fallback to user email)
      const notifyEmail =
        process.env.BUSINESS_REGISTRATION_NOTIFY_EMAIL || 'kaleshabox8@gmail.com';

      const recipients = new Set<string>();
      if (user?.email) recipients.add(user.email);
      if (notifyEmail) recipients.add(notifyEmail);

      if (recipients.size > 0) {
        await Promise.all(
          Array.from(recipients).map((to) =>
            sendBusinessRegistrationSubmittedEmail(to, {
              name: user?.name,
              businessName: registration.businessName,
              submittedAt: registration.createdAt,
            }),
          ),
        );
      } else {
        logger.warn(`Skipping business registration email: user email not found for userId=${userId}`);
      }
    } catch (emailError) {
      logger.error('Failed to send business registration submitted email:', emailError);
    }

    return businessRegistrationToInterface(registration);
  } catch (error) {
    logger.error('Error creating business registration:', error);
    throw error;
  }
};

/**
 * Update business registration
 */
export const updateBusinessRegistration = async (
  id: string,
  userId: string,
  data: IUpdateBusinessRegistrationRequest,
): Promise<IBusinessRegistration> => {
  try {
    const registration = await BusinessRegistration.findById(id);

    if (!registration) {
      throw new NotFoundError('Business registration not found');
    }

    // Verify ownership
    if (registration.userId !== userId) {
      throw new AppError('Unauthorized to update this registration', 403);
    }

    // Can only update if status is pending or rejected
    if (registration.status === 'approved') {
      throw new AppError('Cannot update approved business registration', 403);
    }

    if (data.businessName !== undefined) {
      if (!data.businessName.trim()) {
        throw new AppError('Business name cannot be empty', 400);
      }
      registration.businessName = data.businessName.trim();
    }

    if (data.type !== undefined) {
      registration.type = data.type;
    }

    if (data.address !== undefined) {
      if (!data.address.trim()) {
        throw new AppError('Address cannot be empty', 400);
      }
      registration.address = data.address.trim();
    }

    if (data.phone !== undefined) {
      if (!data.phone.trim()) {
        throw new AppError('Phone number cannot be empty', 400);
      }
      registration.phone = data.phone.trim();
    }

    if (data.gst !== undefined) {
      registration.gst = data.gst?.trim() || undefined;
    }

    if ((data as any).shopPhotos !== undefined) {
      const photos = (data as any).shopPhotos;
      if (!Array.isArray(photos) || photos.length < 1) {
        throw new AppError('At least one shop photo is required', 400);
      }
      (registration as any).shopPhotos = photos;
    }

    if ((data as any).documents !== undefined) {
      const docs = (data as any).documents;
      if (!Array.isArray(docs) || docs.length < 1) {
        throw new AppError('At least one document is required', 400);
      }
      (registration as any).documents = docs;
    }

    // Handle payout update
    if (data.payout !== undefined) {
      if (data.payout === null) {
        // Remove payout if explicitly set to null
        registration.payout = undefined;
      } else {
        // Validate payout information
        if (!data.payout.type || !['UPI', 'BANK'].includes(data.payout.type)) {
          throw new AppError('Invalid payout type. Must be UPI or BANK', 400);
        }

        if (data.payout.type === 'UPI') {
          if (!data.payout.upiId?.trim()) {
            throw new AppError('UPI ID is required when payout type is UPI', 400);
          }
          // Validate UPI ID format
          const upiRegex = /^[\w.-]+@[\w]+$/;
          if (!upiRegex.test(data.payout.upiId.trim())) {
            throw new AppError('Invalid UPI ID format. Expected format: username@paymentprovider', 400);
          }
          registration.payout = {
            type: 'UPI',
            upiId: data.payout.upiId.trim(),
          };
        } else if (data.payout.type === 'BANK') {
          if (!data.payout.bank) {
            throw new AppError('Bank details are required when payout type is BANK', 400);
          }
          if (!data.payout.bank.accountNumber?.trim()) {
            throw new AppError('Account number is required', 400);
          }
          if (!data.payout.bank.ifsc?.trim()) {
            throw new AppError('IFSC code is required', 400);
          }
          if (!data.payout.bank.accountName?.trim()) {
            throw new AppError('Account holder name is required', 400);
          }
          // Validate IFSC format
          const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
          if (!ifscRegex.test(data.payout.bank.ifsc.trim().toUpperCase())) {
            throw new AppError('Invalid IFSC code format. Expected format: XXXX0XXXXX', 400);
          }
          registration.payout = {
            type: 'BANK',
            bank: {
              accountNumber: data.payout.bank.accountNumber.trim(),
              ifsc: data.payout.bank.ifsc.trim().toUpperCase(),
              accountName: data.payout.bank.accountName.trim(),
            },
          };
        }
      }
    }

    await registration.save();

    logger.info(`Business registration updated: ${id}`);

    return businessRegistrationToInterface(registration);
  } catch (error) {
    logger.error('Error updating business registration:', error);
    throw error;
  }
};

/**
 * Update business registration status
 */
export const updateBusinessRegistrationStatus = async (
  id: string,
  data: IUpdateBusinessRegistrationStatusRequest,
): Promise<IBusinessRegistration> => {
  try {
    const registration = await BusinessRegistration.findById(id);

    if (!registration) {
      throw new NotFoundError('Business registration not found');
    }

    registration.status = data.status;

    if (data.approvalCode !== undefined) {
      registration.approvalCode = data.approvalCode;
    }

    await registration.save();

    logger.info(`Business registration status updated: ${id} - ${data.status}`);

    return businessRegistrationToInterface(registration);
  } catch (error) {
    logger.error('Error updating business registration status:', error);
    throw error;
  }
};

/**
 * Delete business registration
 */
export const deleteBusinessRegistration = async (id: string, userId: string): Promise<void> => {
  try {
    const registration = await BusinessRegistration.findById(id);

    if (!registration) {
      throw new NotFoundError('Business registration not found');
    }

    // Verify ownership
    if (registration.userId !== userId) {
      throw new AppError('Unauthorized to delete this registration', 403);
    }

    // Can only delete if status is pending or rejected
    if (registration.status === 'approved') {
      throw new AppError('Cannot delete approved registration', 400);
    }

    await BusinessRegistration.findByIdAndDelete(id);

    logger.info(`Business registration deleted: ${id}`);
  } catch (error) {
    logger.error('Error deleting business registration:', error);
    throw error;
  }
};

