import mongoose, { Document, Schema } from 'mongoose';

export type VehicleBrandType = 'Car' | 'Bike';

export interface IVehicleBrandDocument extends Document {
  name: string;
  type: VehicleBrandType;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const vehicleBrandSchema = new Schema<IVehicleBrandDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Car', 'Bike'],
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
vehicleBrandSchema.index({ name: 1, type: 1 }, { unique: true });
vehicleBrandSchema.index({ type: 1 });
vehicleBrandSchema.index({ status: 1 });

export const VehicleBrand = mongoose.model<IVehicleBrandDocument>('VehicleBrand', vehicleBrandSchema);

