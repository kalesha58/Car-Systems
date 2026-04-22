import { Dealer, IDealerDocument } from '../../models/Dealer';
import { Order } from '../../models/Order';
import { BusinessRegistration, IBusinessRegistrationDocument } from '../../models/BusinessRegistration';
import { SignUp, ISignUpDocument } from '../../models/SignUp';
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

const toIdString = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'toString' in v && typeof (v as { toString: () => string }).toString === 'function') {
    return (v as { toString: () => string }).toString();
  }
  return String(v);
};

const mapBusinessRegistrationToDealer = (
  reg: IBusinessRegistrationDocument,
  user: ISignUpDocument | null | undefined,
): IDealer => {
  let finalStatus: 'approved' | 'pending' | 'suspended' | 'rejected' = reg.status as 'approved' | 'pending' | 'rejected';
  if (reg.status === 'approved') {
    const st = user?.status as string | undefined;
    if (st === 'inactive' || st === 'suspended' || st === 'blocked') {
      finalStatus = 'suspended';
    }
  }
  const userIdStr = (user && toIdString(user._id)) || toIdString(reg.userId);
  return {
    id: userIdStr,
    businessRegistrationId: (reg._id as any).toString(),
    name: user?.name || reg.businessName,
    businessName: reg.businessName,
    email: user?.email || '',
    phone: reg.phone || user?.phone || '',
    status: finalStatus,
    location: reg.location ? `${reg.location.latitude},${reg.location.longitude}` : reg.address,
    address: reg.address,
    dealerType: reg.type,
    registrationDate: reg.createdAt?.toISOString(),
    approvalDate: reg.status === 'approved' ? reg.updatedAt?.toISOString() : undefined,
    createdAt: reg.createdAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all dealers with pagination and filters
 */
export const getDealers = async (
  query: IGetDealersRequest,
): Promise<{ dealers: IDealer[]; pagination: IPaginationResponse }> => {
  try {
    const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
    const limitRaw = Number.parseInt(String(query.limit ?? '10'), 10) || 10;
    const limit = Math.min(100, Math.max(1, limitRaw));
    const skip = (page - 1) * limit;

    const clauses: Record<string, unknown>[] = [];

    if (query.status === 'suspended') {
      const suspendedUsers = await SignUp.find({
        role: { $in: ['dealer'] },
        status: { $in: ['inactive', 'suspended', 'blocked'] },
      }).select('_id');
      const ids = suspendedUsers.map((u) => toIdString(u._id));
      if (ids.length === 0) {
        return {
          dealers: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      clauses.push({ userId: { $in: ids }, status: 'approved' });
    } else if (query.status && query.status !== 'all') {
      clauses.push({ status: query.status });
    }

    if (query.dealerType && query.dealerType !== 'all') {
      clauses.push({ type: query.dealerType });
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      const users = await SignUp.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = users.map((u) => toIdString(u._id));
      clauses.push({
        $or: [{ businessName: { $regex: search, $options: 'i' } }, { userId: { $in: userIds } }],
      });
    }

    const filter: Record<string, unknown> =
      clauses.length > 1 ? { $and: clauses } : clauses.length === 1 ? clauses[0]! : {};

    const sortBy = query.sortBy === 'name' ? 'businessName' : query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const [registrations, total] = await Promise.all([
      BusinessRegistration.find(filter).sort(sort).skip(skip).limit(limit),
      BusinessRegistration.countDocuments(filter),
    ]);

    const registrationUserIds = [...new Set(registrations.map((reg) => toIdString(reg.userId)))];
    const users = await SignUp.find({ _id: { $in: registrationUserIds } });

    const userMap = new Map<string, ISignUpDocument>();
    users.forEach((u) => {
      userMap.set(toIdString(u._id), u);
    });

    const mappedDealers: IDealer[] = registrations.map((reg) =>
      mapBusinessRegistrationToDealer(reg, userMap.get(toIdString(reg.userId))),
    );

    return {
      dealers: mappedDealers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting dealers:', error);
    throw error;
  }
};

/**
 * Get dealer by ID
 * Accepts SignUp user id (preferred), BusinessRegistration document id, or legacy Dealer document id.
 */
export const getDealerById = async (dealerId: string): Promise<IDealer> => {
  try {
    const userById = await SignUp.findById(dealerId);
    if (userById?.role?.includes('dealer')) {
      const reg = await BusinessRegistration.findOne({ userId: toIdString(userById._id) });
      if (reg) {
        const dealerData = mapBusinessRegistrationToDealer(reg, userById);
        const orderDealerIds = [toIdString(reg._id), dealerId].filter(Boolean);
        dealerData.orders = await Order.find({ dealerId: { $in: orderDealerIds } }).limit(10);
        return dealerData;
      }
      return {
        id: toIdString(userById._id),
        name: userById.name,
        businessName: userById.name,
        email: userById.email,
        phone: userById.phone,
        status: 'pending',
        createdAt: userById.createdAt?.toISOString() || new Date().toISOString(),
      };
    }

    const regByDoc = await BusinessRegistration.findById(dealerId);
    if (regByDoc) {
      const user = await SignUp.findById(regByDoc.userId);
      const dealerData = mapBusinessRegistrationToDealer(regByDoc, user || undefined);
      const orderDealerIds = [toIdString(regByDoc._id), toIdString(regByDoc.userId)].filter(Boolean);
      dealerData.orders = await Order.find({ dealerId: { $in: orderDealerIds } }).limit(10);
      return dealerData;
    }

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    const user = await SignUp.findOne({ email: dealer.email });
    let businessReg = null;
    if (user) {
      const userId = toIdString(user._id);
      businessReg = await BusinessRegistration.findOne({ userId });
    }

    const dealerData = dealerToIDealer(dealer, businessReg);
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
    const legacy = await Dealer.findById(dealerId);
    if (legacy) {
      legacy.status = 'approved';
      await legacy.save();
      logger.info(`Dealer approved (legacy): ${legacy.email}`);
      return dealerToIDealer(legacy);
    }

    let reg = await BusinessRegistration.findOne({ userId: dealerId });
    if (!reg) {
      reg = await BusinessRegistration.findById(dealerId);
    }
    if (reg) {
      reg.status = 'approved';
      await reg.save();
      const user = await SignUp.findById(reg.userId);
      logger.info(`Business registration approved for userId: ${reg.userId}`);
      return mapBusinessRegistrationToDealer(reg, user || undefined);
    }

    throw new NotFoundError('Dealer not found');
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
    const legacy = await Dealer.findById(dealerId);
    if (legacy) {
      legacy.status = 'rejected';
      legacy.rejectionReason = reason;
      await legacy.save();
      logger.info(`Dealer rejected (legacy): ${legacy.email}`);
      return dealerToIDealer(legacy);
    }

    let reg = await BusinessRegistration.findOne({ userId: dealerId });
    if (!reg) {
      reg = await BusinessRegistration.findById(dealerId);
    }
    if (reg) {
      reg.status = 'rejected';
      await reg.save();
      const user = await SignUp.findById(reg.userId);
      logger.info(`Business registration rejected for userId: ${reg.userId}`);
      const mapped = mapBusinessRegistrationToDealer(reg, user || undefined);
      mapped.suspensionReason = reason;
      return mapped;
    }

    throw new NotFoundError('Dealer not found');
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
    const legacy = await Dealer.findById(dealerId);
    if (legacy) {
      legacy.status = 'suspended';
      legacy.suspensionReason = reason;
      await legacy.save();
      logger.info(`Dealer suspended (legacy): ${legacy.email}`);
      return dealerToIDealer(legacy);
    }

    let reg = await BusinessRegistration.findOne({ userId: dealerId });
    if (!reg) {
      reg = await BusinessRegistration.findById(dealerId);
    }
    if (reg) {
      const user = await SignUp.findById(reg.userId);
      if (user) {
        user.status = 'suspended';
        await user.save();
      }
      const mapped = mapBusinessRegistrationToDealer(reg, user || undefined);
      mapped.status = 'suspended';
      mapped.suspensionReason = reason;
      logger.info(`Dealer user suspended for userId: ${reg.userId}`);
      return mapped;
    }

    throw new NotFoundError('Dealer not found');
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
    const pageNum = Math.max(1, Number.parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const dealerIds: string[] = [];

    const legacy = await Dealer.findById(dealerId);
    if (legacy) {
      dealerIds.push(dealerId);
    }

    const user = await SignUp.findById(dealerId);
    if (user?.role?.includes('dealer')) {
      const br = await BusinessRegistration.findOne({ userId: toIdString(user._id) });
      if (br) dealerIds.push(toIdString(br._id));
    }

    const reg = await BusinessRegistration.findById(dealerId);
    if (reg) {
      dealerIds.push(toIdString(reg._id));
    }

    const uniqueDealerIds = [...new Set(dealerIds.filter(Boolean))];
    if (uniqueDealerIds.length === 0) {
      throw new NotFoundError('Dealer not found');
    }

    const orderQuery = { dealerId: { $in: uniqueDealerIds } };

    const [orders, total] = await Promise.all([
      Order.find(orderQuery).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(orderQuery),
    ]);

    return {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 0,
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
      allowTestDrive: vehicle.allowTestDrive,
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

