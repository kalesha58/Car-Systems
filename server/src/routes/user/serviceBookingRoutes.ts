import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  createUserServiceBookingController,
  getUserServiceBookingsController,
  getUserServiceBookingByIdController,
  cancelUserServiceBookingController,
} from '../../controllers/user/serviceBookingController';

const router = Router();

router.use(authMiddleware);

router.post('/', createUserServiceBookingController);
router.get('/', getUserServiceBookingsController);
router.get('/:id', getUserServiceBookingByIdController);
router.patch('/:id/cancel', cancelUserServiceBookingController);

export default router;
