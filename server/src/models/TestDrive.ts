import mongoose, { Document, Schema } from 'mongoose';

export type TestDriveStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface ITestDriveDocument extends Document {
  userId: string;
  vehicleId: string;
  dealerId: string;
  preferredDate: Date;
  preferredTime: string; // Format: "HH:mm" (e.g., "14:30")
  status: TestDriveStatus;
  notes?: string;
  dealerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const testDriveSchema = new Schema<ITestDriveDocument>(
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
    preferredDate: {
      type: Date,
      required: true,
      index: true,
    },
    preferredTime: {
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
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
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

// Compound index to prevent overlapping test drives (same vehicle, same date/time)
testDriveSchema.index({ vehicleId: 1, preferredDate: 1, preferredTime: 1 }, { unique: false });

// Index for dealer queries
testDriveSchema.index({ dealerId: 1, status: 1 });

export const TestDrive = mongoose.model<ITestDriveDocument>('TestDrive', testDriveSchema);



