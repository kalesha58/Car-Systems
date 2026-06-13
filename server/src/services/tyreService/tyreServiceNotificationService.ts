import { ServiceBookingStatus } from '../../models/ServiceBooking';
import { sendPushNotification, createNotification } from '../notificationService';
import { logger } from '../../utils/logger';

export type TyreServiceNotificationActor = 'dealer' | 'admin';

export interface INotifyTyreServiceStatusChangeParams {
  userId: string;
  bookingId: string;
  serviceId: string;
  newStatus: ServiceBookingStatus;
  previousStatus: ServiceBookingStatus;
  actor: TyreServiceNotificationActor;
  bookingDate?: string;
  bookingTime?: string;
  dealerNotes?: string;
  rejectionReason?: string;
  serviceName?: string;
  serviceImageUrl?: string;
}

export interface INotifyTyreServiceRequestCreatedParams {
  dealerUserId: string;
  bookingId: string;
  serviceId: string;
  customerName?: string;
  serviceName?: string;
  bookingDate?: string;
  bookingTime?: string;
}

const formatSchedule = (bookingDate?: string, bookingTime?: string): string => {
  if (!bookingDate) return '';
  const dateStr = new Date(bookingDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return bookingTime ? ` on ${dateStr} at ${bookingTime}` : ` on ${dateStr}`;
};

const buildStatusMessage = (
  newStatus: ServiceBookingStatus,
  serviceName: string,
  schedule: string,
  actor: TyreServiceNotificationActor,
  dealerNotes?: string,
  rejectionReason?: string,
): { title: string; body: string } => {
  const actorLabel = actor === 'admin' ? 'Admin' : 'Dealer';

  if (newStatus === 'scheduled') {
    return {
      title: 'Tyre Service Approved',
      body: `Your tyre service request for "${serviceName}"${schedule} has been approved.`,
    };
  }

  if (newStatus === 'cancelled') {
    const reason = (rejectionReason || dealerNotes)?.trim();
    const reasonText = reason ? ` Reason: ${reason}` : '';
    return {
      title: 'Tyre Service Declined',
      body: `Your tyre service request for "${serviceName}" was not approved.${reasonText}`,
    };
  }

  return {
    title: 'Tyre Service Updated',
    body: `Your tyre service request for "${serviceName}" status is now ${newStatus} (${actorLabel.toLowerCase()}).`,
  };
};

export const notifyTyreServiceStatusChange = async (
  params: INotifyTyreServiceStatusChangeParams,
): Promise<{ pushSent: boolean; inAppCreated: boolean }> => {
  const notifyFromNew: ServiceBookingStatus[] = ['scheduled', 'cancelled'];
  if (params.previousStatus !== 'new' || !notifyFromNew.includes(params.newStatus)) {
    return { pushSent: false, inAppCreated: false };
  }

  if (params.previousStatus === params.newStatus) {
    return { pushSent: false, inAppCreated: false };
  }

  const serviceName = params.serviceName || 'Tyre Service';
  const schedule = formatSchedule(params.bookingDate, params.bookingTime);
  const { title, body } = buildStatusMessage(
    params.newStatus,
    serviceName,
    schedule,
    params.actor,
    params.dealerNotes,
    params.rejectionReason,
  );

  const data = {
    type: 'tyre_service_update' as const,
    bookingId: params.bookingId,
    serviceId: params.serviceId,
    status: params.newStatus,
    actor: params.actor,
  };

  let pushSent = false;
  try {
    pushSent = await sendPushNotification(params.userId, {
      title,
      body,
      imageUrl: params.serviceImageUrl,
      data,
    });
  } catch (error) {
    logger.error('Failed to send tyre service push notification:', {
      userId: params.userId,
      bookingId: params.bookingId,
      error,
    });
  }

  let inAppCreated = false;
  try {
    await createNotification({
      userId: params.userId,
      type: 'tyre_service_update',
      title,
      body,
      data,
      relatedId: params.bookingId,
    });
    inAppCreated = true;
  } catch (error) {
    logger.error('Failed to create in-app tyre service notification:', {
      userId: params.userId,
      bookingId: params.bookingId,
      error,
    });
  }

  return { pushSent, inAppCreated };
};

export const notifyTyreServiceRequestCreated = async (
  params: INotifyTyreServiceRequestCreatedParams,
): Promise<{ pushSent: boolean; inAppCreated: boolean }> => {
  const serviceName = params.serviceName || 'Tyre Service';
  const customerLabel = params.customerName?.trim() || 'A customer';
  const schedule = formatSchedule(params.bookingDate, params.bookingTime);

  const title = 'New Tyre Service Request';
  const body = `${customerLabel} requested "${serviceName}"${schedule}.`;

  const data = {
    type: 'tyre_service_request' as const,
    bookingId: params.bookingId,
    serviceId: params.serviceId,
  };

  let pushSent = false;
  try {
    pushSent = await sendPushNotification(params.dealerUserId, {
      title,
      body,
      data,
    });
  } catch (error) {
    logger.error('Failed to send tyre service request push to dealer:', {
      dealerUserId: params.dealerUserId,
      bookingId: params.bookingId,
      error,
    });
  }

  let inAppCreated = false;
  try {
    await createNotification({
      userId: params.dealerUserId,
      type: 'tyre_service_request',
      title,
      body,
      data,
      relatedId: params.bookingId,
    });
    inAppCreated = true;
  } catch (error) {
    logger.error('Failed to create in-app tyre service request notification:', {
      dealerUserId: params.dealerUserId,
      bookingId: params.bookingId,
      error,
    });
  }

  return { pushSent, inAppCreated };
};
