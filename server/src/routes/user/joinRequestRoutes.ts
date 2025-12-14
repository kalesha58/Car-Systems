import { Router } from 'express';
import {
  requestToJoinGroupController,
  getJoinRequestsForGroupController,
  approveJoinRequestController,
  rejectJoinRequestController,
  getUserJoinRequestsController,
  getPendingRequestCountController,
} from '../../controllers/user/joinRequestController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/join-requests/group/{groupId}:
 *   post:
 *     summary: Request to join a public group
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Join request created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/group/:groupId', authMiddleware, requestToJoinGroupController);

/**
 * @swagger
 * /api/join-requests/group/{groupId}:
 *   get:
 *     summary: Get join requests for a group (group owner only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only group owner can view join requests
 */
router.get('/group/:groupId', authMiddleware, getJoinRequestsForGroupController);

/**
 * @swagger
 * /api/join-requests/group/{groupId}/count:
 *   get:
 *     summary: Get pending request count for a group (group owner only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending request count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only group owner can view pending request count
 */
router.get('/group/:groupId/count', authMiddleware, getPendingRequestCountController);

/**
 * @swagger
 * /api/join-requests/{requestId}/approve:
 *   post:
 *     summary: Approve join request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join request approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only group owner can approve join requests
 */
router.post('/:requestId/approve', authMiddleware, approveJoinRequestController);

/**
 * @swagger
 * /api/join-requests/{requestId}/reject:
 *   post:
 *     summary: Reject join request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join request rejected successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only group owner can reject join requests
 */
router.post('/:requestId/reject', authMiddleware, rejectJoinRequestController);

/**
 * @swagger
 * /api/join-requests/user:
 *   get:
 *     summary: Get user's own join requests
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/user', authMiddleware, getUserJoinRequestsController);

export default router;


