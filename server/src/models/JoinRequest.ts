import mongoose, { Document, Schema } from 'mongoose';

export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IJoinRequestDocument extends Document {
  groupId: string;
  userId: string;
  status: JoinRequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const joinRequestSchema = new Schema<IJoinRequestDocument>(
  {
    groupId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

joinRequestSchema.index({ groupId: 1, userId: 1 }, { unique: true });
joinRequestSchema.index({ groupId: 1 });
joinRequestSchema.index({ userId: 1 });
joinRequestSchema.index({ status: 1 });
joinRequestSchema.index({ requestedAt: -1 });

export const JoinRequest = mongoose.model<IJoinRequestDocument>(
  'JoinRequest',
  joinRequestSchema,
);


