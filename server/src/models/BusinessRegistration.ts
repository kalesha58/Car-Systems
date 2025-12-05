import mongoose, { Document, Schema } from 'mongoose';

export type DealerType =
  | 'Automobile Showroom'
  | 'Vehicle Wash Station'
  | 'Detailing Center'
  | 'Mechanic Workshop'
  | 'Spare Parts Dealer'
  | 'Riding Gear Store';

export type BusinessRegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface IBusinessRegistrationDocument extends Document {
  businessName: string;
  type: DealerType;
  address: string;
  phone: string;
  gst?: string;
  status: BusinessRegistrationStatus;
  approvalCode?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const businessRegistrationSchema = new Schema<IBusinessRegistrationDocument>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'Automobile Showroom',
        'Vehicle Wash Station',
        'Detailing Center',
        'Mechanic Workshop',
        'Spare Parts Dealer',
        'Riding Gear Store',
      ],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gst: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvalCode: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
businessRegistrationSchema.index({ userId: 1 }, { unique: true });
businessRegistrationSchema.index({ status: 1 });

export const BusinessRegistration = mongoose.model<IBusinessRegistrationDocument>(
  'BusinessRegistration',
  businessRegistrationSchema,
);

