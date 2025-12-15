import { Router } from 'express';
import {
  updatePayoutController,
  getPayoutController,
} from '../../controllers/dealer/payoutController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';

const router = Router();

/**
 * @swagger
 * /api/dealer/payout:
 *   get:
 *     summary: Get dealer payout credentials
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout credentials retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, dealerMiddleware, getPayoutController);

/**
 * @swagger
 * /api/dealer/payout:
 *   patch:
 *     summary: Update dealer payout credentials
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [UPI, BANK]
 *               upiId:
 *                 type: string
 *               bank:
 *                 type: object
 *                 properties:
 *                   accountNumber:
 *                     type: string
 *                   ifsc:
 *                     type: string
 *                   accountName:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payout credentials updated successfully
 *       400:
 *         description: Invalid payout credentials
 *       401:
 *         description: Unauthorized
 */
router.patch('/', authMiddleware, dealerMiddleware, updatePayoutController);

export default router;




