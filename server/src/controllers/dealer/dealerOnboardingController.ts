import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import { errorHandler, IAppError } from '../../utils/errorHandler';

/**
 * GET /api/dealer/me/onboarding — single payload for dealer app onboarding / gating.
 */
export const getDealerMeOnboardingController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.role.includes('dealer')) {
      res.status(403).json({
        success: false,
        Response: {
          ReturnMessage: 'Dealer role required',
        },
      });
      return;
    }

    const userId = req.user.userId;
    const reg = await BusinessRegistration.findOne({ userId });

    if (!reg) {
      res.status(200).json({
        success: true,
        Response: {
          hasRegistration: false,
          status: null,
          registrationId: null,
          businessName: null,
          businessType: null,
          submittedAt: null,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
        Response: {
        hasRegistration: true,
        status: reg.status,
        registrationId: (reg._id as any).toString(),
        businessName: reg.businessName,
        businessType: reg.type,
        submittedAt: reg.createdAt?.toISOString() || null,
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
