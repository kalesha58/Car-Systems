import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getBatteryTypesController,
  getBatteryTypeByIdController,
  createBatteryTypeController,
  updateBatteryTypeController,
  deleteBatteryTypeController,
} from '../../controllers/admin/batteryTypeController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', getBatteryTypesController);
router.get('/:id', getBatteryTypeByIdController);
router.post('/', createBatteryTypeController);
router.put('/:id', updateBatteryTypeController);
router.delete('/:id', deleteBatteryTypeController);

export default router;
