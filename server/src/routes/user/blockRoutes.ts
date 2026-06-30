import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  blockUserController,
  checkBlockController,
  listBlockedUsersController,
  unblockUserController,
} from '../../controllers/user/blockController';

const router = Router();

router.use(authMiddleware);
router.get('/check/:targetUserId', checkBlockController);
router.get('/', listBlockedUsersController);
router.post('/:targetUserId', blockUserController);
router.delete('/:targetUserId', unblockUserController);

export default router;
