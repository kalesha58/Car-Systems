import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { getAllProductsController, getProductByIdController, getProductsDiagnosticController } from '../../controllers/user/productController';
import {
  deleteProductReviewController,
  getMyProductReviewController,
  getProductReviewSummaryController,
  getProductReviewsController,
  upsertProductReviewController,
} from '../../controllers/user/reviewController';
import { logger } from '../../utils/logger';

const router = Router();

// Log route registration
logger.info('[productRoutes] Registering user product routes: GET /, GET /diagnostic, GET /:id, reviews');

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

/**
 * @swagger
 * /api/user/products/{id}/reviews:
 *   get:
 *     summary: List reviews for a product with rating summary
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id/reviews', authMiddleware, getProductReviewsController);

/**
 * @swagger
 * /api/user/products/{id}/reviews/summary:
 *   get:
 *     summary: Get aggregate rating and star distribution for a product
 *     tags: [User]
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
 *         description: Summary retrieved successfully
 */
router.get('/:id/reviews/summary', authMiddleware, getProductReviewSummaryController);

/**
 * @swagger
 * /api/user/products/{id}/reviews/me:
 *   get:
 *     summary: Get the authenticated user's review for a product
 *     tags: [User]
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
 *         description: Review retrieved (null when the user has not reviewed)
 */
router.get('/:id/reviews/me', authMiddleware, getMyProductReviewController);

/**
 * @swagger
 * /api/user/products/{id}/reviews:
 *   post:
 *     summary: Create or update the authenticated user's review for a product
 *     tags: [User]
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
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review saved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 */
router.post('/:id/reviews', authMiddleware, upsertProductReviewController);

/**
 * @swagger
 * /api/user/products/{id}/reviews:
 *   delete:
 *     summary: Delete the authenticated user's review for a product
 *     tags: [User]
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
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete('/:id/reviews', authMiddleware, deleteProductReviewController);

export default router;

