import mongoose, { Document, Schema } from 'mongoose';

export type VehicleAlertReasonCode = 'blocking' | 'wrong_parking' | 'emergency' | 'other';
export type VehicleAlertStatus = 'open' | 'resolved' | 'dismissed';

export interface IVehicleAlertDocument extends Document {
  reporterId: string;
  ownerId: string;
  vehicleId: string;
  numberPlate: string;
  reasonCode: VehicleAlertReasonCode;
  customMessage?: string;
  status: VehicleAlertStatus;
  chatId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleAlertSchema = new Schema<IVehicleAlertDocument>(
  {
    reporterId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    numberPlate: { type: String, required: true, uppercase: true, trim: true },
    reasonCode: {
      type: String,
      enum: ['blocking', 'wrong_parking', 'emergency', 'other'],
      required: true,
    },
    customMessage: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['open', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    chatId: { type: String, index: true },
  },
  { timestamps: true },
);

vehicleAlertSchema.index({ reporterId: 1, createdAt: -1 });
vehicleAlertSchema.index({ ownerId: 1, status: 1 });

export const VehicleAlert = mongoose.model<IVehicleAlertDocument>(
  'VehicleAlert',
  vehicleAlertSchema,
);

export const VEHICLE_ALERT_REASONS: Array<{
  code: VehicleAlertReasonCode;
  label: string;
}> = [
  { code: 'blocking', label: 'Your vehicle is blocking' },
  { code: 'wrong_parking', label: 'You parked in our parking lot' },
  { code: 'emergency', label: "There's an emergency with your vehicle" },
  { code: 'other', label: 'Other' },
];
