import { Request, Response } from 'express';
import { SERVICE_SECTIONS, SPARE_PARTS_BRANDS } from '../data/serviceCategoryConfig';

/**
 * GET /api/service-categories
 *
 * Returns the full nested service category configuration.
 * Used by the admin panel and mobile client to drive cascading dropdowns
 * and subcategory tabs without hardcoding anything client-side.
 *
 * Public endpoint — no authentication required.
 */
export const getServiceCategoriesController = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    Response: {
      sections: SERVICE_SECTIONS,
      sparePartsBrands: SPARE_PARTS_BRANDS,
    },
  });
};
