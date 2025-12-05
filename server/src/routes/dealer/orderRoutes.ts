import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';
import {
  getDealerOrdersController,
  getDealerOrderByIdController,
  updateOrderStatusController,
  cancelOrderController,
  addTrackingInformationController,
  getOrderTimelineController,
  getOrderStatusHistoryController,
  assignDealerToOrderController,
  refundOrderController,
  getDealerOrderStatsController,
  filterDealerOrdersController,
  acceptOrderController,
  rejectOrderController,
} from '../../controllers/dealer/orderController';

const router = Router();

// All routes require authentication and dealer role
router.use(authMiddleware);
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/orders:
 *   get:
 *     summary: Get all orders for authenticated dealer
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
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
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/', getDealerOrdersController);

/**
 * @swagger
 * /api/dealer/orders/stats:
 *   get:
 *     summary: Get order statistics for dealer
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/stats', getDealerOrderStatsController);

/**
 * @swagger
 * /api/dealer/orders/filter:
 *   get:
 *     summary: Filter orders by various criteria
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/filter', filterDealerOrdersController);

/**
 * @swagger
 * /api/dealer/orders/{id}:
 *   get:
 *     summary: Get order by ID (includes current status and timeline)
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
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/:id', getDealerOrderByIdController);

/**
 * @swagger
 * /api/dealer/orders/{id}/timeline:
 *   get:
 *     summary: Get complete order status history/tracking
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
 *         description: Timeline retrieved successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/:id/timeline', getOrderTimelineController);

/**
 * @swagger
 * /api/dealer/orders/{id}/status-history:
 *   get:
 *     summary: Get order status change history (alternative to timeline)
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
 *         description: Status history retrieved successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/:id/status-history', getOrderStatusHistoryController);

/**
 * @swagger
 * /api/dealer/orders/{id}/status:
 *   patch:
 *     summary: Update order status (automatically adds to timeline)
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
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/status', updateOrderStatusController);

/**
 * @swagger
 * /api/dealer/orders/{id}/accept:
 *   post:
 *     summary: Accept an order (changes status to ORDER_CONFIRMED)
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
 *         description: Order accepted successfully
 *       400:
 *         description: Can only accept orders in ORDER_PLACED or PAYMENT_CONFIRMED status
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/:id/accept', acceptOrderController);

/**
 * @swagger
 * /api/dealer/orders/{id}/reject:
 *   post:
 *     summary: Reject an order (changes status to CANCELLED_BY_DEALER)
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order rejected successfully
 *       400:
 *         description: Can only reject orders in ORDER_PLACED or PAYMENT_CONFIRMED status, or reason is missing
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/:id/reject', rejectOrderController);

/**
 * @swagger
 * /api/dealer/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order (requires reason, validates cancellation eligibility)
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order in current status
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/:id/cancel', cancelOrderController);

/**
 * @swagger
 * /api/dealer/orders/{id}/tracking:
 *   post:
 *     summary: Add/update shipping tracking information
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
 *             required: [trackingNumber, carrier, status]
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *               status:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tracking information added successfully
 *       400:
 *         description: Tracking can only be added for processing, shipped, or delivered orders
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/:id/tracking', addTrackingInformationController);

/**
 * @swagger
 * /api/dealer/orders/{id}/assign-dealer:
 *   post:
 *     summary: Assign dealer to order
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
 *             required: [dealerId]
 *             properties:
 *               dealerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dealer assigned successfully
 *       400:
 *         description: Cannot assign dealer to order in current status
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/:id/assign-dealer', assignDealerToOrderController);

/**
 * @swagger
 * /api/dealer/orders/{id}/refund:
 *   post:
 *     summary: Process refund for order
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Can only refund orders with paid status
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/:id/refund', refundOrderController);

export default router;


