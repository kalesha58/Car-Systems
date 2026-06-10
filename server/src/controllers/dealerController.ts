import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { getDealers, getDealerById } from '../services/admin/dealerService';
import { errorHandler, IAppError } from '../utils/errorHandler';

/**
 * Public controller to get dealers (no authentication required)
 */
export const getDealersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only return approved dealers for public access
    const query = {
      ...req.query,
      status: 'approved',
    };
    const result = await getDealers(query as any);
    const safeDealers = result.dealers.map((d: any) => {
      const { email, phone, ...rest } = d;
      return rest;
    });
    res.status(200).json({
      success: true,
      Response: {
        ...result,
        dealers: safeDealers,
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Public controller to get dealer by ID (no authentication required)
 */
export const getDealerByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dealer = await getDealerById(req.params.id);
    
    // Only return if dealer is approved
    if (dealer.status !== 'approved') {
      res.status(404).json({
        success: false,
        Response: {
          ReturnMessage: 'Dealer not found',
        },
      });
      return;
    }

    const { email, phone, ...safeDealer } = dealer as any;

    res.status(200).json({
      success: true,
      Response: safeDealer,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

