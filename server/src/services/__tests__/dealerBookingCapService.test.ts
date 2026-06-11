jest.mock('../../models/BusinessRegistration', () => ({
  BusinessRegistration: {
    findById: jest.fn(),
  },
}));

jest.mock('../../models/ServiceBooking', () => ({
  ServiceBooking: {
    countDocuments: jest.fn(),
  },
}));

import { BusinessRegistration } from '../../models/BusinessRegistration';
import { ServiceBooking } from '../../models/ServiceBooking';
import {
  getISTDayBounds,
  getDealerDailyBookingCount,
  getDealerBookingCapStatus,
} from '../dealer/dealerBookingCapService';

describe('dealerBookingCapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getISTDayBounds', () => {
    it('returns a 24-hour window for the given YYYY-MM-DD date', () => {
      const { start, end } = getISTDayBounds('2026-05-26');
      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('getDealerDailyBookingCount', () => {
    it('counts non-cancelled bookings within IST day bounds', async () => {
      (ServiceBooking.countDocuments as jest.Mock).mockResolvedValue(5);

      const count = await getDealerDailyBookingCount('dealer1', '2026-05-26');

      expect(count).toBe(5);
      expect(ServiceBooking.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          dealerId: 'dealer1',
          status: { $nin: ['cancelled'] },
        }),
      );
    });
  });

  describe('getDealerBookingCapStatus', () => {
    it('returns capReached false when maxDailyBookings is unset', async () => {
      (BusinessRegistration.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ maxDailyBookings: undefined }),
        }),
      });
      (ServiceBooking.countDocuments as jest.Mock).mockResolvedValue(10);

      const status = await getDealerBookingCapStatus('dealer1', '2026-05-26');

      expect(status.capReached).toBe(false);
      expect(status.currentCount).toBe(10);
      expect(status.maxDailyBookings).toBeUndefined();
    });

    it('returns capReached true when count meets maxDailyBookings', async () => {
      (BusinessRegistration.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ maxDailyBookings: 20 }),
        }),
      });
      (ServiceBooking.countDocuments as jest.Mock).mockResolvedValue(20);

      const status = await getDealerBookingCapStatus('dealer1', '2026-05-26');

      expect(status.capReached).toBe(true);
      expect(status.maxDailyBookings).toBe(20);
    });

    it('returns capReached false when count is below maxDailyBookings', async () => {
      (BusinessRegistration.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ maxDailyBookings: 20 }),
        }),
      });
      (ServiceBooking.countDocuments as jest.Mock).mockResolvedValue(19);

      const status = await getDealerBookingCapStatus('dealer1', '2026-05-26');

      expect(status.capReached).toBe(false);
    });
  });
});
