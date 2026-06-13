import { Router } from 'express';
import { getAppConfigController, getVisualEffectsController } from '../../controllers/user/appConfigController';

const router = Router();

/**
 * @swagger
 * /api/app/config:
 *   get:
 *     summary: Get unified mobile app configuration
 *     tags: [App Config]
 *     responses:
 *       200:
 *         description: App config retrieved successfully
 */
router.get('/config', getAppConfigController);

/**
 * @swagger
 * /api/app/visual-effects:
 *   get:
 *     summary: Get mobile app visual effects configuration
 *     tags: [App Config]
 *     responses:
 *       200:
 *         description: Visual effects config retrieved successfully
 */
router.get('/visual-effects', getVisualEffectsController);

export default router;
