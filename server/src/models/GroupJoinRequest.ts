import mongoose, { Document, Schema } from 'mongoose';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IGroupJoinRequestDocument extends Document {
  groupId: string;
  userId: string;
  status: JoinRequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupJoinRequestSchema = new Schema<IGroupJoinRequestDocument>(
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
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    respondedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
groupJoinRequestSchema.index({ groupId: 1, status: 1 });
groupJoinRequestSchema.index({ userId: 1, status: 1 });
groupJoinRequestSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const GroupJoinRequest = mongoose.model<IGroupJoinRequestDocument>(
  'GroupJoinRequest',
  groupJoinRequestSchema,
);

