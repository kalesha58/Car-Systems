import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getDealerEnquiries, updateEnquiryStatus } from '../../services/dealer/customerEnquiryService';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export const getDealerEnquiriesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const query = req.query as any;

    const result = await getDealerEnquiries(dealerId, query);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateEnquiryStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const enquiryId = req.params.id;

    const enquiry = await updateEnquiryStatus(enquiryId, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: enquiry,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
