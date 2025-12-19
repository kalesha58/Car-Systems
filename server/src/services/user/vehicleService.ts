import { Vehicle, IVehicleDocument } from '../../models/user/Vehicle';
import {
  ICreateVehicleRequest,
  IUpdateVehicleRequest,
  IVehicle,
  IVehicleResponse,
  IVehiclesResponse,
} from '../../types/vehicle';
import { AppError, NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { DealerVehicle, IDealerVehicleDocument } from '../../models/DealerVehicle';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import {
  IDealerVehicleWithDealer,
  IGetUserDealerVehiclesRequest,
  IDealerInfo,
} from '../../types/user/vehicle';
import { IPaginationResponse } from '../../types/admin';
import mongoose from 'mongoose';

/**
 * Convert vehicle document to IVehicle interface
 */
const vehicleToIVehicle = (vehicleDoc: IVehicleDocument): IVehicle => {
  return {
    id: vehicleDoc.id,
    ownerId: vehicleDoc.ownerId,
    brand: vehicleDoc.brand,
    model: vehicleDoc.model,
    numberPlate: vehicleDoc.numberPlate,
    documents: vehicleDoc.documents || {},
    primaryDriverId: vehicleDoc.primaryDriverId,
    year: vehicleDoc.year,
    color: vehicleDoc.color,
    images: vehicleDoc.images || [],
    createdAt: vehicleDoc.createdAt?.toISOString(),
    updatedAt: vehicleDoc.updatedAt?.toISOString(),
  };
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (
  ownerId: string,
  data: ICreateVehicleRequest,
): Promise<IVehicleResponse> => {
  const { brand, model, numberPlate, documents, primaryDriverId, year, color, images } = data;

  // Check if vehicle with same number plate already exists
  const existingVehicle = await Vehicle.findOne({ numberPlate: numberPlate.toUpperCase() });

  if (existingVehicle) {
    throw new ConflictError('Vehicle with this number plate already exists');
  }

  // Create new vehicle
  const vehicle = new Vehicle({
    ownerId,
    brand,
    model,
    numberPlate: numberPlate.toUpperCase(),
    documents: documents || {},
    primaryDriverId,
    year,
    color,
    images: images || [],
  });

  await vehicle.save();

  logger.info(`New vehicle created: ${vehicle.numberPlate} for owner: ${ownerId}`);

  return {
    Response: vehicleToIVehicle(vehicle),
  };
};

/**
 * Get all vehicles by owner ID
 */
export const getVehiclesByOwner = async (ownerId: string): Promise<IVehiclesResponse> => {
  const vehicles = await Vehicle.find({ ownerId }).sort({ createdAt: -1 });

  return {
    Response: vehicles.map(vehicleToIVehicle),
  };
};

/**
 * Get vehicle by ID
 */
export const getVehicleById = async (vehicleId: string, ownerId: string): Promise<IVehicleResponse> => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Verify ownership
  if (vehicle.ownerId !== ownerId) {
    throw new AppError('Unauthorized access to vehicle', 403);
  }

  return {
    Response: vehicleToIVehicle(vehicle),
  };
};

/**
 * Update vehicle
 */
export const updateVehicle = async (
  vehicleId: string,
  ownerId: string,
  data: IUpdateVehicleRequest,
): Promise<IVehicleResponse> => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Verify ownership
  if (vehicle.ownerId !== ownerId) {
    throw new AppError('Unauthorized access to vehicle', 403);
  }

  // Check if number plate is being updated and if it conflicts
  if (data.numberPlate && data.numberPlate.toUpperCase() !== vehicle.numberPlate) {
    const existingVehicle = await Vehicle.findOne({
      numberPlate: data.numberPlate.toUpperCase(),
      _id: { $ne: vehicleId },
    });

    if (existingVehicle) {
      throw new ConflictError('Vehicle with this number plate already exists');
    }
  }

  // Update fields using set() to avoid TypeScript conflicts with reserved names
  if (data.brand !== undefined) {
    vehicle.set('brand', data.brand);
  }
  if (data.model !== undefined) {
    vehicle.set('model', data.model);
  }
  if (data.numberPlate !== undefined) {
    vehicle.set('numberPlate', data.numberPlate.toUpperCase());
  }
  if (data.documents !== undefined) {
    vehicle.set('documents', { ...vehicle.documents, ...data.documents });
  }
  if (data.primaryDriverId !== undefined) {
    vehicle.set('primaryDriverId', data.primaryDriverId);
  }
  if (data.year !== undefined) {
    vehicle.set('year', data.year);
  }
  if (data.color !== undefined) {
    vehicle.set('color', data.color);
  }
  if (data.images !== undefined) {
    vehicle.set('images', data.images);
  }

  await vehicle.save();

  logger.info(`Vehicle updated: ${vehicle.numberPlate}`);

  return {
    Response: vehicleToIVehicle(vehicle),
  };
};

