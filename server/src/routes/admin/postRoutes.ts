import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getAdminPostsController,
  getAdminPostStatsController,
  getAdminPostByIdController,
  deleteAdminPostController,
  bulkDeleteAdminPostsController,
} from '../../controllers/admin/postController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', getAdminPostStatsController);
router.post('/bulk-delete', bulkDeleteAdminPostsController);
router.get('/', getAdminPostsController);
router.get('/:id', getAdminPostByIdController);
router.delete('/:id', deleteAdminPostController);

export default router;
