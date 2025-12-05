import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';
import {
  getDealerVehiclesController,
  getDealerVehicleByIdController,
  createDealerVehicleController,
  updateDealerVehicleController,
  updateVehicleAvailabilityController,
  updateVehicleImagesController,
  deleteDealerVehicleController,
  getAvailableDealerVehiclesController,
  filterDealerVehiclesController,
} from '../../controllers/dealer/vehicleController';

const router = Router();

// All routes require authentication and dealer role
router.use(authMiddleware);
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/vehicles:
 *   get:
 *     summary: Get all vehicles for authenticated dealer
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
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
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [available, sold, reserved]
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
 *         description: Vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/', getDealerVehiclesController);

/**
 * @swagger
 * /api/dealer/vehicles/filter:
 *   get:
 *     summary: Filter vehicles by various criteria
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: availability
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
 *     responses:
 *       200:
 *         description: Filtered vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/filter', filterDealerVehiclesController);

/**
 * @swagger
 * /api/dealer/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Dealer]
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
 *         description: Vehicle retrieved successfully
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/:id', getDealerVehicleByIdController);

/**
 * @swagger
 * /api/dealer/vehicles:
 *   post:
 *     summary: Add new vehicle to inventory (requires images array)
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleType, brand, vehicleModel, year, price, availability, images]
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [Car, Bike]
 *               brand:
 *                 type: string
 *               vehicleModel:
 *                 type: string
 *               year:
 *                 type: integer
 *               price:
 *                 type: number
 *               availability:
 *                 type: string
 *                 enum: [available, sold, reserved]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               numberPlate:
 *                 type: string
 *               mileage:
 *                 type: number
 *               color:
 *                 type: string
 *               fuelType:
 *                 type: string
 *                 enum: [Petrol, Diesel, Electric, Hybrid]
 *               transmission:
 *                 type: string
 *                 enum: [Manual, Automatic]
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               condition:
 *                 type: string
 *                 enum: [New, Used, Certified Pre-owned]
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/', createDealerVehicleController);

/**
 * @swagger
 * /api/dealer/vehicles/{id}:
 *   put:
 *     summary: Update vehicle details (can update images array)
 *     tags: [Dealer]
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
 *               vehicleType:
 *                 type: string
 *               brand:
 *                 type: string
 *               vehicleModel:
 *                 type: string
 *               year:
 *                 type: integer
 *               price:
 *                 type: number
 *               availability:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               numberPlate:
 *                 type: string
 *               mileage:
 *                 type: number
 *               color:
 *                 type: string
 *               fuelType:
 *                 type: string
 *               transmission:
 *                 type: string
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               condition:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.put('/:id', updateDealerVehicleController);

/**
 * @swagger
 * /api/dealer/vehicles/{id}/availability:
 *   patch:
 *     summary: Update vehicle availability status
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [availability]
 *             properties:
 *               availability:
 *                 type: string
 *                 enum: [available, sold, reserved]
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/availability', updateVehicleAvailabilityController);

/**
 * @swagger
 * /api/dealer/vehicles/{id}/images:
 *   patch:
 *     summary: Update vehicle images
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Images updated successfully
 *       400:
 *         description: At least one image is required
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/images', updateVehicleImagesController);

/**
 * @swagger
 * /api/dealer/vehicles/{id}:
 *   delete:
 *     summary: Remove vehicle from inventory
 *     tags: [Dealer]
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
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.delete('/:id', deleteDealerVehicleController);

/**
 * @swagger
 * /api/dealer/vehicles/dealer/{dealerId}/available:
 *   get:
 *     summary: Get available vehicles for dealer
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Available vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/dealer/:dealerId/available', getAvailableDealerVehiclesController);

export default router;


