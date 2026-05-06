import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import { listModerationReportsController, updateModerationReportController } from '../../controllers/admin/moderationController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);
router.get('/reports', listModerationReportsController);
router.patch('/reports/:id', updateModerationReportController);

export default router;
