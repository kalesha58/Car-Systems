import { Router } from 'express';
import {
  getDealerInfoController,
  verifyDealerForChatController,
} from '../../controllers/user/dealerController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/user/dealer/:dealerId/info:
 *   get:
 *     summary: Get dealer information by dealerId
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
 *         description: BusinessRegistration ID
 *     responses:
 *       200:
 *         description: Dealer info retrieved successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:dealerId/info', authMiddleware, getDealerInfoController);

/**
 * @swagger
 * /api/user/dealer/:dealerId/verify:
 *   get:
 *     summary: Verify dealer is approved for chat
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
 *         description: BusinessRegistration ID
 *     responses:
 *       200:
 *         description: Dealer verified and approved
 *       403:
 *         description: Dealer not approved
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:dealerId/verify', authMiddleware, verifyDealerForChatController);

export default router;
