import mongoose, { Document, Schema } from 'mongoose';

export type BatteryTypeStatus = 'active' | 'inactive';

export interface IBatteryTypeDocument extends Document {
  name: string;
  status: BatteryTypeStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const batteryTypeSchema = new Schema<IBatteryTypeDocument>(
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

batteryTypeSchema.index({ name: 1 }, { unique: true });
batteryTypeSchema.index({ status: 1 });

export const BatteryType = mongoose.model<IBatteryTypeDocument>('BatteryType', batteryTypeSchema);
