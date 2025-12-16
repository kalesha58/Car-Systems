import {Router} from 'express';
import {authMiddleware} from '../../middleware/authMiddleware';
import {getAllCouponsController} from '../../controllers/user/couponController';

const router = Router();

/**
 * @swagger
 * /api/user/coupons:
 *   get:
 *     summary: Get all active coupons
 *     tags: [User Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getAllCouponsController);

export default router;

