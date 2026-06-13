import { TestDriveStatus } from '../../models/TestDrive';
import { sendPushNotification, createNotification } from '../notificationService';
import { logger } from '../../utils/logger';
import { fetchVehicleNotificationContext } from './testDriveEnrichment';

export type TestDriveNotificationActor = 'dealer' | 'admin';

export interface INotifyTestDriveStatusChangeParams {
  userId: string;
  testDriveId: string;
  vehicleId: string;
  newStatus: TestDriveStatus;
  previousStatus: TestDriveStatus;
  actor: TestDriveNotificationActor;
  preferredDate?: string;
  preferredTime?: string;
  dealerNotes?: string;
  vehicleLabel?: string;
  vehicleImageUrl?: string;
}

const formatSchedule = (preferredDate?: string, preferredTime?: string): string => {
  if (!preferredDate) return '';
  const dateStr = new Date(preferredDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return preferredTime ? ` on ${dateStr} at ${preferredTime}` : ` on ${dateStr}`;
};

const buildStatusMessage = (
  newStatus: TestDriveStatus,
  vehicleLabel: string,
  schedule: string,
  actor: TestDriveNotificationActor,
  dealerNotes?: string,
): { title: string; body: string } => {
  const actorLabel = actor === 'admin' ? 'Admin' : 'Dealer';

  switch (newStatus) {
    case 'approved':
      return {
        title: 'Test Drive Approved',
        body: `Your test drive for ${vehicleLabel}${schedule} has been approved.`,
      };
    case 'rejected': {
      const reason = dealerNotes?.trim() ? ` Reason: ${dealerNotes.trim()}` : '';
      return {
        title: 'Test Drive Declined',
        body: `Your test drive for ${vehicleLabel} was not approved.${reason}`,
      };
    }
    case 'completed':
      return {
        title: 'Test Drive Completed',
        body: `Your test drive for ${vehicleLabel} has been marked as completed. Thank you!`,
      };
    case 'cancelled':
      return {
        title: 'Test Drive Cancelled',
        body: `Your test drive for ${vehicleLabel}${schedule} was cancelled by ${actorLabel.toLowerCase()}.`,
      };
    default:
      return {
        title: 'Test Drive Updated',
        body: `Your test drive for ${vehicleLabel} status is now ${newStatus}.`,
      };
  }
};

export const notifyTestDriveStatusChange = async (
  params: INotifyTestDriveStatusChangeParams,
): Promise<{ pushSent: boolean; inAppCreated: boolean }> => {
  const notifyStatuses: TestDriveStatus[] = ['approved', 'rejected', 'completed', 'cancelled'];
  if (!notifyStatuses.includes(params.newStatus)) {
    return { pushSent: false, inAppCreated: false };
  }

  try {
    let vehicleLabel = params.vehicleLabel;
    let vehicleImageUrl = params.vehicleImageUrl;
    if (!vehicleLabel) {
      const ctx = await fetchVehicleNotificationContext(params.vehicleId);
      vehicleLabel = ctx.vehicleLabel;
      vehicleImageUrl = vehicleImageUrl || ctx.vehicleImageUrl;
    }

    const schedule = formatSchedule(params.preferredDate, params.preferredTime);
    const { title, body } = buildStatusMessage(
      params.newStatus,
      vehicleLabel,
      schedule,
      params.actor,
      params.dealerNotes,
    );

    const data = {
      type: 'test_drive_update' as const,
      testDriveId: params.testDriveId,
      vehicleId: params.vehicleId,
      status: params.newStatus,
      actor: params.actor,
    };

    const pushSent = await sendPushNotification(params.userId, {
      title,
      body,
      imageUrl: vehicleImageUrl,
      data,
    });

    let inAppCreated = false;
    try {
      await createNotification({
        userId: params.userId,
        type: 'test_drive_update',
        title,
        body,
        data,
        relatedId: params.testDriveId,
      });
      inAppCreated = true;
    } catch (notifErr) {
      logger.error('Failed to create in-app test drive notification:', notifErr);
    }

    return { pushSent, inAppCreated };
  } catch (error) {
    logger.error('Error sending test drive status notification:', error);
    return { pushSent: false, inAppCreated: false };
  }
};
