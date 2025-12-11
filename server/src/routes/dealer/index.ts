import { Router } from 'express';
import businessRegistrationRoutes from './businessRegistrationRoutes';
import orderRoutes from './orderRoutes';
import vehicleRoutes from './vehicleRoutes';
import productRoutes from './productRoutes';
import serviceRoutes from './serviceRoutes';
import payoutRoutes from './payoutRoutes';

const router = Router();

// Mount all dealer route modules
router.use('/business-registration', businessRegistrationRoutes);
router.use('/orders', orderRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/payout', payoutRoutes);

export default router;



