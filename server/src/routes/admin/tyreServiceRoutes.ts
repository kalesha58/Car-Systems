import { Router } from 'express';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getAdminTyreServiceRequestsController,
  getAdminTyreServiceRequestByIdController,
  updateAdminTyreServiceRequestStatusController,
} from '../../controllers/admin/tyreServiceRequestController';

const router = Router();

router.use(adminMiddleware);

router.get('/', getAdminTyreServiceRequestsController);
router.get('/:id', getAdminTyreServiceRequestByIdController);
router.patch('/:id/status', updateAdminTyreServiceRequestStatusController);

export default router;
