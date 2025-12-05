import { Router } from 'express';
import {
  createVehicleController,
  getVehiclesController,
  getVehicleByIdController,
  updateVehicleController,
  deleteVehicleController,
} from '../../controllers/user/vehicleController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateCreateVehicle, validateUpdateVehicle } from '../../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, validateCreateVehicle, createVehicleController);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getVehiclesController);


/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, getVehicleByIdController);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authMiddleware, validateUpdateVehicle, updateVehicleController);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authMiddleware, deleteVehicleController);

export default router;

