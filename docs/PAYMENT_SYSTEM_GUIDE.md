# Payment System - Complete Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites & Requirements](#prerequisites--requirements)
3. [What You Need to Gather](#what-you-need-to-gather)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Configuration Details](#configuration-details)
6. [How It Works](#how-it-works)
7. [Testing Guide](#testing-guide)
8. [Operational Procedures](#operational-procedures)
9. [Troubleshooting](#troubleshooting)
10. [FAQs](#faqs)

---

## System Overview

### What This System Does

The payment integration enables your Car Systems application to:
- Accept **Cash on Delivery (COD)** payments with a ₹5 convenience charge
- Accept **UPI payments** (PhonePe, GPay, Paytm, etc.) via Razorpay
- Automatically route payments to dealer accounts
- Handle payment failures, timeouts, and retries
- Provide admin tools for payout management and refunds

### Payment Flow Summary

```
┌─────────────┐
│   User      │
│  (Buyer)    │
└──────┬──────┘
       │
       │ 1. Selects Payment Method (COD/UPI)
       │
       ▼
┌─────────────────────┐
│   Cart Screen        │
│  - Shows COD charge  │
│  - Shows dealer info │
│  - Validates payment │
└──────┬──────────────┘
       │
       │ 2. Places Order
       │
       ▼
┌─────────────────────┐
│   Backend API       │
│  - Creates order     │
│  - Validates stock   │
│  - Processes payment │
└──────┬──────────────┘
       │
       ├─── COD Path ───────────────────┐
       │                                 │
       │ 3a. Order: PENDING_COD          │
       │     Total: Original + ₹5        │
       │                                 │
       │ 4a. Order Confirmed             │
       │                                 │
       └─────────────────────────────────┘
       │
       └─── UPI Path ───────────────────┐
                                         │
           3b. Payment Intent Created    │
               Order: PENDING_PAYMENT   │
                                         │
           4b. User Opens UPI App        │
                                         │
           5b. User Completes Payment    │
                                         │
           6b. Razorpay Webhook          │
               Order: PAYMENT_CONFIRMED  │
                                         │
           7b. Payout to Dealer          │
                                         │
           └─────────────────────────────┘
```

---

## Prerequisites & Requirements

### Technical Requirements

1. **Server Environment**
   - Node.js >= 20
   - MongoDB database
   - HTTPS-enabled domain (for webhooks)
   - Environment variables configuration

2. **Razorpay Account**
   - Business account with KYC verification
   - API keys (Key ID and Key Secret)
   - Webhook secret
   - RazorpayX account (for payouts) - Optional but recommended

3. **Dealer Requirements**
   - Valid business registration
   - UPI ID or Bank account details
   - Completed payout credential registration

4. **Frontend Requirements**
   - React Native app with navigation configured
   - PaymentStatusScreen route registered

---

## What You Need to Gather

### 1. Razorpay Account Setup

#### Step 1: Create Razorpay Account
1. Go to https://razorpay.com
2. Click "Sign Up" → "Business Account"
3. Complete registration with:
   - Business name
   - Business type
   - Contact details
   - Business address

#### Step 2: Complete KYC Verification
1. Navigate to **Settings → Account & Settings → KYC**
2. Upload required documents:
   - Business PAN card
   - Business registration certificate
   - Bank account statement
   - Address proof
3. Wait for verification (usually 1-3 business days)

#### Step 3: Get API Keys
1. Go to **Settings → API Keys**
2. Click **"Generate Key"** or use existing test keys
3. Copy:
   - **Key ID** (starts with `rzp_test_` for sandbox or `rzp_live_` for production)
   - **Key Secret** (shown only once - save it securely)

#### Step 4: Set Up Webhook
1. Go to **Settings → Webhooks**
2. Click **"Add New Webhook"**
3. Enter webhook URL: `https://your-domain.com/api/webhooks/razorpay`
4. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `payout.processed` (if using RazorpayX)
   - ✅ `payout.failed` (if using RazorpayX)
5. Click **"Create Webhook"**
6. Copy the **Webhook Secret** (shown only once)

#### Step 5: Set Up RazorpayX (For Payouts)
1. Go to **RazorpayX Dashboard**
2. Complete business verification
3. Add bank account or UPI for receiving payouts
4. Note: If RazorpayX is not available, payouts can be processed manually

### 2. Environment Configuration

Gather the following information:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature secret | Razorpay Dashboard → Settings → Webhooks |
| `RAZORPAY_ENV` | Environment: `sandbox` or `production` | Your choice (start with `sandbox`) |
| `COD_CHARGE` | COD convenience charge (default: 5) | Business decision |
| `PAYMENT_TIMEOUT_MINUTES` | UPI payment timeout (default: 15) | Business decision |
| `IDEMPOTENCY_KEY_EXPIRY_HOURS` | Idempotency key expiry (default: 24) | Technical decision |

### 3. Server Configuration

#### Domain & SSL Certificate
- **HTTPS Domain**: Required for webhook callbacks
  - Example: `https://api.yourdomain.com`
  - Must have valid SSL certificate
  - Can use services like:
    - AWS/Google Cloud/Azure with load balancer
    - ngrok for development (temporary)
    - Cloudflare for SSL

#### Database Access
- MongoDB connection string
- Database name
- User credentials (if authentication enabled)

### 4. Dealer Information Collection

For each dealer, collect:

#### Option A: UPI Payment
- **UPI ID**: Format `username@paymentprovider`
  - Examples: `dealer@paytm`, `business@ybl`, `shop@phonepe`
  - Validation: Must match pattern `/^[\w.-]+@[\w]+$/`

#### Option B: Bank Transfer
- **Account Number**: 9-18 digits
- **IFSC Code**: Format `XXXX0XXXXX` (4 letters, 0, 6 alphanumeric)
  - Example: `HDFC0001234`, `SBIN0005678`
- **Account Holder Name**: As per bank records

---

## Step-by-Step Setup

### Phase 1: Backend Setup

#### Step 1: Install Dependencies

```bash
cd server
npm install razorpay
```

Verify installation:
```bash
npm list razorpay
```

#### Step 2: Configure Environment Variables

Create or update `.env` file in `server/` directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_ENV=sandbox

# Payment Settings
COD_CHARGE=5
PAYMENT_TIMEOUT_MINUTES=15
IDEMPOTENCY_KEY_EXPIRY_HOURS=24

# Database (if not already configured)
MONGODB_URI=mongodb://localhost:27017/car-systems

# Server (if not already configured)
PORT=3000
JWT_SECRET=your-jwt-secret
```

**Important Notes:**
- For **sandbox/testing**: Use test keys (start with `rzp_test_`)
- For **production**: Use live keys (start with `rzp_live_`)
- Never commit `.env` file to version control
- Use environment variable management in production (AWS Secrets Manager, etc.)

#### Step 3: Verify Database Models

The following models should be automatically created on first run:
- `Payment` - Payment records
- `WebhookEvent` - Webhook event log
- `IdempotencyKey` - Idempotency tracking

Verify models are loaded:
```bash
# Check if models compile
cd server
npm run build
```

#### Step 4: Test Razorpay Connection

Create a test script `server/test-razorpay.js`:

```javascript
require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Test connection
razorpay.orders.create({
  amount: 10000, // ₹100 in paise
  currency: 'INR',
  receipt: 'test_receipt_001',
}).then(order => {
  console.log('✅ Razorpay connection successful!');
  console.log('Order ID:', order.id);
}).catch(error => {
  console.error('❌ Razorpay connection failed:', error.message);
});
```

Run test:
```bash
node test-razorpay.js
```

#### Step 5: Start Server

```bash
cd server
npm run dev
```

Verify server starts without errors and check logs for:
- ✅ Database connected
- ✅ Razorpay configured (or warning if not configured)
- ✅ Routes mounted successfully

### Phase 2: Webhook Setup

#### Step 1: Expose Your Server (Development)

For local development, use ngrok:

```bash
# Install ngrok
# Download from https://ngrok.com/download

# Start your server
cd server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

#### Step 2: Configure Webhook in Razorpay

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-ngrok-url.ngrok.io/api/webhooks/razorpay`
3. Select events:
   - `payment.captured`
   - `payment.failed`
4. Save and copy the webhook secret

#### Step 3: Test Webhook

Use Razorpay's webhook testing tool:
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Click on your webhook
3. Click "Send Test Webhook"
4. Check your server logs for webhook receipt

#### Step 4: Production Webhook Setup

1. Deploy your server with HTTPS
2. Update webhook URL in Razorpay Dashboard
3. Verify webhook secret matches your `.env` file
4. Test with a real payment

### Phase 3: Frontend Setup

#### Step 1: Verify Navigation

Ensure `PaymentStatusScreen` is registered in your navigation:

```typescript
// In your navigation file (e.g., AppNavigator.tsx)
import PaymentStatusScreen from '@features/payment/PaymentStatusScreen';

// Add to your stack navigator
<Stack.Screen 
  name="PaymentStatus" 
  component={PaymentStatusScreen} 
/>
```

#### Step 2: Test Payment Flow

1. Add items to cart
2. Navigate to cart screen
3. Verify payment method selector appears
4. Test COD selection (should show ₹5 charge)
5. Test UPI selection (should show dealer info)

### Phase 4: Dealer Onboarding

#### Step 1: Register Dealer Payout Credentials

**Via API:**
```bash
PATCH /api/dealer/payout
Authorization: Bearer <dealer_token>

{
  "type": "UPI",
  "upiId": "dealer@paytm"
}
```

**Via Admin Panel (if available):**
1. Go to Admin Dashboard
2. Select dealer
3. Update payout credentials
4. Verify credentials are saved

#### Step 2: Verify Dealer Can Receive Payments

1. Create a test order with UPI payment
2. Complete payment
3. Check if payout is initiated
4. Verify in RazorpayX dashboard (if using)

---

## Configuration Details

### Environment Variables Explained

#### Razorpay Configuration

```env
# Razorpay API Key ID
# Format: rzp_test_xxxxx (sandbox) or rzp_live_xxxxx (production)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Razorpay API Secret Key
# Keep this secure - never expose in frontend or logs
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Webhook Secret for signature verification
# Get from Razorpay Dashboard → Settings → Webhooks
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx

# Environment: 'sandbox' for testing, 'production' for live
RAZORPAY_ENV=sandbox
```

#### Payment Settings

```env
# COD convenience charge in rupees
# Default: 5 (means ₹5)
COD_CHARGE=5

# UPI payment timeout in minutes
# If payment not completed within this time, order marked as failed
# Default: 15 minutes
PAYMENT_TIMEOUT_MINUTES=15

# Idempotency key expiration in hours
# Prevents duplicate orders from same request
# Default: 24 hours
IDEMPOTENCY_KEY_EXPIRY_HOURS=24
```

### Database Schema Details

#### Payment Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Reference to order |
| `gatewayTxnId` | String | Razorpay payment ID |
| `gatewayPaymentIntentId` | String | Razorpay order ID |
| `amount` | Number | Amount in paise (e.g., 10000 = ₹100) |
| `currency` | String | Currency code (INR) |
| `status` | String | pending, processing, completed, failed, refunded |
| `payoutId` | String | Razorpay payout ID |
| `payoutStatus` | String | pending, processing, completed, failed |
| `rawPayload` | Object | Full Razorpay response for audit |

#### WebhookEvent Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `gatewayEventId` | String | Unique event ID from Razorpay |
| `payload` | Object | Complete webhook payload |
| `signature` | String | Webhook signature |
| `verified` | Boolean | Signature verification status |
| `processed` | Boolean | Whether event was processed |
| `error` | String | Error message if processing failed |

### API Endpoint Details

#### Order Creation Endpoint

**URL:** `POST /api/user/orders`

**Headers:**
```
Authorization: Bearer <user_jwt_token>
Idempotency-Key: <unique_uuid> (optional but recommended)
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id_123",
      "name": "Car Shiner",
      "quantity": 1,
      "price": 650,
      "total": 650
    }
  ],
  "shippingAddress": {
    "street": "37/134, Anjaiah",
    "city": "Hyderabad",
    "state": "Telangana",
    "zipCode": "500084",
    "country": "India"
  },
  "paymentMethod": "upi",
  "dealerId": "dealer_id_123"
}
```

**Response (COD):**
```json
{
  "success": true,
  "data": {
    "id": "order_mongodb_id",
    "orderNumber": "ORD-1234567890-ABC123",
    "status": "PENDING_COD",
    "paymentStatus": "pending",
    "totalAmount": 686,
    "codCharge": 5,
    "subtotal": 650,
    "tax": 5,
    "shipping": 31
  }
}
```

**Response (UPI):**
```json
{
  "success": true,
  "data": {
    "id": "order_mongodb_id",
    "orderNumber": "ORD-1234567890-ABC123",
    "status": "PENDING_PAYMENT",
    "paymentStatus": "pending",
    "totalAmount": 681,
    "paymentAction": {
      "type": "UPI_INTENT",
      "paymentIntentId": "order_razorpay_123",
      "amount": 68100,
      "currency": "INR"
    }
  }
}
```

---

## How It Works

### COD Payment Flow (Detailed)

```
1. User selects "Cash on Delivery"
   └─> Frontend shows: Final Total + ₹5 COD charge
   
2. User clicks "Place Order"
   └─> Frontend sends POST /api/user/orders
       {
         paymentMethod: "cash_on_delivery",
         items: [...],
         shippingAddress: {...}
       }
   
3. Backend processes:
   ├─> Validates cart items
   ├─> Checks stock availability
   ├─> Calculates: subtotal + tax + shipping + ₹5 COD charge
   ├─> Reserves stock (subtracts from inventory)
   ├─> Creates order with status: PENDING_COD
   └─> Returns order confirmation
   
4. Order Status: PENDING_COD
   └─> Waiting for COD collection
   
5. Dealer/Admin marks COD collected
   └─> Order status → PAYMENT_CONFIRMED
   └─> Order status → ORDER_CONFIRMED
   └─> Proceeds with fulfillment
```

### UPI Payment Flow (Detailed)

```
1. User selects "Pay now (UPI)"
   └─> Frontend validates dealer has payout credentials
   └─> Shows dealer name: "Payment will go to: Dealer Name"
   
2. User clicks "Place Order"
   └─> Frontend sends POST /api/user/orders
       {
         paymentMethod: "upi",
         items: [...],
         shippingAddress: {...}
       }
       Headers: { "Idempotency-Key": "unique-uuid" }
   
3. Backend processes:
   ├─> Validates cart items
   ├─> Checks stock availability
   ├─> Validates dealer has payout credentials (UPI ID or Bank)
   ├─> Calculates total (no COD charge)
   ├─> Reserves stock
   ├─> Creates Razorpay payment intent
   │   └─> Amount: total * 100 (convert to paise)
   │   └─> Currency: INR
   │   └─> Receipt: order_<orderId>
   ├─> Creates order with:
   │   ├─> Status: PENDING_PAYMENT
   │   ├─> paymentIntentId: razorpay_order_id
   │   └─> expiresAt: now + 15 minutes
   └─> Returns order + paymentAction
   
4. Frontend receives paymentAction
   └─> Opens UPI app via deeplink:
       razorpay://pay?amount=68100&currency=INR&order_id=order_xxx
   
5. User completes payment in UPI app
   └─> Payment app sends payment to Razorpay
   
6. Razorpay processes payment
   └─> Sends webhook to: POST /api/webhooks/razorpay
       {
         event: "payment.captured",
         payload: {
           payment: {
             entity: {
               id: "pay_xxxxx",
               amount: 68100,
               order_id: "order_razorpay_123",
               status: "captured"
             }
           }
         }
       }
       Headers: { "x-razorpay-signature": "signature_hash" }
   
7. Backend webhook handler:
   ├─> Verifies webhook signature
   ├─> Checks if webhook already processed (idempotency)
   ├─> Finds order by paymentIntentId
   ├─> Verifies payment amount matches order amount
   ├─> Updates order:
   │   ├─> Status: PAYMENT_CONFIRMED
   │   └─> paymentStatus: paid
   ├─> Creates/updates Payment record
   ├─> Initiates payout to dealer (if dealer exists)
   └─> Returns 200 to Razorpay (quick response)
   
8. Frontend polls order status
   └─> GET /api/user/orders/{orderId}/status
   └─> Every 3-5 seconds (exponential backoff)
   └─> Stops when paymentStatus = "paid"
   
9. Payment confirmed
   └─> Frontend navigates to OrderSuccess screen
   └─> Order proceeds to fulfillment
```

### Payment Failure Flow

```
1. User initiates UPI payment
   └─> Order status: PENDING_PAYMENT
   
2. Payment fails or times out
   ├─> Scenario A: User cancels in UPI app
   │   └─> Razorpay sends: payment.failed webhook
   │   └─> Backend updates: PAYMENT_FAILED
   │   └─> Stock restored
   │
   ├─> Scenario B: Payment timeout (15 minutes)
   │   └─> Background job checks expired payments
   │   └─> Backend updates: PAYMENT_FAILED
   │   └─> Stock restored
   │
   └─> Scenario C: Insufficient funds
       └─> Razorpay sends: payment.failed webhook
       └─> Backend updates: PAYMENT_FAILED
       └─> Stock restored
   
3. User sees payment failed
   └─> Options:
       ├─> Retry payment (creates new payment intent)
       └─> Choose COD instead
```

### Payout Flow

```
1. Payment confirmed (webhook received)
   └─> Order status: PAYMENT_CONFIRMED
   └─> Payment record: status = completed
   
2. Backend initiates payout
   ├─> Gets dealer payout credentials
   ├─> Calculates payout amount (order total - platform fees if any)
   ├─> Creates Razorpay payout:
   │   ├─> If UPI: Uses dealer UPI ID
   │   └─> If Bank: Uses bank account + IFSC
   └─> Updates Payment record:
       ├─> payoutId: razorpay_payout_id
       └─> payoutStatus: processing
   
3. Razorpay processes payout
   └─> Sends webhook: payout.processed or payout.failed
   
4. Backend updates payout status
   └─> Payment record: payoutStatus = completed or failed
   
5. If payout fails
   └─> Admin can retry via: POST /api/admin/payouts/{orderId}/retry
```

---

## Testing Guide

### Sandbox Testing Setup

#### 1. Use Razorpay Test Keys

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_ENV=sandbox
```

#### 2. Test UPI IDs

Razorpay provides test UPI IDs:
- `success@razorpay` - Always succeeds
- `failure@razorpay` - Always fails

#### 3. Test Payment Scenarios

**Test Case 1: Successful UPI Payment**
1. Create order with UPI
2. Use test UPI: `success@razorpay`
3. Verify order status becomes `PAYMENT_CONFIRMED`
4. Check payment record is created
5. Verify payout is initiated

**Test Case 2: Failed UPI Payment**
1. Create order with UPI
2. Use test UPI: `failure@razorpay`
3. Verify order status becomes `PAYMENT_FAILED`
4. Check stock is restored
5. Verify user can retry

**Test Case 3: COD Order**
1. Create order with COD
2. Verify total includes ₹5 COD charge
3. Verify order status is `PENDING_COD`
4. Verify stock is reserved

**Test Case 4: Payment Timeout**
1. Create order with UPI
2. Don't complete payment
3. Wait 15+ minutes
4. Verify order status becomes `PAYMENT_FAILED`
5. Check stock is restored

**Test Case 5: Duplicate Order Prevention**
1. Create order with same `Idempotency-Key`
2. Verify second request returns cached response
3. Verify only one order is created

**Test Case 6: Webhook Idempotency**
1. Send same webhook twice
2. Verify second webhook is ignored
3. Verify order status not updated twice

### Production Testing Checklist

Before going live:

- [ ] All test cases pass in sandbox
- [ ] Webhook URL is accessible from internet
- [ ] Webhook signature verification works
- [ ] Dealer payout credentials are verified
- [ ] SSL certificate is valid
- [ ] Error handling works correctly
- [ ] Stock restoration works on failures
- [ ] Admin payout management works
- [ ] Refund flow works
- [ ] Monitoring and logging are set up

---

## Operational Procedures

### Daily Operations

#### 1. Monitor Payment Status

**Check Payment Metrics:**
```bash
# Query database for payment stats
db.payments.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      totalAmount: { $sum: "$amount" }
    }
  }
])
```

**Key Metrics to Monitor:**
- Total orders created
- Payment success rate
- Payment failure rate
- Average payment time
- Payout success rate

#### 2. Handle Failed Payments

**Automatic Handling:**
- System automatically marks expired payments as failed
- Stock is automatically restored
- Users can retry or choose COD

**Manual Intervention:**
1. Go to Admin Dashboard → Orders
2. Filter by status: `PAYMENT_FAILED`
3. Review failed payments
4. Contact users if needed
5. Process refunds if payment was captured but order cancelled

#### 3. Manage Payouts

**View Payout Status:**
```
GET /api/admin/payouts?status=failed
```

**Retry Failed Payout:**
```
POST /api/admin/payouts/{orderId}/retry
```

**Manual Payout (if automatic fails):**
1. Go to RazorpayX Dashboard
2. Find failed payout
3. Process manually
4. Update payment record in database

### Weekly Operations

#### 1. Reconciliation

**Compare Razorpay Dashboard with Database:**
1. Export payments from Razorpay Dashboard
2. Compare with database records
3. Identify discrepancies
4. Investigate and resolve

**Reconciliation Checklist:**
- [ ] All Razorpay payments have corresponding database records
- [ ] All database payments have corresponding Razorpay transactions
- [ ] Amounts match
- [ ] Payouts are correctly recorded
- [ ] Refunds are properly tracked

#### 2. Review Failed Webhooks

```bash
# Find unprocessed webhooks
db.webhook_events.find({
  processed: false,
  verified: true
})
```

**Action:**
- Review unprocessed webhooks
- Manually process if needed
- Investigate why processing failed

### Monthly Operations

#### 1. Financial Reconciliation

**Generate Reports:**
- Total revenue
- Total payouts
- Platform fees (if applicable)
- Refunds issued
- Failed payments

**Tax Reporting:**
- Export payment records
- Calculate GST/TDS if applicable
- Generate invoices

#### 2. Security Audit

- Review webhook signature verification logs
- Check for unauthorized access attempts
- Verify encryption of sensitive data
- Review payout credentials access

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Razorpay is not configured"

**Symptoms:**
- Error in logs: "Razorpay credentials not configured"
- UPI payments fail

**Solution:**
1. Check `.env` file has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
2. Verify keys are correct (no extra spaces)
3. Restart server after updating `.env`
4. Check server logs for configuration errors

#### Issue 2: Webhook Not Received

**Symptoms:**
- Payment completed in Razorpay but order not updated
- No webhook events in database

**Solution:**
1. **Check Webhook URL:**
   - Go to Razorpay Dashboard → Settings → Webhooks
   - Verify URL is correct and accessible
   - Test webhook URL manually: `curl https://your-domain.com/api/webhooks/razorpay`

2. **Check Server Logs:**
   ```bash
   # Check if webhook endpoint is being called
   tail -f server/logs/combined.log | grep webhook
   ```

3. **Check Firewall/Security:**
   - Ensure Razorpay IPs are whitelisted (if firewall enabled)
   - Verify SSL certificate is valid
   - Check CORS settings

4. **Test Webhook Manually:**
   - Use Razorpay Dashboard → Webhooks → Send Test Webhook
   - Check server receives it

#### Issue 3: Webhook Signature Verification Fails

**Symptoms:**
- Webhook received but signature verification fails
- Webhook events marked as `verified: false`

**Solution:**
1. Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay Dashboard
2. Check webhook secret is for correct webhook URL
3. Ensure webhook payload is not modified before verification
4. Check if using correct webhook secret (sandbox vs production)

#### Issue 4: Payment Intent Creation Fails

**Symptoms:**
- Error: "Failed to create payment intent"
- Order creation fails for UPI

**Solution:**
1. **Check Razorpay Account:**
   - Verify account is active
   - Check account limits
   - Verify KYC is complete

2. **Check API Keys:**
   - Verify keys are correct
   - Check if using test keys in production (or vice versa)
   - Regenerate keys if needed

3. **Check Amount:**
   - Verify amount is in paise (multiply by 100)
   - Check minimum amount (₹1 = 100 paise)
   - Verify amount doesn't exceed limits

#### Issue 5: Payout Fails

**Symptoms:**
- Payment succeeds but payout fails
- Payout status remains "failed"

**Solution:**
1. **Check Dealer Credentials:**
   - Verify UPI ID format is correct
   - Verify bank details (IFSC, account number)
   - Check if dealer account is active

2. **Check RazorpayX:**
   - Verify RazorpayX account is set up
   - Check account balance
   - Verify payout limits

3. **Manual Retry:**
   - Use admin endpoint: `POST /api/admin/payouts/{orderId}/retry`
   - Or process manually via RazorpayX Dashboard

#### Issue 6: Stock Not Restored on Payment Failure

**Symptoms:**
- Payment fails but stock remains reserved
- Products show out of stock incorrectly

**Solution:**
1. **Check Payment Failure Handler:**
   - Verify stock restoration code runs
   - Check for errors in logs

2. **Manual Stock Restoration:**
   ```javascript
   // In MongoDB shell or admin tool
   db.orders.findOne({ _id: ObjectId("order_id") })
   // Get items and restore stock manually
   ```

3. **Run Stock Reconciliation:**
   - Compare reserved stock with actual orders
   - Restore stock for failed payments

#### Issue 7: Duplicate Orders Created

**Symptoms:**
- Multiple orders created for same request
- Idempotency not working

**Solution:**
1. **Check Idempotency Key:**
   - Verify frontend sends `Idempotency-Key` header
   - Check key is unique per request
   - Verify key format is correct

2. **Check Middleware:**
   - Verify idempotency middleware is applied
   - Check middleware order in route setup
   - Review middleware logs

3. **Database Check:**
   ```javascript
   // Find duplicate orders
   db.orders.aggregate([
     { $group: { _id: "$orderNumber", count: { $sum: 1 } } },
     { $match: { count: { $gt: 1 } } }
   ])
   ```

#### Issue 8: Payment Status Not Updating

**Symptoms:**
- Payment completed but order status stuck at `PENDING_PAYMENT`
- Frontend polling doesn't see update

**Solution:**
1. **Check Webhook Processing:**
   - Verify webhook was received
   - Check webhook was processed
   - Review webhook processing logs

2. **Manual Status Update:**
   ```javascript
   // In MongoDB or admin tool
   db.orders.updateOne(
     { _id: ObjectId("order_id") },
     { 
       $set: { 
         status: "PAYMENT_CONFIRMED",
         paymentStatus: "paid"
       }
     }
   )
   ```

3. **Check Order Status Endpoint:**
   - Verify endpoint returns correct status
   - Check authentication
   - Review response format

### Debugging Tools

#### 1. Check Payment Records

```javascript
// MongoDB query
db.payments.find({ orderId: "order_id" })
```

#### 2. Check Webhook Events

```javascript
// MongoDB query
db.webhook_events.find({ 
  "payload.payment.entity.order_id": "razorpay_order_id" 
}).sort({ createdAt: -1 })
```

#### 3. Check Order Timeline

```javascript
// MongoDB query
db.orders.findOne(
  { _id: ObjectId("order_id") },
  { timeline: 1 }
)
```

#### 4. Razorpay Dashboard

- **Payments**: View all payments and their status
- **Orders**: View all payment intents
- **Webhooks**: View webhook delivery status
- **Payouts**: View payout status (if RazorpayX enabled)

---

## FAQs

### General Questions

**Q: Can I use both COD and UPI for the same order?**
A: No, user must select one payment method per order. The system enforces single payment method selection.

**Q: What happens if user doesn't complete UPI payment?**
A: After 15 minutes (configurable), the order is marked as `PAYMENT_FAILED`, stock is restored, and user can retry or choose COD.

**Q: Can dealer change payout credentials after registration?**
A: Yes, dealers can update payout credentials via `PATCH /api/dealer/payout` endpoint.

**Q: What if dealer doesn't have payout credentials?**
A: UPI payment option is disabled for that dealer. User must choose COD or contact dealer to set up payout credentials.

**Q: How are refunds handled?**
A: Refunds are processed via Razorpay refund API. Admin can initiate refunds, and system updates order status accordingly.

### Technical Questions

**Q: Why are amounts stored in paise?**
A: To avoid floating-point precision issues. ₹100 is stored as 10000 paise.

**Q: How does idempotency work?**
A: Frontend generates a unique `Idempotency-Key` for each order request. Backend caches the response. If same key is used again, cached response is returned instead of creating duplicate order.

**Q: What if webhook is delayed or missed?**
A: System stores all webhook events. Background job can retry failed webhooks. Frontend also polls order status as backup.

**Q: Can I use a different payment gateway?**
A: The gateway service is abstracted, but switching requires updating `gatewayService.ts` to use different gateway SDK and APIs.

**Q: How are multi-dealer carts handled?**
A: Currently, system uses first dealer or provided dealerId. For true multi-dealer support, cart should be split into separate orders per dealer at checkout.

### Business Questions

**Q: What are the Razorpay fees?**
A: Razorpay charges vary by plan. Typically:
- UPI: ~2% + GST
- RazorpayX Payouts: ~₹2-5 per payout
- Check Razorpay pricing page for current rates

**Q: Can I change COD charge amount?**
A: Yes, update `COD_CHARGE` environment variable (in rupees, not paise).

**Q: What happens to money if payout fails?**
A: Money remains in your Razorpay account. You can retry payout or process manually. System tracks payout status for reconciliation.

**Q: How do I handle chargebacks?**
A: Razorpay handles chargebacks. You'll receive notifications. System should be updated to handle chargeback webhooks and update order status accordingly.

---

## Support & Resources

### Razorpay Support
- **Documentation**: https://razorpay.com/docs/
- **Support**: https://razorpay.com/support/
- **Status Page**: https://status.razorpay.com/

### Internal Support
- Check server logs: `server/logs/`
- Review webhook events in database
- Check payment records for discrepancies
- Contact development team for code issues

### Useful Commands

```bash
# Check server logs
tail -f server/logs/combined.log

# Check error logs
tail -f server/logs/error.log

# Test Razorpay connection
node server/test-razorpay.js

# Check database connection
# Use MongoDB shell or GUI tool
```

---

## Appendix

### A. Complete Environment Variable Template

```env
# ============================================
# RAZORPAY CONFIGURATION
# ============================================
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_ENV=sandbox

# ============================================
# PAYMENT SETTINGS
# ============================================
COD_CHARGE=5
PAYMENT_TIMEOUT_MINUTES=15
IDEMPOTENCY_KEY_EXPIRY_HOURS=24

# ============================================
# DATABASE (if not already configured)
# ============================================
MONGODB_URI=mongodb://localhost:27017/car-systems

# ============================================
# SERVER (if not already configured)
# ============================================
PORT=3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-here
```

### B. UPI ID Validation Regex

```javascript
// Valid UPI ID format: username@paymentprovider
const upiRegex = /^[\w.-]+@[\w]+$/;

// Valid examples:
// - user@paytm
// - business@ybl
// - shop@phonepe
// - dealer.name@upi
```

### C. IFSC Code Validation Regex

```javascript
// Valid IFSC format: XXXX0XXXXX (4 letters, 0, 6 alphanumeric)
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Valid examples:
// - HDFC0001234
// - SBIN0005678
// - ICIC0009876
```

### D. Sample Webhook Payload

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxxxxxxxxxx",
        "entity": "payment",
        "amount": 68100,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_xxxxxxxxxxxxx",
        "method": "upi",
        "description": null,
        "notes": {
          "orderId": "mongodb_order_id_123"
        },
        "created_at": 1234567890
      }
    }
  }
}
```

### E. Payment Status Flow Diagram

```
ORDER_PLACED
    │
    ├─ COD ──> PENDING_COD ──> PAYMENT_CONFIRMED ──> ORDER_CONFIRMED
    │              │
    │              └─> COD_NOT_COLLECTED (terminal)
    │
    └─ UPI ──> PENDING_PAYMENT ──┬─> PAYMENT_CONFIRMED ──> ORDER_CONFIRMED
                                  │
                                  └─> PAYMENT_FAILED (terminal)
```

---

## Version History

- **v1.0.0** (Current): Initial payment integration
  - COD support with ₹5 charge
  - UPI payment via Razorpay
  - Dealer payout management
  - Webhook processing
  - Idempotency handling
  - Stock validation
  - Payment timeout handling

---

**Last Updated:** [Current Date]
**Maintained By:** Development Team
**Contact:** [Your Contact Information]

