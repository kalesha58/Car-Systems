import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { logger } from '../utils/logger';

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID || 'TEST109761124f62c72e0f411c1e48ea21167901';
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || 'cfsk_ma_test_0bd0e3a8504dd70ba74a480eb3c534f7_46ada574';
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';

if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
  logger.warn(
    'Cashfree credentials not configured. Payment features will not work. Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET environment variables.',
  );
}

export const cashfreeClient = CASHFREE_CLIENT_ID && CASHFREE_CLIENT_SECRET
  ? new Cashfree(
      CASHFREE_ENV === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      CASHFREE_CLIENT_ID,
      CASHFREE_CLIENT_SECRET,
    )
  : null;

export const CASHFREE_WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET || '';

export const isCashfreeEnabled = () => {
  return cashfreeClient !== null;
};

export const getCashfreeEnv = () => CASHFREE_ENV;
