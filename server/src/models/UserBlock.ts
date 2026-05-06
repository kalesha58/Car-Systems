import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBlockDocument extends Document {
  blockerId: string;
  blockedId: string;
  createdAt: Date;
  updatedAt: Date;
}

const userBlockSchema = new Schema<IUserBlockDocument>(
  {
    blockerId: { type: String, required: true, index: true },
    blockedId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

userBlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const UserBlock = mongoose.model<IUserBlockDocument>('UserBlock', userBlockSchema);
