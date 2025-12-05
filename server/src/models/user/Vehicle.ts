import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicleDocuments {
  rc?: string;
  insurance?: string;
  pollution?: string;
  dl?: string;
}

// Vehicle document interface - using intersection type to avoid 'model' property conflict
// The 'model' field conflicts with Document's model() method, so we use intersection type
export interface IVehicleDocumentFields {
  ownerId: string;
  brand: string;
  model: string; // This will override Document's model() method in the intersection
  numberPlate: string;
  documents: IVehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type IVehicleDocument = Document & IVehicleDocumentFields;

const vehicleDocumentsSchema = new Schema<IVehicleDocuments>(
  {
    rc: { type: String, default: null },
    insurance: { type: String, default: null },
    pollution: { type: String, default: null },
    dl: { type: String, default: null },
  },
  { _id: false },
);

// Define schema without generic type to avoid 'model' property conflict
// The schema structure matches IVehicleDocumentFields but we can't use it directly due to 'model' conflict
const vehicleSchema = new Schema<any>(
  {
    ownerId: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    numberPlate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    documents: {
      type: vehicleDocumentsSchema,
      default: {},
    },
    primaryDriverId: {
      type: String,
      default: null,
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    color: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length >= 1 && v.length <= 3;
        },
        message: 'Vehicle must have between 1 and 3 images',
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
vehicleSchema.index({ ownerId: 1 });
vehicleSchema.index({ numberPlate: 1 }, { unique: true });

export const Vehicle = mongoose.model<IVehicleDocument>('Vehicle', vehicleSchema);

