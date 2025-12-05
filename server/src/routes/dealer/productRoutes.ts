import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';
import {
  getDealerProductsController,
  getDealerProductByIdController,
  createDealerProductController,
  updateDealerProductController,
  updateProductStockController,
  updateProductStatusController,
  updateProductImagesController,
  deleteDealerProductController,
  getProductsByCategoryController,
  getProductsByVehicleTypeController,
  searchDealerProductsController,
} from '../../controllers/dealer/productController';

const router = Router();

// All routes require authentication and dealer role
router.use(authMiddleware);
router.use(dealerMiddleware);

/**
 * @swagger
 * /api/dealer/products:
 *   get:
 *     summary: Get all products for authenticated dealer
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
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [Car, Bike]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
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
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/', getDealerProductsController);

/**
 * @swagger
 * /api/dealer/products/search:
 *   get:
 *     summary: Search products
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
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/search', searchDealerProductsController);

/**
 * @swagger
 * /api/dealer/products/category/{category}:
 *   get:
 *     summary: Get products by category
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
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/category/:category', getProductsByCategoryController);

/**
 * @swagger
 * /api/dealer/products/vehicle-type/{vehicleType}:
 *   get:
 *     summary: Get products by vehicle type
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Car, Bike]
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
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/vehicle-type/:vehicleType', getProductsByVehicleTypeController);

/**
 * @swagger
 * /api/dealer/products/{id}:
 *   get:
 *     summary: Get product by ID
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
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.get('/:id', getDealerProductByIdController);

/**
 * @swagger
 * /api/dealer/products:
 *   post:
 *     summary: Add new product (requires images array)
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.post('/', createDealerProductController);

/**
 * @swagger
 * /api/dealer/products/{id}:
 *   put:
 *     summary: Update product details (can update images array)
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
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.put('/:id', updateDealerProductController);

/**
 * @swagger
 * /api/dealer/products/{id}/stock:
 *   patch:
 *     summary: Update product stock quantity
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
 *             required: [stock]
 *             properties:
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/stock', updateProductStockController);

/**
 * @swagger
 * /api/dealer/products/{id}/status:
 *   patch:
 *     summary: Update product status
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
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/status', updateProductStatusController);

/**
 * @swagger
 * /api/dealer/products/{id}/images:
 *   patch:
 *     summary: Update product images
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
 *         description: Images updated successfully
 *       400:
 *         description: At least one image is required
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.patch('/:id/images', updateProductImagesController);

/**
 * @swagger
 * /api/dealer/products/{id}:
 *   delete:
 *     summary: Delete product
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Dealer access required
 */
router.delete('/:id', deleteDealerProductController);

export default router;


