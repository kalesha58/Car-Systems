import { Router } from 'express';
import {
  confirmUpiVerificationController,
  initiateUpiVerificationController,
} from '../../controllers/dealer/upiVerificationController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';

const router = Router();

router.post('/initiate', authMiddleware, dealerMiddleware, initiateUpiVerificationController);
router.post('/confirm', authMiddleware, dealerMiddleware, confirmUpiVerificationController);

export default router;
