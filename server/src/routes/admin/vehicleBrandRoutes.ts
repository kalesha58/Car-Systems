import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getVehicleBrandsController,
  getVehicleBrandByIdController,
  createVehicleBrandController,
  updateVehicleBrandController,
  deleteVehicleBrandController,
  getVehicleModelsByBrandController,
  createVehicleModelController,
} from '../../controllers/admin/vehicleBrandController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', getVehicleBrandsController);
router.post('/', createVehicleBrandController);
router.get('/:brandId/models', getVehicleModelsByBrandController);
router.post('/:brandId/models', createVehicleModelController);
router.get('/:id', getVehicleBrandByIdController);
router.put('/:id', updateVehicleBrandController);
router.delete('/:id', deleteVehicleBrandController);

export default router;
