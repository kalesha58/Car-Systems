import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { adminMiddleware } from '../../middleware/adminMiddleware';
import {
  getProductBrandsController,
  getProductBrandByIdController,
  createProductBrandController,
  updateProductBrandController,
  deleteProductBrandController,
} from '../../controllers/admin/productBrandController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', getProductBrandsController);
router.get('/:id', getProductBrandByIdController);
router.post('/', createProductBrandController);
router.put('/:id', updateProductBrandController);
router.delete('/:id', deleteProductBrandController);

export default router;
