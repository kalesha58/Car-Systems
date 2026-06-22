import { sendPushNotification, createNotification } from '../notificationService';
import { logger } from '../../utils/logger';

export interface INotifySlotOfferParams {
  userId: string;
  offerId: string;
  slotId: string;
  serviceId: string;
  bookingId: string;
  slotStartTime: string;
  slotDate: string;
}

export const notifySlotOffer = async (
  params: INotifySlotOfferParams,
): Promise<void> => {
  const dateStr = new Date(params.slotDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const title = 'Earlier Slot Available';
  const body = `A slot at ${params.slotStartTime} on ${dateStr} opened up. Would you like to switch?`;

  const data = {
    type: 'slot_offer' as const,
    offerId: params.offerId,
    slotId: params.slotId,
    serviceId: params.serviceId,
    bookingId: params.bookingId,
    slotStartTime: params.slotStartTime,
    slotDate: params.slotDate,
  };

  try {
    await sendPushNotification(params.userId, {
      title,
      body,
      data,
    });
  } catch (error) {
    logger.error('Failed to send slot offer push:', { userId: params.userId, error });
  }

  try {
    await createNotification({
      userId: params.userId,
      type: 'slot_offer',
      title,
      body,
      data,
      relatedId: params.offerId,
    });
  } catch (error) {
    logger.error('Failed to create slot offer notification:', { userId: params.userId, error });
  }
};
