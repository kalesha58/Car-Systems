import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  createTestDriveController,
  getUserTestDrivesController,
  getUserTestDriveByIdController,
  cancelUserTestDriveController,
} from '../../controllers/user/testDriveController';
import { validateCreateTestDrive } from '../../middleware/validationMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/user/test-drives:
 *   post:
 *     summary: Create a new test drive request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, preferredDate, preferredTime]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               preferredDate:
 *                 type: string
 *                 format: date
 *               preferredTime:
 *                 type: string
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Test drive request created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateCreateTestDrive, createTestDriveController);

/**
 * @swagger
 * /api/user/test-drives:
 *   get:
 *     summary: Get user's test drives
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, cancelled]
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Test drives retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getUserTestDrivesController);

/**
 * @swagger
 * /api/user/test-drives/{id}:
 *   get:
 *     summary: Get test drive by ID
 *     tags: [User]
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
 *         description: Test drive retrieved successfully
 *       404:
 *         description: Test drive not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', getUserTestDriveByIdController);

/**
 * @swagger
 * /api/user/test-drives/{id}/cancel:
 *   patch:
 *     summary: Cancel test drive
 *     tags: [User]
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
 *         description: Test drive cancelled successfully
 *       404:
 *         description: Test drive not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/cancel', cancelUserTestDriveController);

export default router;












