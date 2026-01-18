import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';
import {
  getDealerPreBookingsController,
  getDealerPreBookingByIdController,
  updatePreBookingStatusController,
} from '../../controllers/dealer/preBookingController';
import { validateUpdatePreBookingStatus } from '../../middleware/validationMiddleware';

const router = Router();

// All routes require authentication and dealer role
router.use(authMiddleware);
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/pre-bookings:
 *   get:
 *     summary: Get dealer's pre-bookings
 *     tags: [Dealer]
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
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/', getDealerPreBookingsController);

/**
 * @swagger
 * /api/dealer/pre-bookings/{id}:
 *   get:
 *     summary: Get pre-booking by ID
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
 *         description: Pre-booking retrieved successfully
 *       404:
 *         description: Pre-booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/:id', getDealerPreBookingByIdController);

/**
 * @swagger
 * /api/dealer/pre-bookings/{id}/status:
 *   patch:
 *     summary: Update pre-booking status
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *               dealerNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pre-booking status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Pre-booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/status', validateUpdatePreBookingStatus, updatePreBookingStatusController);

export default router;












