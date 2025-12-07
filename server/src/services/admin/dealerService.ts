import { Dealer, IDealerDocument } from '../../models/Dealer';
import { Order } from '../../models/Order';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import {
  IGetDealersRequest,
  ICreateDealerRequest,
  IUpdateDealerRequest,
  IDealer,
  IPaginationResponse,
} from '../../types/admin';
import {
  ICreateDealerProductRequest,
  IUpdateDealerProductRequest,
  IDealerProduct,
} from '../../types/dealer/product';
import {
  ICreateDealerVehicleRequest,
  IUpdateDealerVehicleRequest,
  IDealerVehicle,
} from '../../types/dealer/vehicle';
import {
  ICreateBusinessRegistrationRequest,
  IBusinessRegistration,
  IUpdateBusinessRegistrationRequest
} from '../../types/dealer/businessRegistration';
import { createDealerProduct, updateDealerProduct } from '../dealer/productService';
import { createDealerVehicle, updateDealerVehicle } from '../dealer/vehicleService';
import { DealerVehicle } from '../../models/DealerVehicle';
import { createBusinessRegistration, businessRegistrationToInterface } from '../dealer/businessRegistrationService';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Convert dealer document to IDealer interface
 */
const dealerToIDealer = (dealerDoc: IDealerDocument,  businessRegistration?: any): IDealer => {
  return {
    id: (dealerDoc._id as any).toString(),
    name: dealerDoc.name,
    businessName: dealerDoc.businessName,
    email: dealerDoc.email,
    phone: dealerDoc.phone,
    status: dealerDoc.status,
    location: dealerDoc.location,
    address: dealerDoc.address,
    documents: dealerDoc.documents,
    suspensionReason: dealerDoc.suspensionReason,
    dealerType: businessRegistration?.type,
    registrationDate: businessRegistration?.createdAt?.toISOString(),
    approvalDate: businessRegistration?.status === 'approved' ? businessRegistration?.updatedAt?.toISOString() : undefined,
    createdAt: dealerDoc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all dealers with pagination and filters
 */
export const getDealers = async (
  query: IGetDealersRequest,
): Promise<{ dealers: IDealer[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    
    let matchingUserIds: string[] = [];
    if (query.dealerType) {
      const matchingRegs = await BusinessRegistration.find({ type: query.dealerType });
      matchingUserIds = matchingRegs.map((reg: any) => reg.userId);
      
      // Get users with these userIds to get their emails
      const { SignUp } = await import('../../models/SignUp');
      const users = await SignUp.find({ _id: { $in: matchingUserIds } });
      const matchingEmails = users.map((u: any) => u.email);
      
      // Filter dealers by email
      filter.email = { $in: matchingEmails };
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [dealers, total] = await Promise.all([
      Dealer.find(filter).sort(sort).skip(skip).limit(limit),
      Dealer.countDocuments(filter),
    ]);

     // Get users to match with dealers by email
     const { SignUp } = await import('../../models/SignUp');
     const dealerEmails = dealers.map((d: any) => d.email);
     const users = await SignUp.find({ email: { $in: dealerEmails } });
 
     // Create a map of email to userId (_id from SignUp)
     const emailToUserIdMap = new Map();
     users.forEach((user: any) => {
       emailToUserIdMap.set(user.email, (user._id as any).toString());
     });
 
     // Get business registrations for these users
     const userIds = Array.from(emailToUserIdMap.values());
     const businessRegistrations = await BusinessRegistration.find({
       userId: { $in: userIds }
     });
 
     // Create a map of userId to business registration
     const registrationMap = new Map();
     businessRegistrations.forEach((reg: any) => {
       registrationMap.set(reg.userId, reg);
     });
 
     // Map dealers with their business registrations
     const dealersWithRegistrations = dealers.map((dealer: any) => {
       const userId = emailToUserIdMap.get(dealer.email);
       const businessReg = userId ? registrationMap.get(userId) : null;
       return dealerToIDealer(dealer, businessReg);
     });
 

    return {
      dealers: dealersWithRegistrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealers:', error);
    throw error;
  }
};

/**
 * Get dealer by ID
 */
export const getDealerById = async (dealerId: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    // Get user by email to find userId
    const { SignUp } = await import('../../models/SignUp');
    const user = await SignUp.findOne({ email: dealer.email });

    // Get business registration for this user
    let businessReg = null;
    if (user) {
      const userId = (user._id as any).toString();
      businessReg = await BusinessRegistration.findOne({ userId });
    }

    const dealerData = dealerToIDealer(dealer, businessReg);

    // Get dealer orders
    const orders = await Order.find({ dealerId: dealerId }).limit(10);
    dealerData.orders = orders;

    return dealerData;
  } catch (error) {
    logger.error('Error getting dealer by ID:', error);
    throw error;
  }
};

/**
 * Create dealer
 */
export const createDealer = async (data: ICreateDealerRequest): Promise<IDealer> => {
  try {
    const dealer = new Dealer(data);
    await dealer.save();

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error creating dealer:', error);
    throw error;
  }
};

/**
 * Update dealer
 */
export const updateDealer = async (dealerId: string, data: IUpdateDealerRequest): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    if (data.name !== undefined) {
      dealer.name = data.name;
    }

    if (data.businessName !== undefined) {
      dealer.businessName = data.businessName;
    }

    if (data.phone !== undefined) {
      dealer.phone = data.phone;
    }

    if (data.location !== undefined) {
      dealer.location = data.location;
    }


    await dealer.save();

    logger.info(`Dealer updated: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error updating dealer:', error);
    throw error;
  }
};

/**
 * Delete dealer
 */
export const deleteDealer = async (dealerId: string): Promise<void> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    await dealer.deleteOne();

    logger.info(`Dealer deleted: ${dealer.email}`);
  } catch (error) {
    logger.error('Error deleting dealer:', error);
    throw error;
  }
};

/**
 * Approve dealer
 */
export const approveDealer = async (dealerId: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    dealer.status = 'approved';
    await dealer.save();

    logger.info(`Dealer approved: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error approving dealer:', error);
    throw error;
  }
};

/**
 * Reject dealer
 */
export const rejectDealer = async (dealerId: string, reason: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    dealer.status = 'rejected';
    dealer.rejectionReason = reason;
    await dealer.save();

    logger.info(`Dealer rejected: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error rejecting dealer:', error);
    throw error;
  }
};

/**
 * Suspend dealer
 */
export const suspendDealer = async (dealerId: string, reason: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    dealer.status = 'suspended';
    dealer.suspensionReason = reason;
    await dealer.save();

    logger.info(`Dealer suspended: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error suspending dealer:', error);
    throw error;
  }
};

/**
 * Get dealer orders
 */
export const getDealerOrders = async (
  dealerId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ orders: any[]; pagination: IPaginationResponse }> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ dealerId: dealerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ dealerId: dealerId }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer orders:', error);
    throw error;
  }
};

