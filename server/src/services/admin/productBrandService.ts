import { ProductBrand, IProductBrandDocument } from '../../models/ProductBrand';
import { Product } from '../../models/Product';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IProductBrand {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  products?: number;
  createdAt: string;
}

export interface IGetProductBrandsRequest {
  search?: string;
  status?: 'active' | 'inactive';
}

export interface ICreateProductBrandRequest {
  name: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface IUpdateProductBrandRequest {
  name?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

const productBrandToInterface = async (doc: IProductBrandDocument): Promise<IProductBrand> => {
  const products = await Product.countDocuments({ brand: doc.name });

  return {
    id: (doc._id as any).toString(),
    name: doc.name,
    status: doc.status,
    sortOrder: doc.sortOrder ?? 0,
    products,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

export const getProductBrands = async (query: IGetProductBrandsRequest): Promise<IProductBrand[]> => {
  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  if (query.status) {
    filter.status = query.status;
  }

  const brands = await ProductBrand.find(filter).sort({ sortOrder: 1, name: 1 });
  return Promise.all(brands.map(productBrandToInterface));
};

export const getProductBrandById = async (id: string): Promise<IProductBrand> => {
  const doc = await ProductBrand.findById(id);
  if (!doc) {
    throw new NotFoundError('Product brand not found');
  }
  return productBrandToInterface(doc);
};

export const createProductBrand = async (data: ICreateProductBrandRequest): Promise<IProductBrand> => {
  const existing = await ProductBrand.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
  if (existing) {
    throw new ConflictError('Product brand with this name already exists');
  }

  const doc = new ProductBrand({
    name: data.name.trim(),
    status: data.status || 'active',
    sortOrder: data.sortOrder ?? 0,
  });

  await doc.save();
  logger.info(`Product brand created: ${doc.name}`);
  return productBrandToInterface(doc);
};

export const updateProductBrand = async (
  id: string,
  data: IUpdateProductBrandRequest,
): Promise<IProductBrand> => {
  const doc = await ProductBrand.findById(id);
  if (!doc) {
    throw new NotFoundError('Product brand not found');
  }

  const previousName = doc.name;

  if (data.name !== undefined) {
    const existing = await ProductBrand.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictError('Product brand with this name already exists');
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

  if (data.name !== undefined && data.name.trim() !== previousName) {
    await Product.updateMany({ brand: previousName }, { brand: doc.name });
  }

  return productBrandToInterface(doc);
};

export const deleteProductBrand = async (id: string): Promise<void> => {
  const doc = await ProductBrand.findById(id);
  if (!doc) {
    throw new NotFoundError('Product brand not found');
  }

  const inUse = await Product.countDocuments({ brand: doc.name });
  if (inUse > 0) {
    throw new ConflictError('Cannot delete product brand that is used by products');
  }

  await ProductBrand.findByIdAndDelete(id);
  logger.info(`Product brand deleted: ${id}`);
};
