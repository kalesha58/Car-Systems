import mongoose, { Document, Schema } from 'mongoose';

export type ServiceBookingStatus = 'new' | 'scheduled' | 'in_progress' | 'awaiting' | 'completed' | 'cancelled';

export interface IServiceBookingDocument extends Document {
  userId: string;
  dealerId: string;
  serviceId: string;
  vehicleId?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  bookingDate: Date;
  bookingTime?: string; // HH:mm format
  serviceRequest: string; // e.g., "General Service, Oil Change"
  status: ServiceBookingStatus;
  assignedMechanic?: string;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  dealerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceBookingSchema = new Schema<IServiceBookingDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    dealerId: {
      type: String,
      required: true,
      index: true,
    },
    serviceId: {
      type: String,
      required: true,
      index: true,
    },
    vehicleId: {
      type: String,
      index: true,
    },
    vehicleInfo: {
      brand: { type: String, trim: true },
      model: { type: String, trim: true },
      registrationNumber: { type: String, trim: true },
    },
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    bookingTime: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:mm format (e.g., 14:30)',
      },
    },
    serviceRequest: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'scheduled', 'in_progress', 'awaiting', 'completed', 'cancelled'],
      default: 'new',
      index: true,
    },
    assignedMechanic: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    notes: {
      type: String,
      trim: true,
    },
    dealerNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
serviceBookingSchema.index({ dealerId: 1, status: 1 });
serviceBookingSchema.index({ dealerId: 1, bookingDate: 1 });
serviceBookingSchema.index({ userId: 1 });
serviceBookingSchema.index({ serviceId: 1 });
serviceBookingSchema.index({ createdAt: -1 });

export const ServiceBooking = mongoose.model<IServiceBookingDocument>(
  'ServiceBooking',
  serviceBookingSchema,
);
