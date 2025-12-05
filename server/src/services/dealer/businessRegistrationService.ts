import { BusinessRegistration, IBusinessRegistrationDocument } from '../../models/BusinessRegistration';
import {
  IBusinessRegistration,
  ICreateBusinessRegistrationRequest,
  IUpdateBusinessRegistrationRequest,
  IUpdateBusinessRegistrationStatusRequest,
} from '../../types/dealer/businessRegistration';
import { NotFoundError, ConflictError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Convert business registration document to interface
 */
const businessRegistrationToInterface = (
  doc: IBusinessRegistrationDocument,
): IBusinessRegistration => {
  return {
    id: (doc._id as any).toString(),
    businessName: doc.businessName,
    type: doc.type,
    address: doc.address,
    phone: doc.phone,
    gst: doc.gst,
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

    // TODO: Change status to 'pending' and implement admin approval workflow once admin panel is ready
    // For now, auto-approve business registrations
    const registration = new BusinessRegistration({
      businessName: data.businessName.trim(),
      type: data.type,
      address: data.address.trim(),
      phone: data.phone.trim(),
      gst: data.gst?.trim() || undefined,
      status: 'approved', // Auto-approved for now - will be 'pending' once admin panel is implemented
      userId,
    });

    await registration.save();

    logger.info(`Business registration created and auto-approved for user: ${userId}`);

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
      throw new AppError('Cannot update approved registration', 400);
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

