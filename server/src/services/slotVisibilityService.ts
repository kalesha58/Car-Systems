import { ServiceBooking } from '../models/ServiceBooking';
import { IServiceSlotDocument } from '../models/ServiceSlot';
import { isSlotEndTimePassed } from '../utils/istTime';

const ACTIVE_BOOKING_STATUSES = ['new', 'scheduled', 'in_progress', 'awaiting'];

export const isSlotFullyServiced = async (slotId: string): Promise<boolean> => {
  const total = await ServiceBooking.countDocuments({ slotId });
  if (total === 0) {
    return false;
  }
  const active = await ServiceBooking.countDocuments({
    slotId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });
  return active === 0;
};

export const filterVisibleSlots = async (
  slots: IServiceSlotDocument[],
): Promise<IServiceSlotDocument[]> => {
  const visible: IServiceSlotDocument[] = [];

  for (const slot of slots) {
    const slotDateStr = slot.date.toISOString().split('T')[0];

    if (isSlotEndTimePassed(slotDateStr, slot.endTime)) {
      continue;
    }

    const slotId = (slot._id as { toString(): string }).toString();
    if (await isSlotFullyServiced(slotId)) {
      continue;
    }

    if (slot.currentBookings >= slot.maxBookings) {
      continue;
    }

    visible.push(slot);
  }

  return visible;
};
