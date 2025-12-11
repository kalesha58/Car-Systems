# Payment Integration Documentation

> **For comprehensive setup and operational guide, see [PAYMENT_SYSTEM_GUIDE.md](./PAYMENT_SYSTEM_GUIDE.md)**  
> **For quick setup checklist, see [PAYMENT_SETUP_CHECKLIST.md](./PAYMENT_SETUP_CHECKLIST.md)**

## Overview

This document describes the payment integration system supporting Cash on Delivery (COD) with ₹5 extra charge and UPI payments via Razorpay, including dealer payout management, webhook handling, and comprehensive error handling.

## Architecture

### Payment Flow Diagrams

#### COD Flow
```
User → Select COD → Place Order → Order Created (PENDING_COD) → Order Confirmed
```

#### UPI Flow
```
User → Select UPI → Place Order → Payment Intent Created → UPI App Opens
→ User Completes Payment → Webhook Received → Order Marked PAID → Payout Initiated
```

### Components

1. **Frontend (React Native)**
   - Payment method selection UI
   - UPI payment flow handling
   - Payment status polling
   - Error handling and retry logic

2. **Backend (Node.js/Express)**
   - Order creation with payment processing
   - Razorpay gateway integration
   - Webhook processing
   - Payout management
   - Idempotency handling

3. **Database (MongoDB)**
   - Orders with payment status
   - Payment records
   - Webhook events
   - Idempotency keys
   - Dealer payout credentials

## Database Schema Changes

### Dealer Model
Added `payout` field:
```typescript
payout?: {
  type: 'UPI' | 'BANK';
  upiId?: string;
  bank?: {
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}
```

### Payment Model
New model for tracking payments:
- `orderId`: Reference to order
- `gatewayTxnId`: Razorpay transaction ID
- `gatewayPaymentIntentId`: Payment intent ID
- `amount`: Amount in paise
- `status`: Payment status
- `payoutId`: Payout reference
- `payoutStatus`: Payout status

### WebhookEvent Model
Stores webhook events for idempotency:
- `gatewayEventId`: Unique event ID
- `payload`: Webhook payload
- `signature`: Webhook signature
- `verified`: Signature verification status
- `processed`: Processing status

### IdempotencyKey Model
Prevents duplicate order creation:
- `key`: Idempotency key
- `userId`: User ID
- `requestHash`: Hash of request body
- `responsePayload`: Cached response
- `expiresAt`: Expiration timestamp

### Order Model Updates
- Added `codCharge`: COD charge amount
- Added `paymentIntentId`: UPI payment intent ID
- Added `expiresAt`: Payment expiration time
- New statuses: `PENDING_COD`, `PENDING_PAYMENT`, `PAYMENT_FAILED`, `COD_NOT_COLLECTED`

## API Endpoints

### Order Creation
**POST** `/api/user/orders`

**Headers:**
- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` (optional but recommended)

**Request Body:**
```json
{
  "items": [
    {
      "productId": "string",
      "name": "string",
      "quantity": 1,
      "price": 100,
      "total": 100
    }
  ],
  "shippingAddress": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "paymentMethod": "upi" | "cash_on_delivery",
  "dealerId": "string"
}
```

**Response (COD):**
```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "orderNumber": "ORD-123",
    "status": "PENDING_COD",
    "paymentStatus": "pending",
    "totalAmount": 105,
    "codCharge": 5
  }
}
```

**Response (UPI):**
```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "orderNumber": "ORD-123",
    "status": "PENDING_PAYMENT",
    "paymentStatus": "pending",
    "totalAmount": 100,
    "paymentAction": {
      "type": "UPI_INTENT",
      "paymentIntentId": "razorpay_order_id",
      "amount": 10000,
      "currency": "INR"
    }
  }
}
```

### Order Status Polling
**GET** `/api/user/orders/:orderId/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "string",
    "status": "PAYMENT_CONFIRMED",
    "paymentStatus": "paid",
    "paymentMethod": "upi",
    "paymentDetails": {
      "paymentIntentId": "string"
    }
  }
}
```

### Dealer Payout Registration
**PATCH** `/api/dealer/payout`

**Request Body:**
```json
{
  "type": "UPI",
  "upiId": "dealer@upi"
}
```

or

```json
{
  "type": "BANK",
  "bank": {
    "accountNumber": "1234567890",
    "ifsc": "HDFC0001234",
    "accountName": "Dealer Name"
  }
}
```

### Webhook Endpoint
**POST** `/api/webhooks/razorpay`

**Headers:**
- `x-razorpay-signature: <signature>`

**Note:** This endpoint is called by Razorpay and does not require authentication.

### Admin Payout Management
**GET** `/api/admin/payouts` - List all payouts
**GET** `/api/admin/payouts/stats` - Payout statistics
**POST** `/api/admin/payouts/:orderId/retry` - Retry failed payout

## Environment Variables

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_ENV=sandbox|production

# Payment Settings
COD_CHARGE=5
PAYMENT_TIMEOUT_MINUTES=15
IDEMPOTENCY_KEY_EXPIRY_HOURS=24
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install razorpay
```

