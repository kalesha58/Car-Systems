import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  appendStoryFromPostController,
  deleteStoryController,
  getStoryByUserController,
  getStoryFeedController,
  getStoryViewersController,
  recordStoryViewController,
} from '../../controllers/user/storyController';

const router = Router();

router.get('/feed', authMiddleware, getStoryFeedController);
router.get('/user/:userId', authMiddleware, getStoryByUserController);
router.post('/items/from-post/:postId', authMiddleware, appendStoryFromPostController);
router.post('/:storyId/view', authMiddleware, recordStoryViewController);
router.get('/:storyId/viewers', authMiddleware, getStoryViewersController);
router.delete('/:storyId', authMiddleware, deleteStoryController);

export default router;
