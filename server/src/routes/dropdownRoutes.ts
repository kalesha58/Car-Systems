import { Router } from 'express';
import { getDropdownOptionsController } from '../controllers/dropdownController';

const router = Router();

/**
 * @swagger
 * /api/dropdowns:
 *   get:
 *     summary: Get all dropdown options
 *     tags: [Dropdowns]
 *     parameters:
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [Car, Bike]
 *         description: Filter brands by vehicle type
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *         description: Filter models by brand ID
 *     responses:
 *       200:
 *         description: Dropdown options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 Response:
 *                   type: object
 *                   properties:
 *                     vehicleTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           value:
 *                             type: string
 *                     brands:
 *                       type: array
 *                       items:
 *                         type: object
 *                     models:
 *                       type: array
 *                       items:
 *                         type: object
 *                     availability:
 *                       type: array
 *                       items:
 *                         type: object
 *                     fuelTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     transmission:
 *                       type: array
 *                       items:
 *                         type: object
 *                     condition:
 *                       type: array
 *                       items:
 *                         type: object
 *                     businessTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/', getDropdownOptionsController);

export default router;

