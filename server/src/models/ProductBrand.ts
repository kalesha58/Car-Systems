import mongoose, { Document, Schema } from 'mongoose';

export type ProductBrandStatus = 'active' | 'inactive';

export interface IProductBrandDocument extends Document {
  name: string;
  status: ProductBrandStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const productBrandSchema = new Schema<IProductBrandDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

productBrandSchema.index({ name: 1 }, { unique: true });
productBrandSchema.index({ status: 1 });

export const ProductBrand = mongoose.model<IProductBrandDocument>('ProductBrand', productBrandSchema);
