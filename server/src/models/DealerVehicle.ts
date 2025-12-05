import mongoose, { Document, Schema } from 'mongoose';

export type VehicleType = 'Car' | 'Bike';
export type VehicleAvailability = 'available' | 'sold' | 'reserved';
export type VehicleCondition = 'New' | 'Used' | 'Certified Pre-owned';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type TransmissionType = 'Manual' | 'Automatic';

export interface IDealerVehicleDocument extends Document {
  dealerId: string;
  vehicleType: VehicleType;
  brand: string;
  vehicleModel: string;
  year: number;
  price: number;
  availability: VehicleAvailability;
  images: string[];
  numberPlate?: string;
  mileage?: number;
  color?: string;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  description?: string;
  features?: string[];
  condition?: VehicleCondition;
  allowTestDrive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dealerVehicleSchema = new Schema<IDealerVehicleDocument>(
  {
    dealerId: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ['Car', 'Bike'],
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    availability: {
      type: String,
      required: true,
      enum: ['available', 'sold', 'reserved'],
      default: 'available',
    },
    images: {
      type: [String],
      required: true,
      default: [],
    },
    numberPlate: {
      type: String,
      trim: true,
      uppercase: true,
    },
    mileage: {
      type: Number,
      min: 0,
    },
    color: {
      type: String,
      trim: true,
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    },
    transmission: {
      type: String,
      enum: ['Manual', 'Automatic'],
    },
    description: {
      type: String,
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    condition: {
      type: String,
      enum: ['New', 'Used', 'Certified Pre-owned'],
    },
    allowTestDrive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
dealerVehicleSchema.index({ dealerId: 1 });
dealerVehicleSchema.index({ availability: 1 });
dealerVehicleSchema.index({ vehicleType: 1 });
dealerVehicleSchema.index({ brand: 1 });
dealerVehicleSchema.index({ price: 1 });
dealerVehicleSchema.index({ year: 1 });

export const DealerVehicle = mongoose.model<IDealerVehicleDocument>('DealerVehicle', dealerVehicleSchema);

