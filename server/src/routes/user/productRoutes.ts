import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { getAllProductsController, getProductByIdController, getProductsDiagnosticController } from '../../controllers/user/productController';
import { logger } from '../../utils/logger';

const router = Router();

// Log route registration
logger.info('[productRoutes] Registering user product routes: GET /, GET /diagnostic, GET /:id');

/**
 * @swagger
 * /api/user/products:
 *   get:
 *     summary: Get all active products for marketplace
 *     tags: [User]
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
 *         name: search
 *         schema:
 *           type: string
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
 */
router.get('/', authMiddleware, getAllProductsController);

/**
 * @swagger
 * /api/user/products/diagnostic:
 *   get:
 *     summary: Diagnostic endpoint to check products and dealers (for debugging)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Diagnostic information
 */
router.get('/diagnostic', authMiddleware, getProductsDiagnosticController);

/**
 * @swagger
 * /api/user/products/{id}:
 *   get:
 *     summary: Get product by ID with dealer information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, getProductByIdController);

export default router;

