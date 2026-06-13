import mongoose from 'mongoose';
import { BusinessRegistration } from '../models/BusinessRegistration';

/**
 * Resolve all IDs used to link dealer inventory (products.userId, services.dealerId, vehicles.dealerId).
 * Accepts SignUp user id or BusinessRegistration document id.
 */
export const resolveDealerCatalogIds = async (dealerIdOrUserId: string): Promise<string[]> => {
  if (!dealerIdOrUserId?.trim()) {
    return [];
  }

  const value = dealerIdOrUserId.trim();
  const ids = new Set<string>([value]);

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return [value];
  }

  const regByDoc = await BusinessRegistration.findById(value).select('userId').lean();
  if (regByDoc?.userId) {
    ids.add(String(regByDoc.userId));
    return [...ids];
  }

  const regByUser = await BusinessRegistration.findOne({ userId: value }).select('_id userId').lean();
  if (regByUser) {
    ids.add(String(regByUser._id));
    if (regByUser.userId) {
      ids.add(String(regByUser.userId));
    }
  }

  return [...ids];
};
