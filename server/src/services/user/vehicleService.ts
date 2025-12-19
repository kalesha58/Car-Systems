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

    // Get unique dealerIds from vehicles and normalize them
    const dealerIdsRaw = [...new Set(vehicles.map((v: any) => v.dealerId).filter(Boolean))];
    logger.info(`[getAllDealerVehiclesForUsers] Found ${dealerIdsRaw.length} unique dealerIds:`, dealerIdsRaw);
    
    // Normalize all dealerIds to strings for consistent comparison
    const dealerIdsNormalized = dealerIdsRaw.map(id => String(id).trim()).filter(Boolean);
    
    // Convert valid ObjectId strings to ObjectIds for MongoDB query
    const dealerObjectIds: any[] = [];
    const dealerIdStrings: string[] = [];
    
    dealerIdsNormalized.forEach(id => {
      if (mongoose.Types.ObjectId.isValid(id)) {
        try {
          dealerObjectIds.push(new mongoose.Types.ObjectId(id));
          dealerIdStrings.push(id);
        } catch (e) {
          dealerIdStrings.push(id);
        }
      } else {
        dealerIdStrings.push(id);
      }
    });

    logger.info(`[getAllDealerVehiclesForUsers] Querying BusinessRegistration with ${dealerObjectIds.length} ObjectIds and ${dealerIdStrings.length} strings`);

    // Get all business registrations for these dealers
    // Try both ObjectId and string formats
    const queryConditions: any[] = [];
    if (dealerObjectIds.length > 0) {
      queryConditions.push({ _id: { $in: dealerObjectIds } });
    }
    if (dealerIdStrings.length > 0) {
      queryConditions.push({ _id: { $in: dealerIdStrings } });
    }

    const businessRegistrations = queryConditions.length > 0
      ? await BusinessRegistration.find({ $or: queryConditions })
      : [];

    logger.info(`[getAllDealerVehiclesForUsers] Found ${businessRegistrations.length} business registrations`);

    // Create a comprehensive map of dealerId to dealer info
    // Store with multiple key formats to handle all variations
    const dealerInfoMap = new Map<string, IDealerInfo>();
    businessRegistrations.forEach((reg) => {
      const regId = (reg._id as any);
      const regIdString = String(regId);
      const regIdObjectIdString = mongoose.Types.ObjectId.isValid(regIdString) 
        ? new mongoose.Types.ObjectId(regIdString).toString() 
        : regIdString;

      const dealerInfo: IDealerInfo = {
        id: regIdString,
        businessName: reg.businessName || 'Unknown Business',
        type: reg.type || '',
        phone: reg.phone || '',
        address: reg.address || '',
        gst: reg.gst || '',
      };

      // Store with multiple key formats for robust lookup
      dealerInfoMap.set(regIdString, dealerInfo);
      dealerInfoMap.set(regIdObjectIdString, dealerInfo);
      if (regIdString !== regIdObjectIdString) {
        dealerInfoMap.set(regIdObjectIdString, dealerInfo);
      }
    });

    logger.info(`[getAllDealerVehiclesForUsers] Created dealerInfoMap with ${dealerInfoMap.size} entries`);

    // Convert vehicles and attach dealer info
    const vehiclesWithDealer = vehicles.map((vehicleDoc) => {
      // Normalize vehicle dealerId to string
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

      // Try multiple lookup strategies
      let dealerInfo = dealerInfoMap.get(vehicleDealerId);
      
      // If not found, try ObjectId conversion
      if (!dealerInfo && mongoose.Types.ObjectId.isValid(vehicleDealerId)) {
        try {
          const objectIdStr = new mongoose.Types.ObjectId(vehicleDealerId).toString();
          dealerInfo = dealerInfoMap.get(objectIdStr);
        } catch (e) {
          // Ignore conversion errors
        }
      }

      if (!dealerInfo) {
        // Log detailed info for debugging
        logger.warn(`[getAllDealerVehiclesForUsers] Dealer not found for vehicle ${vehicleDoc._id}, dealerId: "${vehicleDealerId}" (type: ${typeof vehicleDoc.dealerId})`);
        logger.warn(`[getAllDealerVehiclesForUsers] Available dealerIds in map:`, Array.from(dealerInfoMap.keys()).slice(0, 5));
        
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
    logger.error('Error getting all dealer vehicles for users:', error);
    throw error;
  }
};

