import mongoose, { Document, Schema } from 'mongoose';

export type ServiceSlotType = 'center' | 'home';

export interface IServiceSlotDocument extends Document {
  serviceId: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  serviceType: ServiceSlotType;
  maxBookings: number;
  currentBookings: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSlotSchema = new Schema<IServiceSlotDocument>(
  {
    serviceId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // Validate time format HH:mm
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:mm format (e.g., 14:30)',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // Validate time format HH:mm
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:mm format (e.g., 14:30)',
      },
    },
    serviceType: {
      type: String,
      enum: ['center', 'home'],
      required: true,
    },
    maxBookings: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    currentBookings: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index to prevent duplicate slots
serviceSlotSchema.index({ serviceId: 1, date: 1, startTime: 1, serviceType: 1 }, { unique: true });

// Indexes
serviceSlotSchema.index({ serviceId: 1, date: 1 });
serviceSlotSchema.index({ isAvailable: 1 });

export const ServiceSlot = mongoose.model<IServiceSlotDocument>('ServiceSlot', serviceSlotSchema);
