import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import { validateDealerUserIdMiddleware, validateDealerRoleOnlyMiddleware } from '../../middleware/validateDealerUserIdMiddleware';
import {
  getDealersController,
  getDealerByIdController,
  createDealerController,
  updateDealerController,
  deleteDealerController,
  approveDealerController,
  rejectDealerController,
  suspendDealerController,
  getDealerOrdersController,
  createDealerProductController,
  createDealerVehicleController,
  createDealerBusinessRegistrationController,
  updateDealerProductController,
  updateDealerVehicleController,
  getDealerVehiclesController,
  getAllDealerVehiclesController,
  getDealerVehicleByIdController,
  getBusinessRegistrationByUserIdController,
  updateDealerBusinessRegistrationController
} from '../../controllers/admin/dealerController';
import { getUserByBusinessRegistrationIdController } from '../../controllers/admin/userController';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /admin/dealers:
 *   get:
 *     summary: Get all dealers with pagination and filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
     *         name: dealerType
     *         schema:
     *           type: string
     *           enum: [Automobile Showroom, Vehicle Wash Station, Detailing Center, Mechanic Workshop, Spare Parts Dealer, Riding Gear Store]
     *         description: Filter by dealer type
     *     responses:
 *       200:
 *         description: Dealers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', getDealersController);

