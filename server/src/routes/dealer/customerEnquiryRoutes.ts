import { Router } from 'express';
import {
  getDealerEnquiriesController,
  updateEnquiryStatusController,
} from '../../controllers/dealer/customerEnquiryController';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';

const router = Router();

// Apply dealer middleware to all routes
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/customer-enquiries:
 *   get:
 *     summary: Get dealer's customer enquiries
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, responded, resolved]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Enquiries retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/', getDealerEnquiriesController);

/**
 * @swagger
 * /api/dealer/customer-enquiries/{id}/status:
 *   patch:
 *     summary: Update enquiry status
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
 *                 enum: [new, responded, resolved]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Enquiry not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/status', updateEnquiryStatusController);

export default router;
