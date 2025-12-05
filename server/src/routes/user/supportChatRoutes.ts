import { Router } from 'express';
import {
  sendMessageController,
  getQuickActionsController,
  handleQuickActionController,
  getChatHistoryController,
  clearChatHistoryController,
} from '../../controllers/user/supportChatController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/support/chat:
 *   post:
 *     summary: Send message to chat bot and get response
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bot response received successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/chat', authMiddleware, sendMessageController);

/**
 * @swagger
 * /api/support/quick-actions:
 *   get:
 *     summary: Get available quick actions for user
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quick actions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/quick-actions', authMiddleware, getQuickActionsController);

/**
 * @swagger
 * /api/support/quick-action:
 *   post:
 *     summary: Handle quick action
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionType
 *             properties:
 *               actionType:
 *                 type: string
 *               actionData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Quick action handled successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/quick-action', authMiddleware, handleQuickActionController);

/**
 * @swagger
 * /api/support/history:
 *   get:
 *     summary: Get chat history
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/history', authMiddleware, getChatHistoryController);

/**
 * @swagger
 * /api/support/history:
 *   delete:
 *     summary: Clear chat history
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/history', authMiddleware, clearChatHistoryController);

export default router;

