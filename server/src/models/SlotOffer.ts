import mongoose, { Document, Schema } from 'mongoose';

export type SlotOfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface ISlotOfferDocument extends Document {
  slotId: string;
  serviceId: string;
  freedByBookingId: string;
  targetBookingId: string;
  targetUserId: string;
  slotDate: string;
  slotStartTime: string;
  status: SlotOfferStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const slotOfferSchema = new Schema<ISlotOfferDocument>(
  {
    slotId: { type: String, required: true, index: true },
    serviceId: { type: String, required: true, index: true },
    freedByBookingId: { type: String, required: true },
    targetBookingId: { type: String, required: true, index: true },
    targetUserId: { type: String, required: true, index: true },
    slotDate: { type: String, required: true },
    slotStartTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

slotOfferSchema.index({ targetUserId: 1, status: 1 });

export const SlotOffer = mongoose.model<ISlotOfferDocument>('SlotOffer', slotOfferSchema);
