import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getVehicleModelByIdController,
  updateVehicleModelController,
  deleteVehicleModelController,
} from '../../controllers/admin/vehicleBrandController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/:id', getVehicleModelByIdController);
router.put('/:id', updateVehicleModelController);
router.delete('/:id', deleteVehicleModelController);

export default router;
