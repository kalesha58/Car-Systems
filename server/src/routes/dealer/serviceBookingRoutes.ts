import { Router } from 'express';
import {
  getDealerServiceBookingsController,
  updateServiceBookingStatusController,
} from '../../controllers/dealer/serviceBookingController';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';

const router = Router();

// Apply dealer middleware to all routes
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/service-bookings:
 *   get:
 *     summary: Get dealer's service bookings
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, scheduled, in_progress, awaiting, completed, cancelled]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Service bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/', getDealerServiceBookingsController);

/**
 * @swagger
 * /api/dealer/service-bookings/{id}/status:
 *   patch:
 *     summary: Update service booking status
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, scheduled, in_progress, awaiting, completed, cancelled]
 *               dealerNotes:
 *                 type: string
 *               assignedMechanic:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [high, medium, low]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/status', updateServiceBookingStatusController);

export default router;