/**
 * Create product for dealer
 */
export const createProductForDealer = async (
  userId: string,
  data: ICreateDealerProductRequest,
): Promise<IDealerProduct> => {
  try {
    // Find BusinessRegistration to get the ID (same as dealerMiddleware does)
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found for this dealer');
    }

    // Use BusinessRegistration ID (same as dealer side uses)
    const dealerId = (businessRegistration._id as any).toString();
    const product = await createDealerProduct(dealerId, data);

    logger.info(`Product created for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin`);

    return product;
  } catch (error) {
    logger.error('Error creating product for dealer:', error);
    throw error;
  }
};

/**
 * Get vehicle by ID for admin (no dealer ownership check)
 */
export const getDealerVehicleByIdForAdmin = async (
  vehicleId: string,
): Promise<IDealerVehicle> => {
  try {
    const vehicle = await DealerVehicle.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Convert vehicle document to interface
    const vehicleData: IDealerVehicle = {
      id: (vehicle._id as any).toString(),
      dealerId: vehicle.dealerId,
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      vehicleModel: vehicle.vehicleModel,
      year: vehicle.year,
      price: vehicle.price,
      availability: vehicle.availability,
      images: vehicle.images,
      numberPlate: vehicle.numberPlate,
      mileage: vehicle.mileage,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      description: vehicle.description,
      features: vehicle.features,
      condition: vehicle.condition,
      createdAt: vehicle.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: vehicle.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return vehicleData;
  } catch (error) {
    logger.error('Error getting dealer vehicle by ID for admin:', error);
    throw error;
  }
};

/**
 * Create vehicle for dealer
 */
export const createVehicleForDealer = async (
  userId: string,
  data: ICreateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    // Check if business registration exists
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    // Use business registration ID as dealerId if exists, otherwise use userId
    const dealerId = businessRegistration
      ? (businessRegistration._id as any).toString()
      : userId;

    const vehicle = await createDealerVehicle(dealerId, data);

    logger.info(
      `Vehicle created for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin. Business registration: ${businessRegistration ? 'exists' : 'not found, using userId as dealerId'}`,
    );

    return vehicle;
  } catch (error) {
    logger.error('Error creating vehicle for dealer:', error);
    throw error;
  }
};

