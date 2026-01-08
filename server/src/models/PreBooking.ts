import mongoose, { Document, Schema } from 'mongoose';

export type PreBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface IPreBookingDocument extends Document {
  userId: string;
  vehicleId: string;
  dealerId: string;
  bookingDate: Date;
  status: PreBookingStatus;
  notes?: string;
  dealerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const preBookingSchema = new Schema<IPreBookingDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    dealerId: {
      type: String,
      required: true,
      index: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
      index: true,
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

// Compound index to prevent overlapping pre-bookings (same vehicle, same date)
// Only for confirmed or pending statuses
preBookingSchema.index({ vehicleId: 1, bookingDate: 1, status: 1 });

// Index for dealer queries
preBookingSchema.index({ dealerId: 1, status: 1 });

export const PreBooking = mongoose.model<IPreBookingDocument>('PreBooking', preBookingSchema);

