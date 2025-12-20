import { Router } from 'express';
import {
  createPostController,
  getPostsController,
  getPostByIdController,
  updatePostController,
  deletePostController,
  likePostController,
  unlikePostController,
  addCommentController,
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

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like a post
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/like', authMiddleware, likePostController);

/**
 * @swagger
 * /api/posts/{id}/unlike:
 *   post:
 *     summary: Unlike a post
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/unlike', authMiddleware, unlikePostController);

/**
 * @swagger
 * /api/posts/{id}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/comment', authMiddleware, addCommentController);

export default router;