/**
 * Create business registration for dealer
 */
export const createBusinessRegistrationForDealer = async (
  userId: string,
  data: ICreateBusinessRegistrationRequest,
): Promise<IBusinessRegistration> => {
  try {
    // Check if user already has a registration
    const existing = await BusinessRegistration.findOne({ userId });

    if (existing) {
      throw new ConflictError('Business registration already exists for this user');
    }

    const registration = await createBusinessRegistration(userId, data);

    logger.info(`Business registration created for dealer (userId: ${userId}) by admin`);

    return registration;
  } catch (error) {
    logger.error('Error creating business registration for dealer:', error);
    throw error;
  }
};

/**
 * Update product for dealer
 */
export const updateProductForDealer = async (
  userId: string,
  productId: string,
  data: IUpdateDealerProductRequest,
): Promise<IDealerProduct> => {
  try {
    // Find BusinessRegistration to get the ID (same as dealerMiddleware does)
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found for this dealer');
    }

    // Use BusinessRegistration ID (same as dealer side uses)
    const dealerId = (businessRegistration._id as any).toString();
    const product = await updateDealerProduct(productId, dealerId, data);

    logger.info(`Product updated for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin`);

    return product;
  } catch (error) {
    logger.error('Error updating product for dealer:', error);
    throw error;
  }
};

/**
 * Update vehicle for dealer
 */
export const updateVehicleForDealer = async (
  userId: string,
  vehicleId: string,
  data: IUpdateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found for this dealer');
    }

    const dealerId = (businessRegistration._id as any).toString();
    const vehicle = await updateDealerVehicle(vehicleId, dealerId, data);

    logger.info(`Vehicle updated for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin`);

    return vehicle;
  } catch (error) {
    logger.error('Error updating vehicle for dealer:', error);
    throw error;
  }
};

/**
 * Update business registration for dealer (admin can update any registration)
 */
export const updateBusinessRegistrationForDealer = async (
  userId: string,
  data: IUpdateBusinessRegistrationRequest,
): Promise<IBusinessRegistration> => {
  try {
    // Find business registration by userId
    const registration = await BusinessRegistration.findOne({ userId });

    if (!registration) {
      throw new NotFoundError('Business registration not found for this user');
    }

    // Admin can update any field without ownership checks or status restrictions
    if (data.businessName !== undefined) {
      if (!data.businessName.trim()) {
        throw new NotFoundError('Business name cannot be empty');
      }
      registration.businessName = data.businessName.trim();
    }

    if (data.type !== undefined) {
      registration.type = data.type;
    }

    if (data.address !== undefined) {
      if (!data.address.trim()) {
        throw new NotFoundError('Address cannot be empty');
      }
      registration.address = data.address.trim();
    }

    if (data.phone !== undefined) {
      if (!data.phone.trim()) {
        throw new NotFoundError('Phone number cannot be empty');
      }
      registration.phone = data.phone.trim();
    }

    if (data.gst !== undefined) {
      registration.gst = data.gst?.trim() || undefined;
    }

    await registration.save();

    logger.info(`Business registration updated for dealer (userId: ${userId}) by admin`);

    return businessRegistrationToInterface(registration);
  } catch (error) {
    logger.error('Error updating business registration for dealer:', error);
    throw error;
  }
};

