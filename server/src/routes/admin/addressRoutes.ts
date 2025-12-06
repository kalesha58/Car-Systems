import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getAllAddressesController,
  getAddressByIdController,
  createAddressForUserController,
  updateAddressController,
  deleteAddressController,
} from '../../controllers/admin/addressController';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /admin/addresses:
 *   get:
 *     summary: Get all addresses with pagination and filters (admin only)
 *     description: Retrieve all addresses in the system with pagination, search, and filtering options. Admins can filter by user ID to see all addresses for a specific user.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of addresses per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, address, or phone number
 *       - in: query
 *         name: addressType
 *         schema:
 *           type: string
 *           enum: [home, office, other]
 *         description: Filter by address type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID to get all addresses for a specific user
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllAddressesController);

/**
 * @swagger
 * /admin/addresses/{id}:
 *   get:
 *     summary: Get address by ID (admin only)
 *     description: Retrieve a specific address by ID. Admins can access any user's address.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getAddressByIdController);

/**
 * @swagger
 * /admin/addresses:
 *   post:
 *     summary: Create address for a user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, name, phone, fullAddress, coordinates]
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               fullAddress:
 *                 type: string
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               addressType:
 *                 type: string
 *                 enum: [home, office, other]
 *               iconType:
 *                 type: string
 *                 enum: [home, building, location]
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', createAddressForUserController);

/**
 * @swagger
 * /admin/addresses/{id}:
 *   patch:
 *     summary: Update address (admin only)
 *     tags: [Admin]
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
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               fullAddress:
 *                 type: string
 *               coordinates:
 *                 type: object
 *               addressType:
 *                 type: string
 *                 enum: [home, office, other]
 *               iconType:
 *                 type: string
 *                 enum: [home, building, location]
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Address not found
 */
router.patch('/:id', updateAddressController);

/**
 * @swagger
 * /admin/addresses/{id}:
 *   delete:
 *     summary: Delete address (admin only)
 *     tags: [Admin]
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
 *         description: Address deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Address not found
 */
router.delete('/:id', deleteAddressController);

export default router;

