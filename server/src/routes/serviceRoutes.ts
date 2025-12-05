import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import {
  getServicesController,
  getServiceByIdController,
  getServicesByDealerIdController,
  createServiceController,
  updateServiceController,
  deleteServiceController,
} from '../controllers/serviceController';

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services with pagination and filters
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
 *         name: dealerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: homeService
 *         schema:
 *           type: boolean
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
 *         description: Services retrieved successfully
 */
router.get('/', getServicesController);

/**
 * @swagger
 * /api/services/dealer/{dealerId}:
 *   get:
 *     summary: Get services by dealer ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 */
router.get('/dealer/:dealerId', getServicesByDealerIdController);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *       404:
 *         description: Service not found
 */
router.get('/:id', getServiceByIdController);

// Admin routes - require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service (Admin only)
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dealerId, name, price, durationMinutes, homeService]
 *             properties:
 *               dealerId:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               durationMinutes:
 *                 type: number
 *               homeService:
 *                 type: boolean
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', createServiceController);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update service (Admin only)
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               durationMinutes:
 *                 type: number
 *               homeService:
 *                 type: boolean
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', updateServiceController);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete service (Admin only)
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', deleteServiceController);

export default router;

