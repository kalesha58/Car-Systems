import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  createPreBookingController,
  getUserPreBookingsController,
  getUserPreBookingByIdController,
  cancelUserPreBookingController,
} from '../../controllers/user/preBookingController';
import { validateCreatePreBooking } from '../../middleware/validationMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/user/pre-bookings:
 *   post:
 *     summary: Create a new pre-booking request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, bookingDate]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               bookingDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pre-booking request created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateCreatePreBooking, createPreBookingController);

/**
 * @swagger
 * /api/user/pre-bookings:
 *   get:
 *     summary: Get user's pre-bookings
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
 *           enum: [pending, confirmed, cancelled]
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
 *         description: Pre-bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getUserPreBookingsController);

/**
 * @swagger
 * /api/user/pre-bookings/{id}:
 *   get:
 *     summary: Get pre-booking by ID
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
 *         description: Pre-booking retrieved successfully
 *       404:
 *         description: Pre-booking not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', getUserPreBookingByIdController);

/**
 * @swagger
 * /api/user/pre-bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel pre-booking
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
 *         description: Pre-booking cancelled successfully
 *       404:
 *         description: Pre-booking not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/cancel', cancelUserPreBookingController);

export default router;



