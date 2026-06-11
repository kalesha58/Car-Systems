import { BatteryType, IBatteryTypeDocument } from '../../models/BatteryType';
import { Product } from '../../models/Product';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IBatteryType {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  products?: number;
  createdAt: string;
}

export interface IGetBatteryTypesRequest {
  search?: string;
  status?: 'active' | 'inactive';
}

export interface ICreateBatteryTypeRequest {
  name: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface IUpdateBatteryTypeRequest {
  name?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

const batteryTypeToInterface = async (doc: IBatteryTypeDocument): Promise<IBatteryType> => {
  const products = await Product.countDocuments({ batteryTypeId: (doc._id as any).toString() });

  return {
    id: (doc._id as any).toString(),
    name: doc.name,
    status: doc.status,
    sortOrder: doc.sortOrder ?? 0,
    products,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

export const getBatteryTypes = async (query: IGetBatteryTypesRequest): Promise<IBatteryType[]> => {
  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  if (query.status) {
    filter.status = query.status;
  }

  const types = await BatteryType.find(filter).sort({ sortOrder: 1, name: 1 });
  return Promise.all(types.map(batteryTypeToInterface));
};

export const getBatteryTypeById = async (id: string): Promise<IBatteryType> => {
  const doc = await BatteryType.findById(id);
  if (!doc) {
    throw new NotFoundError('Battery type not found');
  }
  return batteryTypeToInterface(doc);
};

export const createBatteryType = async (data: ICreateBatteryTypeRequest): Promise<IBatteryType> => {
  const existing = await BatteryType.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
  if (existing) {
    throw new ConflictError('Battery type with this name already exists');
  }

  const doc = new BatteryType({
    name: data.name.trim(),
    status: data.status || 'active',
    sortOrder: data.sortOrder ?? 0,
  });

  await doc.save();
  logger.info(`Battery type created: ${doc.name}`);
  return batteryTypeToInterface(doc);
};

export const updateBatteryType = async (
  id: string,
  data: IUpdateBatteryTypeRequest,
): Promise<IBatteryType> => {
  const doc = await BatteryType.findById(id);
  if (!doc) {
    throw new NotFoundError('Battery type not found');
  }

  if (data.name !== undefined) {
    const existing = await BatteryType.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictError('Battery type with this name already exists');
    }
    doc.name = data.name.trim();
  }

  if (data.status !== undefined) {
    doc.status = data.status;
  }

  if (data.sortOrder !== undefined) {
    doc.sortOrder = data.sortOrder;
  }

  await doc.save();
  return batteryTypeToInterface(doc);
};

export const deleteBatteryType = async (id: string): Promise<void> => {
  const doc = await BatteryType.findById(id);
  if (!doc) {
    throw new NotFoundError('Battery type not found');
  }

  const inUse = await Product.countDocuments({ batteryTypeId: id });
  if (inUse > 0) {
    throw new ConflictError('Cannot delete battery type that is used by products');
  }

  await BatteryType.findByIdAndDelete(id);
  logger.info(`Battery type deleted: ${id}`);
};
