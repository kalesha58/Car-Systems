import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadSingle } from '../../middleware/uploadMiddleware';
import {
  getProfileController,
  updateProfileController,
  getUserStatsController,
  getPrivacySettingsController,
  updatePrivacySettingsController,
  deleteAccountController,
  sendPhoneChangeOtpController,
  verifyPhoneChangeController,
} from '../../controllers/user/profileController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getProfileController);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update name, email, and/or profile image. Phone number changes require OTP via /profile/phone endpoints.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 description: User's email address
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image (from gallery or camera)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already in use
 */
router.put('/', uploadSingle, updateProfileController);

router.post('/phone/send-otp', sendPhoneChangeOtpController);
router.post('/phone/verify', verifyPhoneChangeController);

/**
 * @swagger
 * /api/profile/stats:
 *   get:
 *     summary: Get current user statistics
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 Response:
 *                   type: object
 *                   properties:
 *                     postsCount:
 *                       type: number
 *                     vehiclesCount:
 *                       type: number
 *                     ordersCount:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', getUserStatsController);

/**
 * @swagger
 * /api/profile/privacy-settings:
 *   get:
 *     summary: Get user privacy settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/privacy-settings', getPrivacySettingsController);

/**
 * @swagger
 * /api/profile/privacy-settings:
 *   put:
 *     summary: Update user privacy settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPrivate:
 *                 type: boolean
 *               hidePhone:
 *                 type: boolean
 *               hideEmail:
 *                 type: boolean
 *               hideVehicleNumber:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/privacy-settings', updatePrivacySettingsController);

router.delete('/account', deleteAccountController);

export default router;
