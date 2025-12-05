import { Router } from 'express';
import {
  createPostController,
  getPostsController,
  getPostByIdController,
  updatePostController,
  deletePostController,
} from '../../controllers/user/postController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateCreatePost } from '../../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Post created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, validateCreatePost, createPostController);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts (optionally filtered by userId)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getPostsController);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, getPostByIdController);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update post
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authMiddleware, updatePostController);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete post
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authMiddleware, deletePostController);

export default router;

