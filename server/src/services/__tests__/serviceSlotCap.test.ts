jest.mock('../slotVisibilityService', () => ({
  filterVisibleSlots: jest.fn(async (slots: unknown[]) => slots),
}));

jest.mock('../../utils/istTime', () => ({
  isSlotEndTimePassed: jest.fn(() => false),
}));

jest.mock('../../models/ServiceSlot', () => ({
  ServiceSlot: {
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../../models/Service', () => ({
  Service: {
    findById: jest.fn(),
  },
}));

jest.mock('../dealer/dealerBookingCapService', () => ({
  getDealerBookingCapStatus: jest.fn(),
}));

jest.mock('../user/serviceBookingService', () => ({
  createServiceBookingFromSlot: jest.fn(),
}));

import { ServiceSlot } from '../../models/ServiceSlot';
import { Service } from '../../models/Service';
import { getDealerBookingCapStatus } from '../dealer/dealerBookingCapService';
import { createServiceBookingFromSlot } from '../user/serviceBookingService';
import { getAvailableSlots, bookSlot } from '../serviceSlotService';
import { AppError } from '../../utils/errorHandler';

describe('serviceSlotService daily cap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    it('returns empty slots when daily cap is reached', async () => {
      (Service.findById as jest.Mock).mockResolvedValue({
        _id: 'svc1',
        dealerId: 'dealer1',
      });
      (getDealerBookingCapStatus as jest.Mock).mockResolvedValue({
        capReached: true,
        currentCount: 20,
        maxDailyBookings: 20,
      });

      const result = await getAvailableSlots({
        serviceId: 'svc1',
        date: '2026-12-26',
      });

      expect(result.slots).toEqual([]);
      expect(result.dailyCapReached).toBe(true);
      expect(result.dailyBookingsCount).toBe(20);
      expect(ServiceSlot.find).not.toHaveBeenCalled();
    });

    it('returns available slots when under daily cap', async () => {
      (Service.findById as jest.Mock).mockResolvedValue({
        _id: 'svc1',
        dealerId: 'dealer1',
      });
      (getDealerBookingCapStatus as jest.Mock).mockResolvedValue({
        capReached: false,
        currentCount: 5,
        maxDailyBookings: 20,
      });
      (ServiceSlot.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          {
            _id: 'slot1',
            serviceId: 'svc1',
            date: new Date('2026-12-26'),
            startTime: '10:00',
            endTime: '11:00',
            serviceType: 'center',
            maxBookings: 2,
            currentBookings: 0,
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      });

      const result = await getAvailableSlots({
        serviceId: 'svc1',
        date: '2026-12-26',
      });

      expect(result.slots).toHaveLength(1);
      expect(result.dailyCapReached).toBe(false);
    });
  });

  describe('bookSlot', () => {
    const mockSlot = {
      _id: 'slot1',
      serviceId: 'svc1',
      date: new Date('2026-12-26'),
      startTime: '10:00',
      endTime: '11:00',
      serviceType: 'center',
      maxBookings: 2,
      currentBookings: 0,
      isAvailable: true,
      save: jest.fn().mockResolvedValue(undefined),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('rejects booking when daily cap is reached', async () => {
      (ServiceSlot.findById as jest.Mock).mockResolvedValue(mockSlot);
      (Service.findById as jest.Mock).mockResolvedValue({
        _id: 'svc1',
        dealerId: 'dealer1',
        name: 'Car Wash',
      });
      (getDealerBookingCapStatus as jest.Mock).mockResolvedValue({
        capReached: true,
        currentCount: 20,
        maxDailyBookings: 20,
      });

      await expect(
        bookSlot({ slotId: 'slot1', userId: 'user1' }),
      ).rejects.toThrow(AppError);

      expect(createServiceBookingFromSlot).not.toHaveBeenCalled();
      expect(mockSlot.save).not.toHaveBeenCalled();
    });

    it('creates booking and increments slot when under cap', async () => {
      const updatedSlot = {
        ...mockSlot,
        currentBookings: 1,
        isAvailable: true,
      };
      (ServiceSlot.findById as jest.Mock).mockResolvedValue(mockSlot);
      (ServiceSlot.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedSlot);
      (Service.findById as jest.Mock).mockResolvedValue({
        _id: 'svc1',
        dealerId: 'dealer1',
        name: 'Car Wash',
      });
      (getDealerBookingCapStatus as jest.Mock).mockResolvedValue({
        capReached: false,
        currentCount: 5,
        maxDailyBookings: 20,
      });
      (createServiceBookingFromSlot as jest.Mock).mockResolvedValue('booking1');

      const result = await bookSlot({ slotId: 'slot1', userId: 'user1' });

      expect(createServiceBookingFromSlot).toHaveBeenCalled();
      expect(ServiceSlot.findOneAndUpdate).toHaveBeenCalled();
      expect(result.bookingId).toBe('booking1');
    });
  });
});
