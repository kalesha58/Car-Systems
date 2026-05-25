import { Router } from 'express';
import {
  signupController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  googleAuthController,
  acceptPolicyController,
} from '../controllers/authController';
import {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGoogleAuth,
} from '../middleware/validationMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  sendOtpController,
  verifyOtpController,
  completePhoneSignupController,
} from '../controllers/otpAuthController';
import {
  validateSendOtp,
  validateVerifyOtp,
  validateCompletePhoneSignup,
} from '../middleware/otpValidationMiddleware';
import { otpIpRateLimiter } from '../middleware/otpRateLimitMiddleware';
import { registrationTokenMiddleware } from '../middleware/registrationTokenMiddleware';

const router = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 Response:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', validateSignup, signupController);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateLogin, loginController);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset code (OTP)
 *     description: Sends a 6-digit code to the user's email for password reset. The code expires in 10 minutes.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset code sent to email (if user exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error sending email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', validateForgotPassword, forgotPasswordController);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with code (OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', validateResetPassword, resetPasswordController);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with Google OAuth
 *     description: Handles both registration and login via Google OAuth. For registration, phone number is required.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *               - isRegistration
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
 *               phone:
 *                 type: string
 *                 description: Phone number (required if isRegistration is true)
 *                 example: "1234567890"
 *               isRegistration:
 *                 type: boolean
 *                 description: true for registration, false for login
 *                 example: true
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 Response:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid Google token or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/google', validateGoogleAuth, googleAuthController);
router.post('/policy-acceptance', authMiddleware, acceptPolicyController);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to phone via MSG91
 *     tags: [Authentication]
 */
router.post('/send-otp', otpIpRateLimiter, validateSendOtp, sendOtpController);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login or start phone registration
 *     tags: [Authentication]
 */
router.post('/verify-otp', otpIpRateLimiter, validateVerifyOtp, verifyOtpController);

/**
 * @swagger
 * /api/auth/complete-phone-signup:
 *   post:
 *     summary: Complete profile after OTP verify (new users)
 *     tags: [Authentication]
 */
router.post(
  '/complete-phone-signup',
  otpIpRateLimiter,
  registrationTokenMiddleware,
  validateCompletePhoneSignup,
  completePhoneSignupController,
);

export default router;




