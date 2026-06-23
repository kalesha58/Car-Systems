import { Router } from 'express';
import dashboardRoutes from './dashboardRoutes';
import userRoutes from './userRoutes';
import dealerRoutes from './dealerRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import batteryTypeRoutes from './batteryTypeRoutes';
import productBrandRoutes from './productBrandRoutes';
import vehicleBrandRoutes from './vehicleBrandRoutes';
import vehicleModelRoutes from './vehicleModelRoutes';
import orderRoutes from './orderRoutes';
import reportRoutes from './reportRoutes';
import settingsRoutes from './settingsRoutes';
import serviceRoutes from './serviceRoutes';
import addressRoutes from './addressRoutes';
import payoutRoutes from './payoutRoutes';
import moderationRoutes from './moderationRoutes';
import couponRoutes from './couponRoutes';
import serviceBookingRoutes from './serviceBookingRoutes';
import testDriveRoutes from './testDriveRoutes';
import tyreServiceRoutes from './tyreServiceRoutes';
import postRoutes from './postRoutes';

const router = Router();

// All admin routes are prefixed with /admin
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/dealers', dealerRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/battery-types', batteryTypeRoutes);
router.use('/product-brands', productBrandRoutes);
router.use('/vehicle-brands', vehicleBrandRoutes);
router.use('/vehicle-models', vehicleModelRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/services', serviceRoutes);
router.use('/addresses', addressRoutes);
router.use('/payouts', payoutRoutes);
router.use('/moderation', moderationRoutes);
router.use('/coupons', couponRoutes);
router.use('/service-bookings', serviceBookingRoutes);
router.use('/test-drives', testDriveRoutes);
router.use('/tyre-services', tyreServiceRoutes);
router.use('/posts', postRoutes);

export default router;


