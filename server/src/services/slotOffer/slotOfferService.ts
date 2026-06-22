import { ServiceBooking } from '../../models/ServiceBooking';
import { ServiceSlot } from '../../models/ServiceSlot';
import { SlotOffer, ISlotOfferDocument } from '../../models/SlotOffer';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { cancelBooking as decrementSlotBooking } from '../serviceSlotService';
import { notifySlotOffer } from './slotOfferNotificationService';

const ACTIVE_STATUSES = ['new', 'scheduled', 'in_progress', 'awaiting'];
const OFFER_TTL_HOURS = 24;

export interface ISlotOfferView {
  id: string;
  slotId: string;
  serviceId: string;
  freedByBookingId: string;
  targetBookingId: string;
  targetUserId: string;
  slotDate: string;
  slotStartTime: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const offerToView = (doc: ISlotOfferDocument): ISlotOfferView => ({
  id: (doc._id as { toString(): string }).toString(),
  slotId: doc.slotId,
  serviceId: doc.serviceId,
  freedByBookingId: doc.freedByBookingId,
  targetBookingId: doc.targetBookingId,
  targetUserId: doc.targetUserId,
  slotDate: doc.slotDate,
  slotStartTime: doc.slotStartTime,
  status: doc.status,
  expiresAt: doc.expiresAt.toISOString(),
  createdAt: doc.createdAt.toISOString(),
});

/**
 * When a booking is cancelled, notify users in later slots on the same day.
 */
export const createSlotOffersOnCancellation = async (
  cancelledBookingId: string,
): Promise<void> => {
  const cancelled = await ServiceBooking.findById(cancelledBookingId);
  if (!cancelled?.slotId || !cancelled.bookingTime) {
    return;
  }

  const freedSlot = await ServiceSlot.findById(cancelled.slotId);
  if (!freedSlot) {
    return;
  }

  const slotDateStr = freedSlot.date.toISOString().split('T')[0];
  const freedStartMinutes = timeToMinutes(freedSlot.startTime);

  const laterBookings = await ServiceBooking.find({
    serviceId: cancelled.serviceId,
    slotId: { $exists: true, $ne: null },
    status: { $in: ACTIVE_STATUSES },
    _id: { $ne: cancelledBookingId },
  });

  const eligible = laterBookings.filter(b => {
    if (!b.bookingTime || !b.slotId) return false;
    const bookingDateStr = b.bookingDate.toISOString().split('T')[0];
    if (bookingDateStr !== slotDateStr) return false;
    return timeToMinutes(b.bookingTime) > freedStartMinutes;
  });

  eligible.sort((a, b) => timeToMinutes(a.bookingTime!) - timeToMinutes(b.bookingTime!));

  const expiresAt = new Date(Date.now() + OFFER_TTL_HOURS * 60 * 60 * 1000);

  for (const booking of eligible) {
    const existing = await SlotOffer.findOne({
      targetBookingId: (booking._id as { toString(): string }).toString(),
      slotId: cancelled.slotId,
      status: 'pending',
    });
    if (existing) continue;

    const offer = await SlotOffer.create({
      slotId: cancelled.slotId,
      serviceId: cancelled.serviceId,
      freedByBookingId: cancelledBookingId,
      targetBookingId: (booking._id as { toString(): string }).toString(),
      targetUserId: booking.userId,
      slotDate: slotDateStr,
      slotStartTime: freedSlot.startTime,
      status: 'pending',
      expiresAt,
    });

    await notifySlotOffer({
      userId: booking.userId,
      offerId: (offer._id as { toString(): string }).toString(),
      slotId: cancelled.slotId,
      serviceId: cancelled.serviceId,
      bookingId: (booking._id as { toString(): string }).toString(),
      slotStartTime: freedSlot.startTime,
      slotDate: slotDateStr,
    });
  }

  logger.info(`Created slot offers for cancelled booking ${cancelledBookingId}`);
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const acceptSlotOffer = async (
  userId: string,
  offerId: string,
): Promise<ISlotOfferView> => {
  const offer = await SlotOffer.findById(offerId);
  if (!offer) {
    throw new NotFoundError('Slot offer not found');
  }
  if (offer.targetUserId !== userId) {
    throw new AppError('Unauthorized', 403);
  }
  if (offer.status !== 'pending') {
    throw new AppError('This offer is no longer available', 400);
  }
  if (offer.expiresAt < new Date()) {
    offer.status = 'expired';
    await offer.save();
    throw new AppError('This offer has expired', 400);
  }

  const targetBooking = await ServiceBooking.findById(offer.targetBookingId);
  if (!targetBooking?.slotId) {
    throw new NotFoundError('Booking not found');
  }

  const newSlot = await ServiceSlot.findById(offer.slotId);
  if (!newSlot) {
    throw new NotFoundError('Slot not found');
  }

  const updatedNewSlot = await ServiceSlot.findOneAndUpdate(
    {
      _id: offer.slotId,
      $expr: { $lt: ['$currentBookings', '$maxBookings'] },
    },
    [
      {
        $set: {
          currentBookings: { $add: ['$currentBookings', 1] },
          isAvailable: {
            $lt: [{ $add: ['$currentBookings', 1] }, '$maxBookings'],
          },
        },
      },
    ],
    { new: true },
  );

  if (!updatedNewSlot) {
    throw new AppError('The slot is no longer available', 400);
  }

  const oldSlotId = targetBooking.slotId;
  try {
    await decrementSlotBooking(oldSlotId);

    targetBooking.slotId = offer.slotId;
    targetBooking.bookingTime = newSlot.startTime;
    targetBooking.bookingDate = newSlot.date;
    await targetBooking.save();

    offer.status = 'accepted';
    await offer.save();

    await SlotOffer.updateMany(
      {
        slotId: offer.slotId,
        status: 'pending',
        _id: { $ne: offer._id },
      },
      { status: 'expired' },
    );
  } catch (error) {
    await ServiceSlot.findByIdAndUpdate(offer.slotId, {
      $inc: { currentBookings: -1 },
      $set: { isAvailable: true },
    });
    throw error;
  }

  return offerToView(offer);
};

export const declineSlotOffer = async (
  userId: string,
  offerId: string,
): Promise<ISlotOfferView> => {
  const offer = await SlotOffer.findById(offerId);
  if (!offer) {
    throw new NotFoundError('Slot offer not found');
  }
  if (offer.targetUserId !== userId) {
    throw new AppError('Unauthorized', 403);
  }
  if (offer.status !== 'pending') {
    throw new AppError('This offer is no longer available', 400);
  }

  offer.status = 'declined';
  await offer.save();

  return offerToView(offer);
};

export const getSlotOfferById = async (
  userId: string,
  offerId: string,
): Promise<ISlotOfferView> => {
  const offer = await SlotOffer.findById(offerId);
  if (!offer) {
    throw new NotFoundError('Slot offer not found');
  }
  if (offer.targetUserId !== userId) {
    throw new AppError('Unauthorized', 403);
  }
  return offerToView(offer);
};
