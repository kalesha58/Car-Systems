import mongoose, { Document, Schema } from 'mongoose';

export interface IStoryViewDocument extends Document {
  storyId: string;
  viewerUserId: string;
  itemIndex: number;
  viewedAt: Date;
}

const storyViewSchema = new Schema<IStoryViewDocument>(
  {
    storyId: { type: String, required: true, index: true },
    viewerUserId: { type: String, required: true },
    itemIndex: { type: Number, required: true, min: 0 },
    viewedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

storyViewSchema.index({ storyId: 1, viewerUserId: 1, itemIndex: 1 }, { unique: true });
storyViewSchema.index({ storyId: 1, viewedAt: -1 });

export const StoryView = mongoose.model<IStoryViewDocument>('StoryView', storyViewSchema);
