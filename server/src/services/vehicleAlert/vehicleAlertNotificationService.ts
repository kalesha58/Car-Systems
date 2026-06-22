import { sendPushNotification, createNotification } from '../notificationService';
import { logger } from '../../utils/logger';
import { VehicleAlertReasonCode, VEHICLE_ALERT_REASONS } from '../../models/VehicleAlert';

const reasonLabel = (code: VehicleAlertReasonCode): string =>
  VEHICLE_ALERT_REASONS.find(r => r.code === code)?.label || 'Vehicle alert';

export interface INotifyVehicleAlertParams {
  ownerId: string;
  alertId: string;
  chatId: string;
  numberPlate: string;
  reasonCode: VehicleAlertReasonCode;
  customMessage?: string;
}

export const notifyVehicleAlertOwner = async (
  params: INotifyVehicleAlertParams,
): Promise<void> => {
  const reason = reasonLabel(params.reasonCode);
  const title = 'Vehicle Alert';
  const body =
    params.reasonCode === 'other' && params.customMessage
      ? `${reason}: ${params.customMessage}`
      : `${reason} — ${params.numberPlate}`;

  const data = {
    type: 'vehicle_alert' as const,
    alertId: params.alertId,
    chatId: params.chatId,
    numberPlate: params.numberPlate,
    reasonCode: params.reasonCode,
    urgent: 'true',
  };

  try {
    await sendPushNotification(params.ownerId, {
      title,
      body,
      data,
    });
  } catch (error) {
    logger.error('Failed to send vehicle alert push:', { ownerId: params.ownerId, error });
  }

  try {
    await createNotification({
      userId: params.ownerId,
      type: 'vehicle_alert',
      title,
      body,
      data,
      relatedId: params.alertId,
    });
  } catch (error) {
    logger.error('Failed to create vehicle alert notification:', { ownerId: params.ownerId, error });
  }
};
