import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { createContentReportController } from '../../controllers/user/reportController';

const router = Router();

router.use(authMiddleware);
router.post('/', createContentReportController);

export default router;
