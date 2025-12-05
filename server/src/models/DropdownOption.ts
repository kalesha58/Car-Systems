import mongoose, { Document, Schema } from 'mongoose';

export type DropdownOptionType =
  | 'vehicleType'
  | 'fuelType'
  | 'transmission'
  | 'condition'
  | 'availability'
  | 'businessType';

export interface IDropdownOptionDocument extends Document {
  type: DropdownOptionType;
  label: string;
  value: string;
  order: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const dropdownOptionSchema = new Schema<IDropdownOptionDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ['vehicleType', 'fuelType', 'transmission', 'condition', 'availability', 'businessType'],
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
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
dropdownOptionSchema.index({ type: 1, value: 1 }, { unique: true });
dropdownOptionSchema.index({ type: 1 });
dropdownOptionSchema.index({ status: 1 });
dropdownOptionSchema.index({ order: 1 });

export const DropdownOption = mongoose.model<IDropdownOptionDocument>('DropdownOption', dropdownOptionSchema);