### 2. Configure Razorpay

1. Create a Razorpay account at https://razorpay.com
2. Get API keys from Razorpay Dashboard
3. Set up webhook URL: `https://your-domain.com/api/webhooks/razorpay`
4. Configure webhook events: `payment.captured`, `payment.failed`, `payout.processed`, `payout.failed`
5. Copy webhook secret from Razorpay Dashboard

### 3. Environment Configuration

Add the following to your `.env` file:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
RAZORPAY_ENV=sandbox
COD_CHARGE=5
PAYMENT_TIMEOUT_MINUTES=15
IDEMPOTENCY_KEY_EXPIRY_HOURS=24
```

### 4. Database Migration

The new models will be created automatically on first run. Ensure MongoDB is running.

## Webhook Setup

### Razorpay Webhook Configuration

1. Log in to Razorpay Dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `payout.processed`
   - `payout.failed`
5. Copy the webhook secret

### Webhook Signature Verification

The webhook endpoint automatically verifies signatures using the `RAZORPAY_WEBHOOK_SECRET`. Invalid signatures are rejected.

### Webhook Payload Example

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxx",
        "amount": 10000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_xxxxx",
        "notes": {
          "orderId": "mongodb_order_id"
        }
      }
    }
  }
}
```

## Admin Procedures

### Manual Payout

If automatic payout fails:

1. Go to Admin Dashboard → Payouts
2. Find the failed payout
3. Click "Retry Payout"
4. If retry fails, process manually via Razorpay Dashboard

### Refund Processing

1. Go to Admin Dashboard → Orders
2. Select order to refund
3. Click "Refund"
4. Enter refund amount and reason
5. System processes refund via Razorpay

### Reconciliation

1. Export payments from Razorpay Dashboard
2. Compare with database records
3. Investigate discrepancies
4. Update records manually if needed

## Testing

### Sandbox Testing

1. Use Razorpay test keys
2. Test UPI payments using test UPI IDs
3. Verify webhook processing
4. Test payout flows

### Test Scenarios

1. **Happy Path UPI**: User selects UPI → Payment succeeds → Order confirmed → Payout initiated
2. **UPI Payment Failure**: User selects UPI → Payment fails → Order marked failed → Stock restored
3. **COD Order**: User selects COD → Order created with ₹5 charge → Order confirmed
4. **Payment Timeout**: UPI payment expires → Order marked failed → Stock restored
5. **Duplicate Order**: Same idempotency key → Returns cached response
6. **Multi-Dealer Cart**: Items from different dealers → Separate orders created

## Security & Compliance

### Data Protection
- Bank details encrypted at rest
- UPI IDs stored in plain text (required for payouts)
- Payment records stored for audit

### PCI Compliance
- No card data stored (UPI only)
- All sensitive data encrypted
- Secure webhook signature verification

### Audit Logging
- All payment events logged
- Webhook payloads stored
- Payout attempts tracked
- Error logs maintained

## Monitoring & Alerts

### Key Metrics
- Orders created per day
- Payment success rate
- Payout success rate
- Webhook processing time
- Payment failure rate

### Alerts
- Webhook signature failures
- Repeated payout failures
- Spike in payment failures
- Payment timeout rate

## Troubleshooting

### Payment Intent Creation Fails
- Check Razorpay API keys
- Verify network connectivity
- Check Razorpay account status

### Webhook Not Received
- Verify webhook URL is accessible
- Check Razorpay webhook configuration
- Review webhook logs in Razorpay Dashboard

### Payout Fails
- Verify dealer payout credentials
- Check RazorpayX account status
- Review payout limits
- Check account balance

### Payment Timeout
- Verify payment timeout setting
- Check if user completed payment
- Review payment status in Razorpay Dashboard

## Rollback Procedures

### Disable UPI Payments
1. Set `RAZORPAY_ENV=disabled` in environment
2. Restart server
3. UPI option will be disabled in frontend

### Emergency Refund
1. Access Razorpay Dashboard
2. Find payment
3. Process refund manually
4. Update order status in database

## Support

For issues or questions:
1. Check logs in `server/logs/`
2. Review Razorpay Dashboard for payment status
3. Contact Razorpay support for gateway issues
4. Review this documentation

## Related Documentation

- **[PAYMENT_SYSTEM_GUIDE.md](./PAYMENT_SYSTEM_GUIDE.md)** - Complete implementation guide with step-by-step setup, troubleshooting, and operational procedures
- **[PAYMENT_SETUP_CHECKLIST.md](./PAYMENT_SETUP_CHECKLIST.md)** - Quick setup checklist for deployment
- **[PAYMENT_QUICK_START.md](./PAYMENT_QUICK_START.md)** - 5-minute quick start guide

## Changelog

### Version 1.0.0
- Initial payment integration
- COD support with ₹5 charge
- UPI payment via Razorpay
- Dealer payout management
- Webhook processing
- Idempotency handling
- Stock validation
- Payment timeout handling

