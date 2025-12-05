import mongoose, { Document, Schema } from 'mongoose';

export type CategoryStatus = 'active' | 'inactive';

export interface ICategoryDocument extends Document {
  name: string;
  description?: string;
  status: CategoryStatus;
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
  },
  {
    timestamps: true,
  },
);

// Indexes
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ status: 1 });

export const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);

