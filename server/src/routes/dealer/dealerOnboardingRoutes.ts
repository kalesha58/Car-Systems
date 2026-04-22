import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { getDealerMeOnboardingController } from '../../controllers/dealer/dealerOnboardingController';

const router = Router();

router.use(authMiddleware);
router.get('/me/onboarding', getDealerMeOnboardingController);

export default router;
