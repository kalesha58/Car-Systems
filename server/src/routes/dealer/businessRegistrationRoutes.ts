import { Router, Response, NextFunction } from 'express';
import { authMiddleware, IAuthRequest } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';
import {
  createBusinessRegistrationController,
  getBusinessRegistrationByIdController,
  getBusinessRegistrationByUserIdController,
  updateBusinessRegistrationController,
  updateBusinessRegistrationStatusController,
  deleteBusinessRegistrationController,
} from '../../controllers/dealer/businessRegistrationController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Simple role check middleware for POST route (create registration)
// POST route doesn't need existing dealer profile - you're registering to become one
const checkDealerRole = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.role.includes('dealer')) {
    res.status(403).json({
      success: false,
      Response: {
        ReturnMessage: 'Dealer role required',
      },
    });
    return;
  }
  next();
};

// POST route - only needs auth + dealer role, NOT existing business registration
router.post('/', checkDealerRole, createBusinessRegistrationController);
/**
 * @swagger
 * /api/dealer/business-registration/user/{userId}:
 *   get:
 *     summary: Get business registration by user ID
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business registration retrieved successfully
 *       404:
 *         description: Business registration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/user/:userId', getBusinessRegistrationByUserIdController);

// All other routes require approved business registration
// Publicly accessible route (authenticated users) to get registration details
// Needed for customers to validate dealer status in cart
router.get('/:id', getBusinessRegistrationByIdController);

// All other routes require approved business registration
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/business-registration:
 *   post:
 *     summary: Create business registration
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessName, type, address, phone]
 *             properties:
 *               businessName:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Automobile Showroom, Vehicle Wash Station, Detailing Center, Mechanic Workshop, Spare Parts Dealer, Riding Gear Store]
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               gst:
 *                 type: string
 *               payout:
 *                 type: object
 *                 description: Payout credentials (optional)
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [UPI, BANK]
 *                   upiId:
 *                     type: string
 *                     description: Required if type is UPI. Format: username@paymentprovider
 *                     example: "user@paytm"
 *                   bank:
 *                     type: object
 *                     description: Required if type is BANK
 *                     properties:
 *                       accountNumber:
 *                         type: string
 *                         description: Bank account number
 *                       ifsc:
 *                         type: string
 *                         description: IFSC code (format: XXXX0XXXXX)
 *                         example: "HDFC0001234"
 *                       accountName:
 *                         type: string
 *                         description: Account holder name
 *     responses:
 *       201:
 *         description: Business registration created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/', createBusinessRegistrationController);

/**
 * @swagger
 * /api/dealer/business-registration/{id}:
 *   get:
 *     summary: Get business registration by ID
 *     tags: [Dealer]
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
 *         description: Business registration retrieved successfully
 *       404:
 *         description: Business registration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */




/**
 * @swagger
 * /api/dealer/business-registration/{id}:
 *   put:
 *     summary: Update business registration
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               type:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               gst:
 *                 type: string
 *               payout:
 *                 type: object
 *                 description: Payout credentials (optional)
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [UPI, BANK]
 *                   upiId:
 *                     type: string
 *                     description: Required if type is UPI. Format: username@paymentprovider
 *                   bank:
 *                     type: object
 *                     description: Required if type is BANK
 *                     properties:
 *                       accountNumber:
 *                         type: string
 *                       ifsc:
 *                         type: string
 *                         description: IFSC code (format: XXXX0XXXXX)
 *                       accountName:
 *                         type: string
 *     responses:
 *       200:
 *         description: Business registration updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Business registration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.put('/:id', updateBusinessRegistrationController);

/**
 * @swagger
 * /api/dealer/business-registration/{id}/status:
 *   patch:
 *     summary: Update business registration status
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *               approvalCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Business registration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/status', updateBusinessRegistrationStatusController);

/**
 * @swagger
 * /api/dealer/business-registration/{id}:
 *   delete:
 *     summary: Delete business registration
 *     tags: [Dealer]
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
 *         description: Business registration deleted successfully
 *       400:
 *         description: Cannot delete approved registration
 *       404:
 *         description: Business registration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.delete('/:id', deleteBusinessRegistrationController);

export default router;

