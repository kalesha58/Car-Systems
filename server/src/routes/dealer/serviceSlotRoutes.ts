import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { dealerMiddleware } from '../../middleware/dealerMiddleware';
import {
  createDealerServiceSlotController,
  listDealerServiceSlotsController,
  updateDealerServiceSlotController,
  deleteDealerServiceSlotController,
} from '../../controllers/dealer/serviceSlotController';

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(dealerMiddleware);

router.get('/', listDealerServiceSlotsController);
router.post('/', createDealerServiceSlotController);
router.patch('/:slotId', updateDealerServiceSlotController);
router.delete('/:slotId', deleteDealerServiceSlotController);

export default router;
