import { Vehicle } from '../../models/user/Vehicle';
import {
  VehicleAlert,
  IVehicleAlertDocument,
  VehicleAlertReasonCode,
  VEHICLE_ALERT_REASONS,
} from '../../models/VehicleAlert';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { isBlockedEitherDirection } from '../user/blockService';
import { getOrCreateDirectChat, sendMessage } from '../user/chatService';
import { notifyVehicleAlertOwner } from './vehicleAlertNotificationService';

const MAX_ALERTS_PER_USER_PER_DAY = 5;
const MAX_ALERTS_PER_PLATE_PER_DAY = 2;

const normalizePlate = (plate: string): string => plate.trim().toUpperCase().replace(/\s+/g, '');

const maskPlate = (plate: string): string => {
  if (plate.length <= 4) return plate;
  return `${plate.slice(0, 2)}***${plate.slice(-2)}`;
};

export interface IVehicleLookupResult {
  found: boolean;
  vehicleId?: string;
  maskedPlate?: string;
}

export const lookupVehicleByPlate = async (
  numberPlate: string,
): Promise<IVehicleLookupResult> => {
  const normalized = normalizePlate(numberPlate);
  if (!normalized || normalized.length < 4) {
    throw new AppError('Please enter a valid vehicle number', 400);
  }

  const vehicle = await Vehicle.findOne({ numberPlate: normalized }).select('_id numberPlate').lean();
  if (!vehicle) {
    return { found: false };
  }

  return {
    found: true,
    vehicleId: (vehicle._id as { toString(): string }).toString(),
    maskedPlate: maskPlate(vehicle.numberPlate),
  };
};

export const getVehicleAlertReasons = (): typeof VEHICLE_ALERT_REASONS => VEHICLE_ALERT_REASONS;

const alertToView = (doc: IVehicleAlertDocument) => ({
  id: (doc._id as { toString(): string }).toString(),
  reporterId: doc.reporterId,
  ownerId: doc.ownerId,
  vehicleId: doc.vehicleId,
  numberPlate: doc.numberPlate,
  reasonCode: doc.reasonCode,
  customMessage: doc.customMessage,
  status: doc.status,
  chatId: doc.chatId,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const checkRateLimits = async (reporterId: string, numberPlate: string): Promise<void> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [userCount, plateCount] = await Promise.all([
    VehicleAlert.countDocuments({ reporterId, createdAt: { $gte: since } }),
    VehicleAlert.countDocuments({ numberPlate, createdAt: { $gte: since } }),
  ]);

  if (userCount >= MAX_ALERTS_PER_USER_PER_DAY) {
    throw new AppError('Daily alert limit reached. Please try again tomorrow.', 429);
  }
  if (plateCount >= MAX_ALERTS_PER_PLATE_PER_DAY) {
    throw new AppError('Too many alerts for this vehicle today.', 429);
  }
};

const buildAlertMessage = (
  reasonCode: VehicleAlertReasonCode,
  customMessage?: string,
): string => {
  const reason = VEHICLE_ALERT_REASONS.find(r => r.code === reasonCode);
  if (reasonCode === 'other' && customMessage) {
    return customMessage.trim();
  }
  return reason?.label || 'Vehicle alert regarding your parked vehicle.';
};

export interface ICreateVehicleAlertRequest {
  numberPlate: string;
  reasonCode: VehicleAlertReasonCode;
  customMessage?: string;
}

export const createVehicleAlert = async (
  reporterId: string,
  data: ICreateVehicleAlertRequest,
) => {
  const normalized = normalizePlate(data.numberPlate);
  const vehicle = await Vehicle.findOne({ numberPlate: normalized });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found in our system');
  }

  const ownerId = vehicle.ownerId;
  if (ownerId === reporterId) {
    throw new AppError('You cannot send an alert for your own vehicle', 400);
  }

  const blocked = await isBlockedEitherDirection(reporterId, ownerId);
  if (blocked) {
    throw new AppError('Cannot send alert to this user', 403);
  }

  if (data.reasonCode === 'other' && !data.customMessage?.trim()) {
    throw new AppError('Please provide a message for "Other"', 400);
  }

  await checkRateLimits(reporterId, normalized);

  const chatResult = await getOrCreateDirectChat(reporterId, { userId: ownerId });
  const chatId = chatResult.Response.id;

  const alert = await VehicleAlert.create({
    reporterId,
    ownerId,
    vehicleId: (vehicle._id as { toString(): string }).toString(),
    numberPlate: normalized,
    reasonCode: data.reasonCode,
    customMessage: data.customMessage?.trim(),
    status: 'open',
    chatId,
  });

  const messageText = buildAlertMessage(data.reasonCode, data.customMessage);
  try {
    await sendMessage(chatId, reporterId, { text: messageText, messageType: 'text' });
  } catch (msgErr) {
    logger.warn('Failed to send initial vehicle alert chat message:', msgErr);
  }

  await notifyVehicleAlertOwner({
    ownerId,
    alertId: (alert._id as { toString(): string }).toString(),
    chatId,
    numberPlate: normalized,
    reasonCode: data.reasonCode,
    customMessage: data.customMessage,
  });

  logger.info(`Vehicle alert created: ${alert._id} for plate ${normalized}`);

  return alertToView(alert);
};

export const listVehicleAlerts = async (userId: string) => {
  const alerts = await VehicleAlert.find({
    $or: [{ reporterId: userId }, { ownerId: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(50);

  return alerts.map(alertToView);
};

export const resolveVehicleAlert = async (userId: string, alertId: string) => {
  const alert = await VehicleAlert.findById(alertId);
  if (!alert) {
    throw new NotFoundError('Alert not found');
  }
  if (alert.ownerId !== userId) {
    throw new AppError('Only the vehicle owner can resolve this alert', 403);
  }
  if (alert.status !== 'open') {
    throw new AppError('This alert is already closed', 400);
  }

  alert.status = 'resolved';
  await alert.save();

  return alertToView(alert);
};

export const getVehicleAlertById = async (userId: string, alertId: string) => {
  const alert = await VehicleAlert.findById(alertId);
  if (!alert) {
    throw new NotFoundError('Alert not found');
  }
  if (alert.reporterId !== userId && alert.ownerId !== userId) {
    throw new AppError('Unauthorized', 403);
  }
  return alertToView(alert);
};
