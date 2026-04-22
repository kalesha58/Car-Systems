import { Router } from 'express';
import dealerOnboardingRoutes from './dealerOnboardingRoutes';
import businessRegistrationRoutes from './businessRegistrationRoutes';
import orderRoutes from './orderRoutes';
import vehicleRoutes from './vehicleRoutes';
import productRoutes from './productRoutes';
import serviceRoutes from './serviceRoutes';
import payoutRoutes from './payoutRoutes';
import testDriveRoutes from './testDriveRoutes';
import preBookingRoutes from './preBookingRoutes';
import customerEnquiryRoutes from './customerEnquiryRoutes';
import serviceBookingRoutes from './serviceBookingRoutes';

const router = Router();

// Dealer self-service onboarding (no /business-registration prefix)
router.use(dealerOnboardingRoutes);

// Mount all dealer route modules
router.use('/business-registration', businessRegistrationRoutes);
router.use('/orders', orderRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/payout', payoutRoutes);
router.use('/test-drives', testDriveRoutes);
router.use('/pre-bookings', preBookingRoutes);
router.use('/customer-enquiries', customerEnquiryRoutes);
router.use('/service-bookings', serviceBookingRoutes);

export default router;



