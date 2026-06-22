import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  getSlotOfferController,
  acceptSlotOfferController,
  declineSlotOfferController,
} from '../../controllers/user/slotOfferController';

const router = Router();

router.use(authMiddleware);

router.get('/:id', getSlotOfferController);
router.post('/:id/accept', acceptSlotOfferController);
router.post('/:id/decline', declineSlotOfferController);

export default router;
