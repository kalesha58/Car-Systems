import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getAdminTyreServiceRequestsController,
  getAdminTyreServiceRequestByIdController,
  updateAdminTyreServiceRequestStatusController,
} from '../../controllers/admin/tyreServiceRequestController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', getAdminTyreServiceRequestsController);
router.get('/:id', getAdminTyreServiceRequestByIdController);
router.patch('/:id/status', updateAdminTyreServiceRequestStatusController);

export default router;
