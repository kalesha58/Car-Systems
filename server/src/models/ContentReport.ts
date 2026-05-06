import mongoose, { Document, Schema } from 'mongoose';

export type ReportTargetType = 'post' | 'comment' | 'message' | 'user';
export type ReportStatus = 'open' | 'under_review' | 'actioned' | 'dismissed';

export interface IContentReportDocument extends Document {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string;
  reason: string;
  note?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewNote?: string;
  actionTaken?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contentReportSchema = new Schema<IContentReportDocument>(
  {
    reporterId: { type: String, required: true, index: true },
    targetType: { type: String, enum: ['post', 'comment', 'message', 'user'], required: true, index: true },
    targetId: { type: String, required: true, index: true },
    targetOwnerId: { type: String, index: true },
    reason: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    status: { type: String, enum: ['open', 'under_review', 'actioned', 'dismissed'], default: 'open', index: true },
    reviewedBy: { type: String },
    reviewNote: { type: String, trim: true },
    actionTaken: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

contentReportSchema.index({ reporterId: 1, targetType: 1, targetId: 1 });

export const ContentReport = mongoose.model<IContentReportDocument>('ContentReport', contentReportSchema);
