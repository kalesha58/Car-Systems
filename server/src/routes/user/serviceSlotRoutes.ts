import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  getServiceSlotsController,
  bookServiceSlotController,
} from '../../controllers/user/serviceSlotController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/services/{serviceId}/slots:
 *   get:
 *     summary: Get available slots for a service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [center, home]
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */
router.get('/:serviceId/slots', getServiceSlotsController);

/**
 * @swagger
 * /api/services/{serviceId}/slots/{slotId}/book:
 *   post:
 *     summary: Book a service slot
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot booked successfully
 *       400:
 *         description: Slot not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Slot not found
 */
router.post('/:serviceId/slots/:slotId/book', bookServiceSlotController);

export default router;
