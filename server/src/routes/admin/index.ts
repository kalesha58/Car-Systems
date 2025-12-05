import { Router } from 'express';
import dashboardRoutes from './dashboardRoutes';
import userRoutes from './userRoutes';
import dealerRoutes from './dealerRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import orderRoutes from './orderRoutes';
import reportRoutes from './reportRoutes';
import settingsRoutes from './settingsRoutes';
import serviceRoutes from './serviceRoutes';

const router = Router();

// All admin routes are prefixed with /admin
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/dealers', dealerRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/services', serviceRoutes);

export default router;

