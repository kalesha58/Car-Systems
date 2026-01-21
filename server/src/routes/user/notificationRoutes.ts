import { Router } from 'express';
import {
  registerFCMTokenController,
  testGreetingNotificationController,
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  getUnreadCountController,
} from '../../controllers/user/notificationController';
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

/**
 * @swagger
 * /api/user/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [User Notifications]
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
 *         name: read
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/notifications', authMiddleware, getNotificationsController);

/**
 * @swagger
 * /api/user/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [User Notifications]
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
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.put('/notifications/:id/read', authMiddleware, markNotificationAsReadController);

/**
 * @swagger
 * /api/user/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.put('/notifications/read-all', authMiddleware, markAllNotificationsAsReadController);

/**
 * @swagger
 * /api/user/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/notifications/unread-count', authMiddleware, getUnreadCountController);

export default router;


