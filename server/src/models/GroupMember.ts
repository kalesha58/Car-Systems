import mongoose, { Document, Schema } from 'mongoose';

export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'pending';

export interface IGroupMemberDocument extends Document {
  groupId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMemberDocument>(
  {
    groupId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['active', 'pending'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ groupId: 1 });
groupMemberSchema.index({ userId: 1 });
groupMemberSchema.index({ status: 1 });

export const GroupMember = mongoose.model<IGroupMemberDocument>(
  'GroupMember',
  groupMemberSchema,
);


