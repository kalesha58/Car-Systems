import { Router } from 'express';
import {
  createGroupController,
  getUserGroupsController,
  getGroupByIdController,
  updateGroupController,
  deleteGroupController,
  joinGroupController,
  acceptJoinRequestController,
  rejectJoinRequestController,
  getGroupMembersController,
  getJoinRequestsController,
  removeMemberController,
  markAttendanceController,
  driverConsentController,
} from '../../controllers/user/groupController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Group created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, createGroupController);

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get user's groups
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getUserGroupsController);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, getGroupByIdController);

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Update group (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authMiddleware, updateGroupController);

/**
 * @swagger
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete group (owner only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authMiddleware, deleteGroupController);

/**
 * @swagger
 * /api/groups/{id}/join:
 *   post:
 *     summary: Join public group or request to join private group
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join request successful
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/join', authMiddleware, joinGroupController);

/**
 * @swagger
 * /api/groups/{id}/members:
 *   get:
 *     summary: Get group members
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/members', authMiddleware, getGroupMembersController);

/**
 * @swagger
 * /api/groups/{id}/join-requests:
 *   get:
 *     summary: Get pending join requests (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/join-requests', authMiddleware, getJoinRequestsController);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}/accept:
 *   post:
 *     summary: Accept join request (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join request accepted
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/members/:userId/accept', authMiddleware, acceptJoinRequestController);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}/reject:
 *   post:
 *     summary: Reject join request (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Join request rejected
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/members/:userId/reject', authMiddleware, rejectJoinRequestController);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from group (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/members/:userId', authMiddleware, removeMemberController);

/**
 * @swagger
 * /api/groups/{id}/attendance:
 *   post:
 *     summary: Mark attendance (van groups only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/attendance', authMiddleware, markAttendanceController);

/**
 * @swagger
 * /api/groups/{id}/driver-consent:
 *   post:
 *     summary: Driver consent (van groups only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver consent updated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/driver-consent', authMiddleware, driverConsentController);

export default router;


