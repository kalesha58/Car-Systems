import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getAdminTestDrivesController,
  getAdminTestDriveByIdController,
  updateAdminTestDriveStatusController,
  updateAdminTestDriveController,
  deleteAdminTestDriveController,
} from '../../controllers/admin/testDriveController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', getAdminTestDrivesController);
router.get('/:id', getAdminTestDriveByIdController);
router.patch('/:id/status', updateAdminTestDriveStatusController);
router.put('/:id', updateAdminTestDriveController);
router.delete('/:id', deleteAdminTestDriveController);

export default router;
