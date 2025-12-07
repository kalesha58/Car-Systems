import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getSalesReportController,
  getUsersReportController,
  getProductsReportController,
  exportReportController, 
  getRevenueByCategoryController
} from '../../controllers/admin/reportController';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /admin/reports/sales:
 *   get:
 *     summary: Get sales report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *     responses:
 *       200:
 *         description: Sales report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/sales', getSalesReportController);

/**
 * @swagger
 * /admin/reports/users:
 *   get:
 *     summary: Get users report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users', getUsersReportController);

/**
 * @swagger
 * /admin/reports/products:
 *   get:
 *     summary: Get products report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/products', getProductsReportController);

/**
 * @swagger
 * /admin/reports/revenue-by-category:
 *   get:
 *     summary: Get revenue by category report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (optional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (optional)
 *     responses:
 *       200:
 *         description: Revenue by category report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   totalRevenue:
 *                     type: number
 *                   orderCount:
 *                     type: number
 *                   averageOrderValue:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/revenue-by-category', getRevenueByCategoryController);

/**
 * @swagger
 * /admin/reports/export:
 *   get:
 *     summary: Export report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sales, users, products]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel, pdf]
 *     responses:
 *       200:
 *         description: Report exported successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/export', exportReportController);

export default router;

