import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  getVehicleAlertReasonsController,
  lookupVehicleAlertController,
  createVehicleAlertController,
  listVehicleAlertsController,
  resolveVehicleAlertController,
  getVehicleAlertByIdController,
} from '../../controllers/user/vehicleAlertController';

const router = Router();

router.use(authMiddleware);

router.get('/reasons', getVehicleAlertReasonsController);
router.get('/', listVehicleAlertsController);
router.post('/lookup', lookupVehicleAlertController);
router.post('/', createVehicleAlertController);
router.get('/:id', getVehicleAlertByIdController);
router.patch('/:id/resolve', resolveVehicleAlertController);

export default router;
