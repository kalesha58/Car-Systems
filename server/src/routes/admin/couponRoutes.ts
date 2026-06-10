import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getCouponsController,
  getCouponByIdController,
  createCouponController,
  updateCouponController,
  deleteCouponController,
} from '../../controllers/admin/couponController';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /admin/coupons:
 *   get:
 *     summary: Get all coupons with pagination and filters
 *     tags: [Admin]
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 */
router.get('/', getCouponsController);

/**
 * @swagger
 * /admin/coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getCouponByIdController);

/**
 * @swagger
 * /admin/coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue, validFrom, validUntil]
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *               usageLimit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/', createCouponController);

/**
 * @swagger
 * /admin/coupons/{id}:
 *   put:
 *     summary: Update coupon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', updateCouponController);

/**
 * @swagger
 * /admin/coupons/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', deleteCouponController);

export default router;
