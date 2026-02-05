import { Router } from 'express';
import { getDealersController, getDealerByIdController } from '../controllers/dealerController';
import { getNearbyCarWashDealersController } from '../controllers/dealer/nearbyDealersController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/dealers:
 *   get:
 *     summary: Get all approved dealers with pagination and filters
 *     tags: [Public]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
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
 *         description: Dealers retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get('/', getDealersController);

/**
 * @swagger
 * /api/dealers/{id}:
 *   get:
 *     summary: Get dealer by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dealer retrieved successfully
 *       404:
 *         description: Dealer not found
 */
router.get('/:id', getDealerByIdController);

/**
 * @swagger
 * /api/dealers/nearby/car-wash:
 *   get:
 *     summary: Get nearby car wash dealers
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Nearby dealers retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get('/nearby/car-wash', authMiddleware, getNearbyCarWashDealersController);

export default router;

