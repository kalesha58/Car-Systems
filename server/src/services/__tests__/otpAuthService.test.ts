jest.mock('../msg91OtpService', () => ({
  sendOtpViaMsg91: jest.fn().mockResolvedValue({ requestId: 'req_test_123' }),
  verifyOtpViaMsg91: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../models/OtpSession', () => ({
  OtpSession: {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../../models/SignUp', () => ({
  SignUp: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

import { OtpSession } from '../../models/OtpSession';
import { SignUp } from '../../models/SignUp';
import { sendOtpViaMsg91, verifyOtpViaMsg91 } from '../msg91OtpService';
import {
  normalizePhone,
  sendOtp,
  verifyOtp,
  toMsg91Mobile,
} from '../otpAuthService';

describe('otpAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OTP_SEND_LIMIT = '3';
    process.env.OTP_RESEND_COOLDOWN_SECONDS = '30';
    process.env.OTP_MAX_VERIFY_ATTEMPTS = '5';
  });

  describe('normalizePhone', () => {
    it('strips non-digits and accepts 10-digit Indian numbers', () => {
      expect(normalizePhone('98765 43210')).toBe('9876543210');
    });

    it('rejects invalid length', () => {
      expect(() => normalizePhone('12345')).toThrow('10 digits');
    });
  });

  describe('toMsg91Mobile', () => {
    it('prefixes country code', () => {
      expect(toMsg91Mobile('9876543210')).toBe('919876543210');
    });
  });

  describe('sendOtp', () => {
    it('creates a new session and calls MSG91', async () => {
      (OtpSession.findOne as jest.Mock).mockResolvedValue(null);
      (OtpSession.create as jest.Mock).mockResolvedValue({});

      const result = await sendOtp('9876543210');

      expect(sendOtpViaMsg91).toHaveBeenCalledWith('919876543210');
      expect(OtpSession.create).toHaveBeenCalled();
      expect(result.message).toBe('OTP sent');
      expect(result.resendAfterSeconds).toBeGreaterThan(0);
      expect(result.otpExpiresInSeconds).toBeGreaterThan(0);
      expect(result.otpLength).toBeGreaterThanOrEqual(4);
    });

    it('enforces resend cooldown', async () => {
      const now = new Date();
      (OtpSession.findOne as jest.Mock).mockResolvedValue({
        phone: '9876543210',
        sendCount: 1,
        windowStartedAt: now,
        lastSentAt: now,
        save: jest.fn(),
      });

      await expect(sendOtp('9876543210')).rejects.toMatchObject({
        statusCode: 429,
      });
    });
  });

  describe('verifyOtp', () => {
    it('returns registration token for new users', async () => {
      const future = new Date(Date.now() + 5 * 60 * 1000);
      (OtpSession.findOne as jest.Mock).mockResolvedValue({
        phone: '9876543210',
        expiresAt: future,
        failedAttempts: 0,
        save: jest.fn(),
      });
      (SignUp.findOne as jest.Mock).mockResolvedValue(null);

      const result = await verifyOtp('9876543210', '123456');

      expect(verifyOtpViaMsg91).toHaveBeenCalled();
      expect(result.isNewUser).toBe(true);
      if (result.isNewUser) {
        expect(result.phone).toBe('9876543210');
        expect(result.registrationToken).toBeDefined();
      }
    });

    it('increments failed attempts on invalid OTP', async () => {
      const { AppError } = require('../../utils/errorHandler');
      const future = new Date(Date.now() + 5 * 60 * 1000);
      const save = jest.fn();
      (OtpSession.findOne as jest.Mock).mockResolvedValue({
        phone: '9876543210',
        expiresAt: future,
        failedAttempts: 0,
        save,
      });
      (verifyOtpViaMsg91 as jest.Mock).mockRejectedValue(new AppError('Invalid OTP', 401));

      await expect(verifyOtp('9876543210', '000000')).rejects.toBeDefined();
      expect(save).toHaveBeenCalled();
    });
  });
});