/**
 * @swagger
 * /admin/dealers/vehicles:
 *   get:
 *     summary: Get all dealer vehicles across all dealers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [Car, Bike]
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [available, sold, reserved]
 *       - in: query
 *         name: dealerId
 *         schema:
 *           type: string
 *         description: Optional - Filter by specific dealer ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by brand, model, or description
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: minYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxYear
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All dealer vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/vehicles', getAllDealerVehiclesController);

/**
 * @swagger
 * /admin/dealers/vehicles/{vehicleId}:
 *   get:
 *     summary: Get vehicle details by vehicle ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle details retrieved successfully
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/vehicles/:vehicleId', getDealerVehicleByIdController);

/**
 * @swagger
 * /admin/dealers/{id}:
 *   get:
 *     summary: Get dealer by ID
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
 *         description: Dealer retrieved successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', getDealerByIdController);

/**
 * @swagger
 * /admin/dealers:
 *   post:
 *     summary: Create a new dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, businessName, email, phone]
 *             properties:
 *               name:
 *                 type: string
 *               businessName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dealer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', createDealerController);

/**
 * @swagger
 * /admin/dealers/{id}:
 *   put:
 *     summary: Update dealer
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
 *         description: Dealer updated successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', updateDealerController);

/**
 * @swagger
 * /admin/dealers/{id}:
 *   delete:
 *     summary: Delete dealer
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
 *         description: Dealer deleted successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', deleteDealerController);

/**
 * @swagger
 * /admin/dealers/{id}/approve:
 *   post:
 *     summary: Approve dealer
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
 *         description: Dealer approved successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/:id/approve', approveDealerController);

/**
 * @swagger
 * /admin/dealers/{id}/reject:
 *   post:
 *     summary: Reject dealer
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dealer rejected successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/:id/reject', rejectDealerController);

/**
 * @swagger
 * /admin/dealers/{id}/suspend:
 *   post:
 *     summary: Suspend dealer
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dealer suspended successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/:id/suspend', suspendDealerController);

/**
 * @swagger
 * /admin/dealers/{userId}/products:
 *   post:
 *     summary: Create product for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, brand, price, stock, images, category]
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [Car, Bike]
 *               specifications:
 *                 type: object
 *               returnPolicy:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/:userId/products', validateDealerUserIdMiddleware, createDealerProductController);

/**
 * @swagger
 * /admin/dealers/{userId}/vehicles:
 *   post:
 *     summary: Create vehicle for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleType, brand, vehicleModel, year, price, availability, images]
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [Car, Bike]
 *               brand:
 *                 type: string
 *               vehicleModel:
 *                 type: string
 *               year:
 *                 type: integer
 *               price:
 *                 type: number
 *               availability:
 *                 type: string
 *                 enum: [available, sold, reserved]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               numberPlate:
 *                 type: string
 *               mileage:
 *                 type: number
 *               color:
 *                 type: string
 *               fuelType:
 *                 type: string
 *                 enum: [Petrol, Diesel, Electric, Hybrid]
 *               transmission:
 *                 type: string
 *                 enum: [Manual, Automatic]
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               condition:
 *                 type: string
 *                 enum: [New, Used, Certified Pre-owned]
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
/**
 * @swagger
 * /admin/dealers/{userId}/vehicles:
 *   get:
 *     summary: Get all vehicles for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [Car, Bike]
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [available, sold, reserved]
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:userId/vehicles', validateDealerUserIdMiddleware, getDealerVehiclesController);

/**
 * @swagger
 * /admin/dealers/{userId}/vehicles:
 *   post:
 *     summary: Create vehicle for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleType, brand, vehicleModel, year, price, availability, images]
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [Car, Bike]
 *               brand:
 *                 type: string
 *               vehicleModel:
 *                 type: string
 *               year:
 *                 type: integer
 *               price:
 *                 type: number
 *               availability:
 *                 type: string
 *                 enum: [available, sold, reserved]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               numberPlate:
 *                 type: string
 *               mileage:
 *                 type: number
 *               color:
 *                 type: string
 *               fuelType:
 *                 type: string
 *                 enum: [Petrol, Diesel, Electric, Hybrid]
 *               transmission:
 *                 type: string
 *                 enum: [Manual, Automatic]
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               condition:
 *                 type: string
 *                 enum: [New, Used, Certified Pre-owned]
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/:userId/vehicles', validateDealerRoleOnlyMiddleware, createDealerVehicleController);

/**
 * @swagger
 * /admin/dealers/{userId}/business-registration:
 *   get:
 *     summary: Get business registration by user ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *     responses:
 *       200:
 *         description: Business registration retrieved successfully
 *       404:
 *         description: Business registration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:userId/business-registration', validateDealerRoleOnlyMiddleware, getBusinessRegistrationByUserIdController);

/**
 * @swagger
 * /admin/dealers/{userId}/business-registration:
 *   post:
 *     summary: Create business registration for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
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
 *     responses:
 *       201:
 *         description: Business registration created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Dealer not found
 *       409:
 *         description: Business registration already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/:userId/business-registration', validateDealerRoleOnlyMiddleware, createDealerBusinessRegistrationController);

/**
 * @swagger
 * /admin/dealers/{userId}/products/{productId}:
 *   put:
 *     summary: Update product for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [Car, Bike]
 *               specifications:
 *                 type: object
 *               returnPolicy:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Dealer or product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:userId/products/:productId', validateDealerUserIdMiddleware, updateDealerProductController);

/**
 * @swagger
 * /admin/dealers/{userId}/vehicles/{vehicleId}:
 *   put:
 *     summary: Update vehicle for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [Car, Bike]
 *               brand:
 *                 type: string
 *               vehicleModel:
 *                 type: string
 *               year:
 *                 type: integer
 *               price:
 *                 type: number
 *               availability:
 *                 type: string
 *                 enum: [available, sold, reserved]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               numberPlate:
 *                 type: string
 *               mileage:
 *                 type: number
 *               color:
 *                 type: string
 *               fuelType:
 *                 type: string
 *                 enum: [Petrol, Diesel, Electric, Hybrid]
 *               transmission:
 *                 type: string
 *                 enum: [Manual, Automatic]
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               condition:
 *                 type: string
 *                 enum: [New, Used, Certified Pre-owned]
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Dealer or vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:userId/vehicles/:vehicleId', validateDealerUserIdMiddleware, updateDealerVehicleController);

/**
 * @swagger
 * /admin/dealers/{id}/orders:
 *   get:
 *     summary: Get dealer orders
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
 *         description: Dealer orders retrieved successfully
 *       404:
 *         description: Dealer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id/orders', getDealerOrdersController);

/**
 * @swagger
 * /admin/dealer/business-registration/{businessRegistrationId}:
 *   get:
 *     summary: Get user data by business registration ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Business registration ID
 *     responses:
 *       200:
 *         description: User and business registration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 businessRegistration:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     businessName:
 *                       type: string
 *                     type:
 *                       type: string
 *                     address:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     gst:
 *                       type: string
 *                     status:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     status:
 *                       type: string
 *                     orders:
 *                       type: array
 *                     vehicles:
 *                       type: array
 *                     createdAt:
 *                       type: string
 *                     role:
 *                       type: array
 *                     profileImage:
 *                       type: string
 *       404:
 *         description: Business registration not found or User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/business-registration/:businessRegistrationId', getUserByBusinessRegistrationIdController);


/**
 * @swagger
 * /admin/dealers/{userId}/business-registration:
 *   put:
 *     summary: Update business registration for a dealer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must have dealer role)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *         description: Forbidden - Admin access required
 */
router.put('/:userId/business-registration', validateDealerRoleOnlyMiddleware, updateDealerBusinessRegistrationController);


export default router;

