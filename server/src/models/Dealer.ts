import mongoose, { Document, Schema } from 'mongoose';

export type DealerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface IPayoutCredentials {
  type: 'UPI' | 'BANK';
  upiId?: string;
  bank?: {
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}

export interface IDealerDocument extends Document {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: DealerStatus;
  location?: string;
  address?: string;
  documents: {
    businessLicense?: string;
    taxId?: string;
    other?: string[];
  };
  payout?: IPayoutCredentials;
  rejectionReason?: string;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dealerSchema = new Schema<IDealerDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    location: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    documents: {
      businessLicense: { type: String },
      taxId: { type: String },
      other: { type: [String], default: [] },
    },
    payout: {
      type: {
        type: String,
        enum: ['UPI', 'BANK'],
      },
      upiId: {
        type: String,
        trim: true,
        match: [/^[\w.-]+@[\w]+$/, 'Invalid UPI ID format'],
      },
      bank: {
        accountNumber: { type: String, trim: true },
        ifsc: {
          type: String,
          trim: true,
          uppercase: true,
          match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'],
        },
        accountName: { type: String, trim: true },
      },
    },
    rejectionReason: {
      type: String,
    },
    suspensionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
dealerSchema.index({ email: 1 }, { unique: true });
dealerSchema.index({ status: 1 });
dealerSchema.index({ location: 1 });

export const Dealer = mongoose.model<IDealerDocument>('Dealer', dealerSchema);

