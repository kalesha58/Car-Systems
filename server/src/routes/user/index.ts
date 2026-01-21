import { Router } from 'express';
import vehicleRoutes from './vehicleRoutes';
import postRoutes from './postRoutes';
import uploadRoutes from './uploadRoutes';
import profileRoutes from './profileRoutes';
import productRoutes from './productRoutes';
import groupRoutes from './groupRoutes';
import chatRoutes from './chatRoutes';
import joinRequestRoutes from './joinRequestRoutes';
import orderRoutes from './orderRoutes';
import addressRoutes from './addressRoutes';
import notificationRoutes from './notificationRoutes';
import cartRoutes from './cartRoutes';
import couponRoutes from './couponRoutes';
import dealerRoutes from './dealerRoutes';
import serviceSlotRoutes from './serviceSlotRoutes';

const router = Router();

// Mount all user route modules (keeping same API paths for backward compatibility)
router.use('/vehicles', vehicleRoutes);
router.use('/posts', postRoutes);
router.use('/upload', uploadRoutes);
router.use('/profile', profileRoutes);
router.use('/products', productRoutes);
router.use('/groups', groupRoutes);
router.use('/chats', chatRoutes);
router.use('/join-requests', joinRequestRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
router.use('/cart', cartRoutes);
router.use('/coupons', couponRoutes);
router.use('/dealer', dealerRoutes);
router.use('/', notificationRoutes);
router.use('/services', serviceSlotRoutes);

export default router;