/**
 * Delete vehicle
 */
export const deleteVehicle = async (vehicleId: string, ownerId: string): Promise<void> => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Verify ownership
  if (vehicle.ownerId !== ownerId) {
    throw new AppError('Unauthorized access to vehicle', 403);
  }

  await Vehicle.findByIdAndDelete(vehicleId);

  logger.info(`Vehicle deleted: ${vehicle.numberPlate}`);
};

/**
 * Convert dealer vehicle document to interface with dealer information
 */
const vehicleToInterfaceWithDealer = (doc: IDealerVehicleDocument, dealerInfo: IDealerInfo): IDealerVehicleWithDealer => {
  return {
    id: (doc._id as any).toString(),
    dealerId: doc.dealerId,
    vehicleType: doc.vehicleType,
    brand: doc.brand,
    vehicleModel: doc.vehicleModel,
    year: doc.year,
    price: doc.price,
    availability: doc.availability,
    images: doc.images,
    numberPlate: doc.numberPlate,
    mileage: doc.mileage,
    color: doc.color,
    fuelType: doc.fuelType,
    transmission: doc.transmission,
    description: doc.description,
    features: doc.features,
    condition: doc.condition,
    allowTestDrive: doc.allowTestDrive || false,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    dealer: dealerInfo,
  };
};

/**
 * Get all dealer vehicles for users with dealer information
 * Returns all dealer vehicles without any restrictions
 */
