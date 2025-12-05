import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicleModelDocument extends Document {
  brandId: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const vehicleModelSchema = new Schema<IVehicleModelDocument>(
  {
    brandId: {
      type: String,
      required: true,
    },
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
  },
  {
    timestamps: true,
  },
);

// Indexes
vehicleModelSchema.index({ brandId: 1, name: 1 }, { unique: true });
vehicleModelSchema.index({ brandId: 1 });
vehicleModelSchema.index({ status: 1 });

export const VehicleModel = mongoose.model<IVehicleModelDocument>('VehicleModel', vehicleModelSchema);

