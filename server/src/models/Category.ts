import mongoose, { Document, Schema } from 'mongoose';

export type CategoryStatus = 'active' | 'inactive';

/** Optional: used by Store home tiles to group rows (products / vehicles / services). */
export type CategoryTileGroup = 'products' | 'vehicles' | 'services';

export interface ICategoryDocument extends Document {
  name: string;
  description?: string;
  status: CategoryStatus;
  /** HTTPS URL for Store category tile image */
  imageUrl?: string;
  /** Lower sorts first within the same tile group */
  sortOrder?: number;
  /** When set, this category appears in that row on the customer Store home */
  tileGroup?: CategoryTileGroup;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    tileGroup: {
      type: String,
      enum: ['products', 'vehicles', 'services'],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ status: 1 });
categorySchema.index({ tileGroup: 1, sortOrder: 1 });

export const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);