export const getAllDealerVehiclesForUsers = async (
  query: IGetUserDealerVehiclesRequest,
): Promise<{ vehicles: IDealerVehicleWithDealer[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build filter for vehicles - fetch ALL vehicles without restrictions
    const filter: any = {};

    if (query.vehicleType) {
      filter.vehicleType = query.vehicleType;
    }

    if (query.brand) {
      filter.brand = { $regex: query.brand, $options: 'i' };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.minYear !== undefined || query.maxYear !== undefined) {
      filter.year = {};
      if (query.minYear !== undefined) filter.year.$gte = query.minYear;
      if (query.maxYear !== undefined) filter.year.$lte = query.maxYear;
    }

    if (query.search) {
      filter.$or = [
        { brand: { $regex: query.search, $options: 'i' } },
        { vehicleModel: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    logger.info(`[getAllDealerVehiclesForUsers] Filter:`, JSON.stringify(filter, null, 2));
    logger.info(`[getAllDealerVehiclesForUsers] Query params: page=${page}, limit=${limit}, skip=${skip}`);

    const [vehicles, total] = await Promise.all([
      DealerVehicle.find(filter).sort(sort).skip(skip).limit(limit),
      DealerVehicle.countDocuments(filter),
    ]);

    logger.info(`[getAllDealerVehiclesForUsers] Found ${vehicles.length} vehicles, total: ${total}`);

    // Get unique dealerIds from vehicles
    // dealerId in DealerVehicle is BusinessRegistration._id (set by dealerMiddleware)
    const dealerIds = [...new Set(vehicles.map((v: any) => v.dealerId).filter(Boolean))];
    logger.info(`[getAllDealerVehiclesForUsers] Found ${dealerIds.length} unique dealerIds:`, dealerIds);
    logger.info(`[getAllDealerVehiclesForUsers] Sample dealerIds (first 3):`, dealerIds.slice(0, 3).map(id => ({ raw: id, type: typeof id, string: String(id) })));

    // Convert dealerIds to ObjectIds for MongoDB query (BusinessRegistration._id is ObjectId)
    const dealerObjectIds = dealerIds
      .filter(id => {
        const idStr = String(id);
        const isValid = mongoose.Types.ObjectId.isValid(idStr);
        if (!isValid) {
          logger.warn(`[getAllDealerVehiclesForUsers] Invalid ObjectId found: "${idStr}" (type: ${typeof id})`);
        }
        return isValid;
      })
      .map(id => {
        try {
          return new mongoose.Types.ObjectId(String(id));
        } catch (e) {
          logger.error(`[getAllDealerVehiclesForUsers] Failed to convert to ObjectId: "${id}"`, e);
          return null;
        }
      })
      .filter((id): id is mongoose.Types.ObjectId => id !== null);

    logger.info(`[getAllDealerVehiclesForUsers] Querying BusinessRegistration with ${dealerObjectIds.length} ObjectIds`);
    logger.info(`[getAllDealerVehiclesForUsers] Sample ObjectIds:`, dealerObjectIds.slice(0, 3).map(id => id.toString()));

    // Get all business registrations for these dealers
    const businessRegistrations = dealerObjectIds.length > 0
      ? await BusinessRegistration.find({ _id: { $in: dealerObjectIds } })
      : [];

    logger.info(`[getAllDealerVehiclesForUsers] Found ${businessRegistrations.length} business registrations out of ${dealerObjectIds.length} queried`);
    
    // Log what we found
    if (businessRegistrations.length > 0) {
      logger.info(`[getAllDealerVehiclesForUsers] Sample business registrations:`, businessRegistrations.slice(0, 3).map(reg => ({
        _id: (reg._id as any).toString(),
        businessName: reg.businessName,
        userId: reg.userId,
      })));
    }

    // Create a map of BusinessRegistration._id (as string) to dealer info
    // Also create a map by userId in case dealerId was incorrectly set to userId
    const dealerInfoMap = new Map<string, IDealerInfo>();
    const dealerInfoMapByUserId = new Map<string, IDealerInfo>();
    
    businessRegistrations.forEach((reg) => {
      const regIdString = (reg._id as any).toString();
      const dealerInfo: IDealerInfo = {
        id: regIdString,
        businessName: reg.businessName,
        type: reg.type,
        phone: reg.phone,
        address: reg.address,
        gst: reg.gst,
      };
      
      // Map by _id (primary lookup)
      dealerInfoMap.set(regIdString, dealerInfo);
      
      // Also map by userId (fallback in case dealerId was set to userId instead of _id)
      if (reg.userId) {
        dealerInfoMapByUserId.set(reg.userId, dealerInfo);
      }
    });

    logger.info(`[getAllDealerVehiclesForUsers] Created dealerInfoMap with ${dealerInfoMap.size} entries (by _id)`);
    logger.info(`[getAllDealerVehiclesForUsers] Created dealerInfoMapByUserId with ${dealerInfoMapByUserId.size} entries (by userId)`);

    // Convert vehicles and attach dealer info
    const vehiclesWithDealer = vehicles.map((vehicleDoc) => {
      // vehicleDoc.dealerId is BusinessRegistration._id (string from DB)
      const vehicleDealerId = String(vehicleDoc.dealerId || '').trim();
      
      if (!vehicleDealerId) {
        logger.warn(`[getAllDealerVehiclesForUsers] Vehicle ${vehicleDoc._id} has no dealerId`);
        const defaultDealerInfo: IDealerInfo = {
          id: 'unknown',
          businessName: 'Unknown Dealer',
          type: '',
          phone: '',
          address: '',
        };
        return vehicleToInterfaceWithDealer(vehicleDoc, defaultDealerInfo);
      }

      // Try primary lookup - dealerId should match BusinessRegistration._id.toString()
      let dealerInfo = dealerInfoMap.get(vehicleDealerId);
      
      // If not found, try converting to ObjectId and back (in case of format differences)
      if (!dealerInfo && mongoose.Types.ObjectId.isValid(vehicleDealerId)) {
        try {
          const normalizedId = new mongoose.Types.ObjectId(vehicleDealerId).toString();
          dealerInfo = dealerInfoMap.get(normalizedId);
        } catch (e) {
          // Ignore conversion errors
        }
      }
      
      // If still not found, try lookup by userId (fallback for incorrectly set dealerIds)
      if (!dealerInfo) {
        dealerInfo = dealerInfoMapByUserId.get(vehicleDealerId);
        if (dealerInfo) {
          logger.info(`[getAllDealerVehiclesForUsers] Found dealer by userId fallback for vehicle ${vehicleDoc._id}`);
        }
      }

      if (!dealerInfo) {
        // Log detailed debugging info
    
        // Return a default dealer info if not found
        const defaultDealerInfo: IDealerInfo = {
          id: vehicleDealerId,
          businessName: 'Unknown Dealer',
          type: '',
          phone: '',
          address: '',
        };
        return vehicleToInterfaceWithDealer(vehicleDoc, defaultDealerInfo);
      }
      
      return vehicleToInterfaceWithDealer(vehicleDoc, dealerInfo);
    });

    return {
      vehicles: vehiclesWithDealer,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

