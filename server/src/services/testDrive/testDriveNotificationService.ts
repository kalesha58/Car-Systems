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

  if (params.previousStatus === params.newStatus) {
    return { pushSent: false, inAppCreated: false };
  }

  let vehicleLabel = params.vehicleLabel;
  let vehicleImageUrl = params.vehicleImageUrl;

  try {
    if (!vehicleLabel) {
      const ctx = await fetchVehicleNotificationContext(params.vehicleId);
      vehicleLabel = ctx.vehicleLabel;
      vehicleImageUrl = vehicleImageUrl || ctx.vehicleImageUrl;
    }
  } catch (error) {
    logger.error('Failed to load vehicle context for test drive notification:', {
      testDriveId: params.testDriveId,
      vehicleId: params.vehicleId,
      error,
    });
    vehicleLabel = vehicleLabel || 'your vehicle';
  }

  const schedule = formatSchedule(params.preferredDate, params.preferredTime);
  const { title, body } = buildStatusMessage(
    params.newStatus,
    vehicleLabel || 'your vehicle',
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

  let pushSent = false;
  try {
    pushSent = await sendPushNotification(params.userId, {
      title,
      body,
      imageUrl: vehicleImageUrl,
      data,
    });
  } catch (error) {
    logger.error('Failed to send test drive push notification:', {
      userId: params.userId,
      testDriveId: params.testDriveId,
      newStatus: params.newStatus,
      error,
    });
  }

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
    logger.error('Failed to create in-app test drive notification:', {
      userId: params.userId,
      testDriveId: params.testDriveId,
      error: notifErr,
    });
  }

  logger.info('Test drive status notification result', {
    userId: params.userId,
    testDriveId: params.testDriveId,
    newStatus: params.newStatus,
    actor: params.actor,
    pushSent,
    inAppCreated,
  });

  return { pushSent, inAppCreated };
};
