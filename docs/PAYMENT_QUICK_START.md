# Payment System - Quick Start Guide

This is a condensed guide for developers who need to get the payment system running quickly.

## 5-Minute Setup

### 1. Get Razorpay Keys (2 minutes)

1. Go to https://razorpay.com → Sign Up
2. Complete basic registration
3. Go to Settings → API Keys
4. Copy Key ID and Key Secret (test keys work for development)

### 2. Configure Environment (1 minute)

Add to `server/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
RAZORPAY_ENV=sandbox
COD_CHARGE=5
```

### 3. Install & Start (1 minute)

```bash
cd server
npm install razorpay
npm run dev
```

### 4. Test Connection (1 minute)

Create `server/test-razorpay.js`:
```javascript
require('dotenv').config();
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
razorpay.orders.create({amount: 10000, currency: 'INR'})
  .then(o => console.log('✅ Connected:', o.id))
  .catch(e => console.error('❌ Failed:', e.message));
```

Run: `node test-razorpay.js`

## What You Need

| Item | Where to Get | Required For |
|------|--------------|--------------|
| Razorpay Key ID | Razorpay Dashboard → API Keys | Payment processing |
| Razorpay Key Secret | Razorpay Dashboard → API Keys | Payment processing |
| Webhook Secret | Razorpay Dashboard → Webhooks | Webhook verification |
| HTTPS Domain | Your hosting provider | Webhook callbacks |
| Dealer UPI IDs | From dealers | Payouts |

## Key Files

- **Backend Config**: `server/src/config/razorpay.ts`
- **Payment Service**: `server/src/services/payment/paymentService.ts`
- **Webhook Handler**: `server/src/routes/webhookRoutes.ts`
- **Frontend Cart**: `client/src/features/cart/CartScreen.tsx`
- **Payment Status**: `client/src/features/payment/PaymentStatusScreen.tsx`

## Common Commands

```bash
# Install Razorpay
npm install razorpay

# Test connection
node server/test-razorpay.js

# Check logs
tail -f server/logs/combined.log

# Check webhooks
# MongoDB: db.webhook_events.find().sort({createdAt: -1}).limit(10)
```

## Next Steps

1. ✅ Complete 5-minute setup above
2. 📖 Read [PAYMENT_SYSTEM_GUIDE.md](./PAYMENT_SYSTEM_GUIDE.md) for details
3. ✅ Use [PAYMENT_SETUP_CHECKLIST.md](./PAYMENT_SETUP_CHECKLIST.md) before production
4. 🧪 Test in sandbox environment
5. 🚀 Deploy to production

## Need Help?

- **Setup Issues**: See [PAYMENT_SYSTEM_GUIDE.md - Troubleshooting](./PAYMENT_SYSTEM_GUIDE.md#troubleshooting)
- **API Questions**: See [PAYMENT_SYSTEM_GUIDE.md - API Endpoints](./PAYMENT_SYSTEM_GUIDE.md#api-endpoint-details)
- **Razorpay Issues**: https://razorpay.com/support/




