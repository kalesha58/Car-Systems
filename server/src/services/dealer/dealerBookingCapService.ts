import { BusinessRegistration } from '../../models/BusinessRegistration';
import { ServiceBooking } from '../../models/ServiceBooking';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export interface ISTDayBounds {
  start: Date;
  end: Date;
}

export interface DealerBookingCapStatus {
  maxDailyBookings?: number;
  currentCount: number;
  capReached: boolean;
}

/**
 * Returns UTC Date bounds for a calendar day in Asia/Kolkata (IST).
 * @param date YYYY-MM-DD string
 */
export const getISTDayBounds = (date: string): ISTDayBounds => {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }

  // Midnight IST expressed as UTC instant
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
};

/**
 * Count active service bookings for a dealer on a given IST calendar day.
 */
export const getDealerDailyBookingCount = async (
  dealerId: string,
  date: string,
): Promise<number> => {
  const { start, end } = getISTDayBounds(date);

  return ServiceBooking.countDocuments({
    dealerId,
    bookingDate: { $gte: start, $lt: end },
    status: { $nin: ['cancelled'] },
  });
};

/**
 * Returns dealer-wide daily booking cap status for a given date.
 */
export const getDealerBookingCapStatus = async (
  dealerId: string,
  date: string,
): Promise<DealerBookingCapStatus> => {
  const registration = await BusinessRegistration.findById(dealerId).select('maxDailyBookings').lean();
  const maxDailyBookings = registration?.maxDailyBookings;
  const currentCount = await getDealerDailyBookingCount(dealerId, date);

  const capReached =
    maxDailyBookings !== undefined &&
    maxDailyBookings !== null &&
    maxDailyBookings > 0 &&
    currentCount >= maxDailyBookings;

  return {
    maxDailyBookings: maxDailyBookings ?? undefined,
    currentCount,
    capReached,
  };
};
