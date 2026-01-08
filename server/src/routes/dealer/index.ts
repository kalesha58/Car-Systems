import { Router } from 'express';
import businessRegistrationRoutes from './businessRegistrationRoutes';
import orderRoutes from './orderRoutes';
import vehicleRoutes from './vehicleRoutes';
import productRoutes from './productRoutes';
import serviceRoutes from './serviceRoutes';
import payoutRoutes from './payoutRoutes';
import testDriveRoutes from './testDriveRoutes';
import preBookingRoutes from './preBookingRoutes';

const router = Router();

// Mount all dealer route modules
router.use('/business-registration', businessRegistrationRoutes);
router.use('/orders', orderRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/payout', payoutRoutes);
router.use('/test-drives', testDriveRoutes);
router.use('/pre-bookings', preBookingRoutes);

export default router;



