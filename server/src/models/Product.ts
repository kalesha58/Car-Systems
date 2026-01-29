import mongoose, { Document, Schema } from 'mongoose';

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface IProductDocument extends Document {
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock: number;
  status: ProductStatus;
  images: string[];
  description?: string;
  vehicleType?: string;
  tags: string[];
  specifications: Record<string, any>;
  userId: string;
  deliveryTimeMinutes?: number;
  isSparePart?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active',
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    vehicleType: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    userId: {
      type: String,
      required: true,
    },
    deliveryTimeMinutes: {
      type: Number,
      min: 0,
    },
    isSparePart: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ userId: 1 });
productSchema.index({ vehicleType: 1 });
productSchema.index({ isSparePart: 1 });
productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model<IProductDocument>('Product', productSchema);

