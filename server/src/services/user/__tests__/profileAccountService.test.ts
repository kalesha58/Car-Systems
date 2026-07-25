jest.mock('../../../models/SignUp', () => ({
  SignUp: {
    findById: jest.fn(),
  },
  DEFAULT_NOTIFICATION_SETTINGS: {
    pushEnabled: true,
    orderUpdates: true,
    bookingUpdates: true,
    promotions: false,
    communityActivity: true,
    emailUpdates: false,
  },
}));

jest.mock('../../../models/user/Post', () => ({ Post: { countDocuments: jest.fn() } }));
jest.mock('../../../models/user/Vehicle', () => ({ Vehicle: { countDocuments: jest.fn() } }));
jest.mock('../../../models/Order', () => ({ Order: { countDocuments: jest.fn() } }));
jest.mock('../../../models/Review', () => ({ Review: { countDocuments: jest.fn() } }));
jest.mock('../../../config/cloudinary', () => ({
  deleteFromCloudinary: jest.fn(),
  uploadToCloudinary: jest.fn(),
}));
jest.mock('../../otpAuthService', () => ({
  normalizePhone: jest.fn(),
  sendOtp: jest.fn(),
  verifyOtpCodeOnly: jest.fn(),
}));

import bcrypt from 'bcryptjs';

import { SignUp } from '../../../models/SignUp';
import {
  changeUserPassword,
  deactivateUserAccount,
  updateNotificationSettings,
} from '../profileService';

const USER_ID = '507f1f77bcf86cd799439022';

/** Minimal stand-in for a mongoose document with a spy-able save(). */
const makeUserDoc = (overrides: Record<string, unknown> = {}) => ({
  name: 'Asha Rao',
  status: 'active',
  password: 'hashed-current',
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('profileService account management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('changeUserPassword', () => {
    it('assigns the plaintext password so the pre-save hook hashes it', async () => {
      const user = makeUserDoc();
      (SignUp.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await changeUserPassword(USER_ID, 'currentPass1', 'brandNewPass1');

      expect(user.password).toBe('brandNewPass1');
      expect(user.save).toHaveBeenCalled();
    });

    it('rejects an incorrect current password without saving', async () => {
      const user = makeUserDoc();
      (SignUp.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        changeUserPassword(USER_ID, 'wrongPass1', 'brandNewPass1'),
      ).rejects.toThrow('Current password is incorrect');
      expect(user.save).not.toHaveBeenCalled();
    });

    it('rejects a new password shorter than 8 characters', async () => {
      await expect(changeUserPassword(USER_ID, 'currentPass1', 'short')).rejects.toThrow(
        'New password must be at least 8 characters',
      );
      expect(SignUp.findById).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password', async () => {
      await expect(changeUserPassword(USER_ID, 'samePass123', 'samePass123')).rejects.toThrow(
        'New password must be different from the current password',
      );
    });

    it('rejects non-string credentials from a crafted JSON body', async () => {
      await expect(
        changeUserPassword(USER_ID, { $ne: null } as never, 'brandNewPass1'),
      ).rejects.toThrow('Current password and new password must be text values');
      expect(SignUp.findById).not.toHaveBeenCalled();
    });
  });

  describe('deactivateUserAccount', () => {
    it('marks the account inactive and stores the reason', async () => {
      const user = makeUserDoc();
      (SignUp.findById as jest.Mock).mockResolvedValue(user);

      await deactivateUserAccount(USER_ID, '  I need a break  ');

      expect(user.status).toBe('inactive');
      expect((user as any).deactivationReason).toBe('I need a break');
      expect((user as any).deactivatedAt).toBeInstanceOf(Date);
      expect(user.save).toHaveBeenCalled();
    });

    it('ignores a non-string reason instead of failing the request', async () => {
      const user = makeUserDoc();
      (SignUp.findById as jest.Mock).mockResolvedValue(user);

      await deactivateUserAccount(USER_ID, { evil: true } as never);

      expect((user as any).deactivationReason).toBeUndefined();
      expect(user.status).toBe('inactive');
    });
  });

  describe('updateNotificationSettings', () => {
    it('applies only known boolean keys and ignores injected fields', async () => {
      const user = makeUserDoc({ notificationSettings: undefined });
      (SignUp.findById as jest.Mock).mockResolvedValue(user);

      const result = await updateNotificationSettings(USER_ID, {
        promotions: true,
        isAdmin: true,
        pushEnabled: 'yes',
      } as never);

      expect(result.promotions).toBe(true);
      expect(result.pushEnabled).toBe(true); // unchanged: 'yes' is not a boolean
      expect(result).not.toHaveProperty('isAdmin');
      expect(user.save).toHaveBeenCalled();
    });
  });
});
