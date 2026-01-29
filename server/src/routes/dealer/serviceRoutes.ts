import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';
import {
  getDealerServicesController,
  getDealerServiceByIdController,
  createDealerServiceController,
  updateDealerServiceController,
  updateServiceStatusController,
  toggleServiceStatusController,
  updateServiceImagesController,
  deleteDealerServiceController,
  getServicesByCategoryController,
  getHomeServicesController,
  getActiveDealerServicesController,
  searchDealerServicesController,
} from '../../controllers/dealer/serviceController';

const router = Router();

// All routes require authentication and dealer role
router.use(authMiddleware);
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/services:
 *   get:
 *     summary: Get all services for authenticated dealer
 *     tags: [Dealer]
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
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: homeService
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *       - in: query
     *         name: vehicleType
     *         schema:
     *           type: string
     *           enum: [Car, Bike]
     *       - in: query
     *         name: vehicleModel
     *         schema:
     *           type: string
     *       - in: query
     *         name: vehicleBrand
     *         schema:
     *           type: string
     *       - in: query
     *         name: serviceType
     *         schema:
     *           type: string
     *           enum: [car_wash, car_detailing, car_automobile, bike_automobile, general]
     *       - in: query
     *         name: serviceSubCategory
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Services retrieved successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - Dealer access required
     */
    router.get('/', getDealerServicesController);

/**
 * @swagger
 * /api/dealer/services/search:
 *   get:
 *     summary: Search services
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/search', searchDealerServicesController);

/**
 * @swagger
 * /api/dealer/services/category/{category}:
 *   get:
 *     summary: Get services by category
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/category/:category', getServicesByCategoryController);

/**
 * @swagger
 * /api/dealer/services/home-service:
 *   get:
 *     summary: Get home services
 *     tags: [Dealer]
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
 *     responses:
 *       200:
 *         description: Home services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/home-service', getHomeServicesController);

/**
 * @swagger
 * /api/dealer/services/dealer/{dealerId}/active:
 *   get:
 *     summary: Get active services for dealer
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Active services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/dealer/:dealerId/active', getActiveDealerServicesController);

/**
 * @swagger
 * /api/dealer/services/{id}:
 *   get:
 *     summary: Get service by ID
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
 *         description: Service retrieved successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/:id', getDealerServiceByIdController);

/**
 * @swagger
 * /api/dealer/services:
 *   post:
 *     summary: Add new service
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, durationMinutes, homeService]
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               durationMinutes:
 *                 type: integer
 *               homeService:
 *                 type: boolean
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/', createDealerServiceController);

/**
 * @swagger
 * /api/dealer/services/{id}:
 *   put:
 *     summary: Update service details
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               durationMinutes:
 *                 type: integer
 *               homeService:
 *                 type: boolean
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: object
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.put('/:id', updateDealerServiceController);

/**
 * @swagger
 * /api/dealer/services/{id}/status:
 *   patch:
 *     summary: Update service status
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/status', updateServiceStatusController);

/**
 * @swagger
 * /api/dealer/services/{id}/toggle-status:
 *   put:
 *     summary: Toggle service status (enable/disable)
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
 *         description: Status toggled successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.put('/:id/toggle-status', toggleServiceStatusController);

/**
 * @swagger
 * /api/dealer/services/{id}/images:
 *   patch:
 *     summary: Update service images
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
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Service images updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/images', updateServiceImagesController);

/**
 * @swagger
 * /api/dealer/services/{id}:
 *   delete:
 *     summary: Delete service (validates no active bookings)
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
 *         description: Service deleted successfully
 *       400:
 *         description: Cannot delete service with active bookings
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.delete('/:id', deleteDealerServiceController);

export default router;


