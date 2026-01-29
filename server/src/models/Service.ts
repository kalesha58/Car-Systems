import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceDocument extends Document {
  dealerId: string;
  name: string;
  price: number;
  durationMinutes: number;
  homeService: boolean;
  description?: string;
  category?: string;
  images: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isActive: boolean;
  serviceType?: 'car_wash' | 'car_detailing' | 'car_automobile' | 'bike_automobile' | 'general';
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleBrand?: string;
  serviceSubCategory?: string;
  slotDurationMinutes?: number;
  slotBookingEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IServiceDocument>(
  {
    dealerId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    homeService: {
      type: Boolean,
      required: true,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    serviceType: {
      type: String,
      trim: true,
      enum: ['car_wash', 'car_detailing', 'car_automobile', 'bike_automobile', 'general'],
    },
    vehicleType: {
      type: String,
      trim: true,
      enum: ['Car', 'Bike'],
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    vehicleBrand: {
      type: String,
      trim: true,
    },
    serviceSubCategory: {
      type: String,
      trim: true,
    },
    slotDurationMinutes: {
      type: Number,
      min: 1,
    },
    slotBookingEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
serviceSchema.index({ dealerId: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ homeService: 1 });
serviceSchema.index({ serviceType: 1 });
serviceSchema.index({ vehicleType: 1 });
serviceSchema.index({ vehicleModel: 1 });
serviceSchema.index({ vehicleBrand: 1 });
serviceSchema.index({ serviceSubCategory: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

export const Service = mongoose.model<IServiceDocument>('Service', serviceSchema);

