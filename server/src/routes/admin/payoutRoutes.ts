import { Router } from 'express';
import {
  getPayoutsController,
  getPayoutStatsController,
  retryPayoutController,
} from '../../controllers/admin/payoutController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';

const router = Router();

/**
 * @swagger
 * /api/admin/payouts:
 *   get:
 *     summary: Get all payouts with filters
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
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payouts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, adminMiddleware, getPayoutsController);

/**
 * @swagger
 * /api/admin/payouts/stats:
 *   get:
 *     summary: Get payout statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authMiddleware, adminMiddleware, getPayoutStatsController);

/**
 * @swagger
 * /api/admin/payouts/:orderId/retry:
 *   post:
 *     summary: Retry failed payout
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payout retry initiated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:orderId/retry', authMiddleware, adminMiddleware, retryPayoutController);

export default router;

