import { Request, Response, NextFunction } from 'express';
import { getDropdownOptions } from '../services/dropdownService';
import { errorHandler, IAppError } from '../utils/errorHandler';

export const getDropdownOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { vehicleType, brandId } = req.query;
    const options = await getDropdownOptions(
      vehicleType as string | undefined,
      brandId as string | undefined,
    );
    res.status(200).json({
      success: true,
      Response: options,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

