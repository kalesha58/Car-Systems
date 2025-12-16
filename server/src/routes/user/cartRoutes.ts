import {Router} from 'express';
import {authMiddleware} from '../../middleware/authMiddleware';
import {
  getProductStockController,
  getDeliveryTimeEstimateController,
  getRelatedProductsController,
  getApplicableCouponsController,
  validateCartItemsController,
} from '../../controllers/user/cartController';

const router = Router();

/**
 * @swagger
 * /api/user/cart/products/{productId}/stock:
 *   get:
 *     summary: Get product stock availability
 *     tags: [User Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock information retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/products/:productId/stock', authMiddleware, getProductStockController);

/**
 * @swagger
 * /api/user/cart/delivery-time:
 *   post:
 *     summary: Estimate delivery time
 *     tags: [User Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressId:
 *                 type: string
 *               dealerId:
 *                 type: string
 *               itemCount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Delivery time estimated successfully
 */
router.post('/delivery-time', authMiddleware, getDeliveryTimeEstimateController);

/**
 * @swagger
 * /api/user/cart/related-products:
 *   get:
 *     summary: Get related products for cart items
 *     tags: [User Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Related products retrieved successfully
 */
router.get('/related-products', authMiddleware, getRelatedProductsController);

/**
 * @swagger
 * /api/user/cart/applicable-coupons:
 *   get:
 *     summary: Get applicable coupons for cart
 *     tags: [User Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: totalAmount
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Applicable coupons retrieved successfully
 */
router.get('/applicable-coupons', authMiddleware, getApplicableCouponsController);

/**
 * @swagger
 * /api/user/cart/validate:
 *   post:
 *     summary: Validate cart items (stock, availability)
 *     tags: [User Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Cart validation completed
 */
router.post('/validate', authMiddleware, validateCartItemsController);

export default router;

