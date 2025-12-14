import { Router } from 'express';
import { registerFCMTokenController, testGreetingNotificationController } from '../../controllers/user/notificationController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/user/fcm-token:
 *   post:
 *     summary: Register or update FCM token for push notifications
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *                 example: "cXyZ123..."
 *     responses:
 *       200:
 *         description: FCM token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 Response:
 *                   type: object
 *                   properties:
 *                     ReturnMessage:
 *                       type: string
 *                       example: "FCM token registered successfully"
 *       400:
 *         description: Invalid FCM token
 *       401:
 *         description: Unauthorized
 */
router.post('/fcm-token', authMiddleware, registerFCMTokenController);

/**
 * @swagger
 * /api/user/test-greeting-notification:
 *   post:
 *     summary: Test greeting notification (for development/testing)
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Greeting notification sent successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to send notification
 */
router.post('/test-greeting-notification', authMiddleware, testGreetingNotificationController);

export default router;


