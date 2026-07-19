import mongoose from 'mongoose';
import { SignUp } from '../../models/SignUp';
import { DealerVehicle } from '../../models/DealerVehicle';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import { ITestDrive } from '../../types/testDrive/ITestDrive';

export interface ITestDriveVehicleSnapshot {
  brand: string;
  vehicleModel: string;
  year: number;
  vehicleType: string;
  images: string[];
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  color?: string;
  price: number;
  availability: string;
  condition?: string;
  allowTestDrive?: boolean;
}

export interface ITestDriveDealerSnapshot {
  phone: string;
  address: string;
  type: string;
}

export interface ITestDriveListEnrichment {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  dealerName?: string;
  vehicleLabel?: string;
  vehicleImage?: string;
  vehicleType?: string;
}

export interface ITestDriveDetailEnrichment extends ITestDriveListEnrichment {
  customerProfileImage?: string;
  customerStatus?: string;
  vehicle?: ITestDriveVehicleSnapshot;
  dealer?: ITestDriveDealerSnapshot;
}

export const buildVehicleLabel = (vehicle: {
  brand?: string;
  vehicleModel?: string;
  year?: number;
} | null): string | undefined => {
  if (!vehicle?.brand) return undefined;
  return `${vehicle.brand} ${vehicle.vehicleModel || ''} (${vehicle.year || ''})`.replace(/\s+/g, ' ').trim();
};

export const testDriveToInterface = (doc: any): ITestDrive => ({
  id: doc._id.toString(),
  userId: doc.userId,
  vehicleId: doc.vehicleId,
  dealerId: doc.dealerId,
  preferredDate: doc.preferredDate?.toISOString?.() || String(doc.preferredDate),
  preferredTime: doc.preferredTime,
  status: doc.status,
  notes: doc.notes,
  dealerNotes: doc.dealerNotes,
  createdAt: doc.createdAt?.toISOString?.() || String(doc.createdAt),
  updatedAt: doc.updatedAt?.toISOString?.() || String(doc.updatedAt),
});

export const enrichTestDriveLight = async (doc: any): Promise<ITestDrive & ITestDriveListEnrichment> => {
  const base = testDriveToInterface(doc);

  const [user, vehicle, businessReg] = await Promise.all([
    SignUp.findById(doc.userId).select('name phone email').lean(),
    DealerVehicle.findById(doc.vehicleId).select('brand vehicleModel year vehicleType images').lean(),
    BusinessRegistration.findOne({
      $or: [
        { userId: doc.dealerId },
        ...(mongoose.Types.ObjectId.isValid(doc.dealerId) ? [{ _id: doc.dealerId }] : []),
      ],
    }).select('businessName').lean(),
  ]);

  const vehicleDoc = vehicle as any;
  const firstImage = vehicleDoc?.images?.[0];

  return {
    ...base,
    customerName: (user as any)?.name,
    customerPhone: (user as any)?.phone,
    customerEmail: (user as any)?.email,
    dealerName: (businessReg as any)?.businessName,
    vehicleLabel: buildVehicleLabel(vehicleDoc),
    vehicleImage: firstImage,
    vehicleType: vehicleDoc?.vehicleType,
  };
};

export const enrichTestDriveDetail = async (doc: any): Promise<ITestDrive & ITestDriveDetailEnrichment> => {
  const base = testDriveToInterface(doc);

  const [user, vehicle, businessReg] = await Promise.all([
    SignUp.findById(doc.userId).select('name phone email profileImage status').lean(),
    DealerVehicle.findById(doc.vehicleId).lean(),
    BusinessRegistration.findOne({
      $or: [
        { userId: doc.dealerId },
        ...(mongoose.Types.ObjectId.isValid(doc.dealerId) ? [{ _id: doc.dealerId }] : []),
      ],
    }).select('businessName phone address type').lean(),
  ]);

  const vehicleDoc = vehicle as any;
  const regDoc = businessReg as any;
  const userDoc = user as any;
  const firstImage = vehicleDoc?.images?.[0];

  return {
    ...base,
    customerName: userDoc?.name,
    customerPhone: userDoc?.phone,
    customerEmail: userDoc?.email,
    customerProfileImage: userDoc?.profileImage,
    customerStatus: userDoc?.status,
    dealerName: regDoc?.businessName,
    vehicleLabel: buildVehicleLabel(vehicleDoc),
    vehicleImage: firstImage,
    vehicleType: vehicleDoc?.vehicleType,
    vehicle: vehicleDoc
      ? {
          brand: vehicleDoc.brand,
          vehicleModel: vehicleDoc.vehicleModel,
          year: vehicleDoc.year,
          vehicleType: vehicleDoc.vehicleType,
          images: vehicleDoc.images || [],
          fuelType: vehicleDoc.fuelType,
          transmission: vehicleDoc.transmission,
          mileage: vehicleDoc.mileage,
          color: vehicleDoc.color,
          price: vehicleDoc.price,
          availability: vehicleDoc.availability,
          condition: vehicleDoc.condition,
          allowTestDrive: vehicleDoc.allowTestDrive,
        }
      : undefined,
    dealer: regDoc
      ? {
          phone: regDoc.phone,
          address: regDoc.address,
          type: regDoc.type,
        }
      : undefined,
  };
};

export const fetchVehicleNotificationContext = async (
  vehicleId: string,
): Promise<{ vehicleLabel: string; vehicleImageUrl?: string }> => {
  const vehicle = await DealerVehicle.findById(vehicleId).select('brand vehicleModel year images').lean();
  const vehicleDoc = vehicle as any;
  return {
    vehicleLabel: buildVehicleLabel(vehicleDoc) || 'your vehicle',
    vehicleImageUrl: vehicleDoc?.images?.[0],
  };
};
