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
import { IPaginationResponse } from '../../types/admin';

/**
 * Get all addresses with pagination and filters (admin only)
 */
export const getAllAddresses = async (
  query: IGetAddressesQuery & { userId?: string },
): Promise<IAddressesListResponse> => {
  const { page = 1, limit = 50, search, addressType, userId } = query;

  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {};

  if (userId) {
    filter.userId = userId;
  }

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
 * Get address by ID (admin can access any address)
 */
export const getAddressById = async (addressId: string): Promise<IAddressResponse> => {
  const address = await Address.findById(addressId).lean();

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  return mapAddressToResponse(address as any as IAddressDocument);
};

/**
 * Create address for a user (admin only)
 */
export const createAddressForUser = async (
  userId: string,
  data: IAddressFormData,
): Promise<IAddressResponse> => {
  const {
    name,
    phone,
    fullAddress,
    coordinates,
    addressType,
    iconType,
    locationDescription,
    nearbyLocation,
    alternateNumber,
    flatNumber,
    buildingName,
    townOrCity,
    isDefault,
  } = data;

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

  // Validate alternate number format if provided
  if (alternateNumber && !/^[0-9]{10}$/.test(alternateNumber.trim())) {
    throw new ValidationError('Alternate number must be exactly 10 digits');
  }

  // If this address is set as default, unset all other default addresses for this user
  if (isDefault) {
    await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
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
    locationDescription: locationDescription?.trim(),
    nearbyLocation: nearbyLocation?.trim(),
    alternateNumber: alternateNumber?.trim(),
    flatNumber: flatNumber?.trim(),
    buildingName: buildingName?.trim(),
    townOrCity: townOrCity?.trim(),
    isDefault: isDefault || false,
  });

  await address.save();

  logger.info(`Admin created new address for user: ${userId}`);

  return mapAddressToResponse(address);
};

/**
 * Update an address (admin can update any address)
 */
export const updateAddress = async (
  addressId: string,
  data: Partial<IAddressFormData>,
): Promise<IAddressResponse> => {
  const address = await Address.findById(addressId);

  if (!address) {
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

  if (data.locationDescription !== undefined) {
    address.locationDescription = data.locationDescription?.trim();
  }

  if (data.nearbyLocation !== undefined) {
    address.nearbyLocation = data.nearbyLocation?.trim();
  }

  if (data.alternateNumber !== undefined) {
    if (data.alternateNumber && !/^[0-9]{10}$/.test(data.alternateNumber.trim())) {
      throw new ValidationError('Alternate number must be exactly 10 digits');
    }
    address.alternateNumber = data.alternateNumber?.trim();
  }

  if (data.flatNumber !== undefined) {
    address.flatNumber = data.flatNumber?.trim();
  }

  if (data.buildingName !== undefined) {
    address.buildingName = data.buildingName?.trim();
  }

  if (data.townOrCity !== undefined) {
    address.townOrCity = data.townOrCity?.trim();
  }

  if (data.isDefault !== undefined) {
    // If setting this address as default, unset all other default addresses for this user
    if (data.isDefault && address.userId) {
      await Address.updateMany(
        { userId: address.userId, _id: { $ne: addressId }, isDefault: true },
        { isDefault: false },
      );
    }
    address.isDefault = data.isDefault;
  }

  const updatedAddress = await address.save();

  logger.info(`Admin updated address: ${addressId}`);

  return mapAddressToResponse(updatedAddress as IAddressDocument);
};

/**
 * Delete an address (admin can delete any address)
 */
export const deleteAddress = async (addressId: string): Promise<void> => {
  const address = await Address.findById(addressId);

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  await Address.findByIdAndDelete(addressId);

  logger.info(`Admin deleted address: ${addressId}`);
};

