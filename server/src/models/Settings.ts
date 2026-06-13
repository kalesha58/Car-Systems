import mongoose, { Document, Schema } from 'mongoose';
import { IStoreBannersConfig, IVisualEffectsConfig } from '../types/admin';
import { DEFAULT_VISUAL_EFFECTS } from '../constants/visualEffectsDefaults';
import { DEFAULT_STORE_BANNERS } from '../constants/storeBannersDefaults';

export interface ISettingsDocument extends Document {
  siteName: string;
  siteEmail: string;
  currency: string;
  taxRate: number;
  shippingCost: number;
  visualEffects: IVisualEffectsConfig;
  storeBanners: IStoreBannersConfig;
  updatedAt: Date;
}

const rainNoticeSchema = new Schema(
  {
    enabled: { type: Boolean, default: DEFAULT_VISUAL_EFFECTS.rainNotice.enabled },
    autoShowOnHomeLoad: { type: Boolean, default: DEFAULT_VISUAL_EFFECTS.rainNotice.autoShowOnHomeLoad },
    autoHideAfterMs: { type: Number, default: DEFAULT_VISUAL_EFFECTS.rainNotice.autoHideAfterMs, min: 0 },
    title: { type: String, default: DEFAULT_VISUAL_EFFECTS.rainNotice.title },
    subtitle: { type: String, default: DEFAULT_VISUAL_EFFECTS.rainNotice.subtitle },
  },
  { _id: false },
);

const visualEffectsSchema = new Schema(
  {
    enabled: { type: Boolean, default: DEFAULT_VISUAL_EFFECTS.enabled },
    seasonMode: {
      type: String,
      enum: ['auto', 'manual'],
      default: DEFAULT_VISUAL_EFFECTS.seasonMode,
    },
    manualSeason: {
      type: String,
      enum: ['winter', 'spring', 'summer', 'autumn', 'default'],
      default: DEFAULT_VISUAL_EFFECTS.manualSeason,
    },
    backgroundEffect: {
      type: String,
      enum: ['rain', 'snow', 'sakura', 'none'],
      default: DEFAULT_VISUAL_EFFECTS.backgroundEffect,
    },
    overlayEffect: {
      type: String,
      enum: ['winter_train', 'christmas_sleigh', 'none'],
      default: DEFAULT_VISUAL_EFFECTS.overlayEffect,
    },
    headerColor: { type: String, default: DEFAULT_VISUAL_EFFECTS.headerColor },
    backgroundSpeed: { type: Number, default: DEFAULT_VISUAL_EFFECTS.backgroundSpeed, min: 0.1, max: 3 },
    showOverlayOnHome: { type: Boolean, default: DEFAULT_VISUAL_EFFECTS.showOverlayOnHome },
    showOverlayOnDealerDashboard: {
      type: Boolean,
      default: DEFAULT_VISUAL_EFFECTS.showOverlayOnDealerDashboard,
    },
    rainNotice: { type: rainNoticeSchema, default: () => ({ ...DEFAULT_VISUAL_EFFECTS.rainNotice }) },
  },
  { _id: false },
);

const storeBannerLinkSchema = new Schema(
  {
    type: { type: String, enum: ['category', 'none'], default: 'none' },
    categoryId: { type: String },
    categoryType: { type: String, enum: ['products', 'services', 'vehicles'] },
    serviceType: { type: String },
    vehicleType: { type: String },
  },
  { _id: false },
);

const storeBannerItemSchema = new Schema(
  {
    id: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    emoji: { type: String, default: '🎯' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    cta: { type: String, default: 'Learn More' },
    backgroundColor: { type: String, default: '#1565C0' },
    link: { type: storeBannerLinkSchema, default: () => ({ type: 'none' }) },
  },
  { _id: false },
);

const storeBannersSchema = new Schema(
  {
    enabled: { type: Boolean, default: DEFAULT_STORE_BANNERS.enabled },
    autoScrollMs: { type: Number, default: DEFAULT_STORE_BANNERS.autoScrollMs, min: 0 },
    items: { type: [storeBannerItemSchema], default: () => DEFAULT_STORE_BANNERS.items.map((item) => ({ ...item, link: { ...item.link } })) },
  },
  { _id: false },
);

const settingsSchema = new Schema<ISettingsDocument>(
  {
    siteName: {
      type: String,
      required: true,
      default: 'Car Connect',
    },
    siteEmail: {
      type: String,
      required: true,
      default: 'admin@carconnect.com',
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    visualEffects: {
      type: visualEffectsSchema,
      default: () => ({ ...DEFAULT_VISUAL_EFFECTS, rainNotice: { ...DEFAULT_VISUAL_EFFECTS.rainNotice } }),
    },
    storeBanners: {
      type: storeBannersSchema,
      default: () => ({
        ...DEFAULT_STORE_BANNERS,
        items: DEFAULT_STORE_BANNERS.items.map((item) => ({ ...item, link: { ...item.link } })),
      }),
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  },
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const Settings = mongoose.model<ISettingsDocument>('Settings', settingsSchema);
