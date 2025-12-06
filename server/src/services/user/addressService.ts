import { Address, IAddressDocument } from '../../models/user/Address';
import {
  IAddressFormData,
  IAddressResponse,
  mapAddressToResponse,
  IGetAddressesQuery,
  IAddressesListResponse,
} from '../../types/user/address';
import { AppError, NotFoundError, ValidationError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Create a new address for a user
 */
export const createAddress = async (
  userId: string,
  data: IAddressFormData,
): Promise<IAddressResponse> => {
  const { name, phone, fullAddress, coordinates, addressType, iconType } = data;

  // Validate required fields
  if (!name?.trim()) {
    throw new ValidationError('Name is required');
  }

  if (!phone?.trim()) {
    throw new ValidationError('Phone number is required');
  }

  if (!fullAddress?.trim()) {
    throw new ValidationError('Full address is required');
  }

  if (!coordinates?.latitude || !coordinates?.longitude) {
    throw new ValidationError('Coordinates are required');
  }

  // Validate coordinates range
  if (coordinates.latitude < -90 || coordinates.latitude > 90) {
    throw new ValidationError('Invalid latitude value');
  }

  if (coordinates.longitude < -180 || coordinates.longitude > 180) {
    throw new ValidationError('Invalid longitude value');
  }

  // Validate phone format
  if (!/^[0-9]{10}$/.test(phone.trim())) {
    throw new ValidationError('Phone number must be exactly 10 digits');
  }

  // Create new address
  const address = new Address({
    userId,
    name: name.trim(),
    phone: phone.trim(),
    fullAddress: fullAddress.trim(),
    coordinates: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
    addressType: addressType || 'home',
    iconType: iconType || 'location',
  });

  await address.save();

  logger.info(`New address created for user: ${userId}`);

  return mapAddressToResponse(address);
};

/**
 * Get all addresses for a user
 */
export const getUserAddresses = async (
  userId: string,
  query: IGetAddressesQuery = {},
): Promise<IAddressesListResponse> => {
  const { page = 1, limit = 50, search, addressType } = query;

  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = { userId };

  if (addressType) {
    filter.addressType = addressType;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { fullAddress: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  // Get addresses with pagination
  const [addresses, total] = await Promise.all([
    Address.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Address.countDocuments(filter),
  ]);

  return {
    addresses: addresses.map((addr: any) => mapAddressToResponse(addr as IAddressDocument)),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get address by ID
 */
export const getAddressById = async (
  addressId: string,
  userId: string,
): Promise<IAddressResponse> => {
  const address = await Address.findById(addressId).lean();

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  const addressDoc = address as any as IAddressDocument;

  // Verify ownership
  if (addressDoc.userId !== userId) {
    throw new NotFoundError('Address not found');
  }

  return mapAddressToResponse(addressDoc);
};

/**
 * Update an address
 */
export const updateAddress = async (
  addressId: string,
  userId: string,
  data: Partial<IAddressFormData>,
): Promise<IAddressResponse> => {
  const address = await Address.findById(addressId);

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // Verify ownership
  if (address.userId !== userId) {
    throw new NotFoundError('Address not found');
  }

  // Validate and update fields
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      throw new ValidationError('Name cannot be empty');
    }
    address.name = data.name.trim();
  }

  if (data.phone !== undefined) {
    if (!data.phone?.trim()) {
      throw new ValidationError('Phone number cannot be empty');
    }
    if (!/^[0-9]{10}$/.test(data.phone.trim())) {
      throw new ValidationError('Phone number must be exactly 10 digits');
    }
    address.phone = data.phone.trim();
  }

  if (data.fullAddress !== undefined) {
    if (!data.fullAddress?.trim()) {
      throw new ValidationError('Full address cannot be empty');
    }
    address.fullAddress = data.fullAddress.trim();
  }

  if (data.coordinates !== undefined) {
    if (!data.coordinates?.latitude || !data.coordinates?.longitude) {
      throw new ValidationError('Coordinates are required');
    }
    if (data.coordinates.latitude < -90 || data.coordinates.latitude > 90) {
      throw new ValidationError('Invalid latitude value');
    }
    if (data.coordinates.longitude < -180 || data.coordinates.longitude > 180) {
      throw new ValidationError('Invalid longitude value');
    }
    address.coordinates = {
      latitude: data.coordinates.latitude,
      longitude: data.coordinates.longitude,
    };
  }

  if (data.addressType !== undefined) {
    address.addressType = data.addressType;
  }

  if (data.iconType !== undefined) {
    address.iconType = data.iconType;
  }

  const updatedAddress = await address.save();

  logger.info(`Address updated: ${addressId} for user: ${userId}`);

  return mapAddressToResponse(updatedAddress as IAddressDocument);
};

/**
 * Delete an address
 */
export const deleteAddress = async (addressId: string, userId: string): Promise<void> => {
  const address = await Address.findById(addressId);

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // Verify ownership
  if (address.userId !== userId) {
    throw new NotFoundError('Address not found');
  }

  await Address.findByIdAndDelete(addressId);

  logger.info(`Address deleted: ${addressId} for user: ${userId}`);
};

