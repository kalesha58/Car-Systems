import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import { getAdminServiceBookingsController } from '../../controllers/admin/serviceBookingController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /admin/service-bookings:
 *   get:
 *     summary: Get all service bookings (Admin)
 *     tags: [Admin]
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
 *           enum: [new, scheduled, in_progress, awaiting, completed, cancelled]
 *       - in: query
 *         name: dealerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Service bookings retrieved successfully
 */
router.get('/', getAdminServiceBookingsController);

export default router;
