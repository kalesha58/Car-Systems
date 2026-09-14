import { Router } from 'express';
import { getAllDealerVehiclesForUsersController } from '../../controllers/user/vehicleController';

const router = Router();

/**
 * @swagger
 * /api/user/dealer-vehicles:
 *   get:
 *     summary: Get all dealer vehicles for users with dealer information
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [Car, Bike]
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: minYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Dealer vehicles retrieved successfully
 */
router.get('/', getAllDealerVehiclesForUsersController);

export default router;

