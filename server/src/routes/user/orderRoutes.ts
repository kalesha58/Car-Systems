import { Router } from 'express';
import {
  createOrderController,
  verifyPaymentController,
  getUserOrdersController,
  getOrderByIdController,
  cancelOrderController,
  requestReturnController,
  getOrderStatusController,
} from '../../controllers/user/orderController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { idempotencyMiddleware } from '../../middleware/idempotencyMiddleware';

const router = Router();

/**
 * @swagger
 * /api/user/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, idempotencyMiddleware, createOrderController);

/**
 * @swagger
 * /api/user/orders:
 *   get:
 *     summary: Get all orders for authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getUserOrdersController);

/**
 * @swagger
 * /api/user/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', authMiddleware, getOrderByIdController);

/**
 * @swagger
 * /api/user/orders/{id}/status:
 *   get:
 *     summary: Get order status and payment status
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
 *         description: Order status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id/status', authMiddleware, getOrderStatusController);

/**
 * @swagger
 * /api/user/orders/{id}/verify-payment:
 *   post:
 *     summary: Verify payment for an order
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment verification failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/verify-payment', authMiddleware, verifyPaymentController);

/**
 * @swagger
 * /api/user/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [User]
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', authMiddleware, cancelOrderController);

/**
 * @swagger
 * /api/user/orders/{id}/return:
 *   post:
 *     summary: Request return for a delivered order
 *     tags: [User]
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
 *             required: [reason, items]
 *             properties:
 *               reason:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     orderItemId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Return request created successfully
 *       400:
 *         description: Cannot request return for order in current status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/return', authMiddleware, requestReturnController);

export default router;

