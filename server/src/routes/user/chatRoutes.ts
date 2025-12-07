import { Router } from 'express';
import {
  createDirectChatController,
  getUserChatsController,
  getChatByIdController,
  createGroupChatController,
  editGroupChatController,
  followGroupChatController,
  getOrCreateGroupChatController,
  getChatMessagesController,
  sendMessageController,
  sendImageMessageController,
  startLiveLocationController,
  stopLiveLocationController,
  getLiveLocationsController,
} from '../../controllers/user/chatController';
import { uploadSingle } from '../../middleware/uploadMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get user's chats (direct + group)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getUserChatsController);

/**
 * @swagger
 * /api/chats/direct:
 *   post:
 *     summary: Create or get direct chat
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat retrieved or created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/direct', authMiddleware, createDirectChatController);

/**
 * @swagger
 * /api/chats/group:
 *   post:
 *     summary: Create group chat with multiple users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userIds
 *             properties:
 *               name:
 *                 type: string
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               privacy:
 *                 type: string
 *                 enum: [public, private]
 *                 default: private
 *     responses:
 *       201:
 *         description: Group chat created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/group', authMiddleware, createGroupChatController);

/**
 * @swagger
 * /api/chats/{id}:
 *   get:
 *     summary: Get chat by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, getChatByIdController);

/**
 * @swagger
 * /api/chats/group/{groupId}:
 *   get:
 *     summary: Get or create group chat
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group chat retrieved or created successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/group/:groupId', authMiddleware, getOrCreateGroupChatController);

/**
 * @swagger
 * /api/chats/{chatId}/edit:
 *   put:
 *     summary: Edit group chat (rename, add/remove members, change privacy)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group chat edited successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/:chatId/edit', authMiddleware, editGroupChatController);

/**
 * @swagger
 * /api/chats/{chatId}/follow:
 *   post:
 *     summary: Follow/join public group chat
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully followed group chat
 *       401:
 *         description: Unauthorized
 */
router.post('/:chatId/follow', authMiddleware, followGroupChatController);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:chatId/messages', authMiddleware, getChatMessagesController);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   post:
 *     summary: Send message
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:chatId/messages', authMiddleware, sendMessageController);

/**
 * @swagger
 * /api/chats/{chatId}/messages/image:
 *   post:
 *     summary: Send image message
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Image message sent successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:chatId/messages/image', authMiddleware, uploadSingle, sendImageMessageController);

/**
 * @swagger
 * /api/chats/{chatId}/live-location:
 *   post:
 *     summary: Start live location sharing
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live location started
 *       401:
 *         description: Unauthorized
 */
router.post('/:chatId/live-location', authMiddleware, startLiveLocationController);

/**
 * @swagger
 * /api/chats/{chatId}/live-location:
 *   delete:
 *     summary: Stop live location sharing
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live location stopped
 *       401:
 *         description: Unauthorized
 */
router.delete('/:chatId/live-location', authMiddleware, stopLiveLocationController);

/**
 * @swagger
 * /api/chats/group/{groupId}/live-locations:
 *   get:
 *     summary: Get active live locations for a group
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live locations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/group/:groupId/live-locations', authMiddleware, getLiveLocationsController);

export default router;


