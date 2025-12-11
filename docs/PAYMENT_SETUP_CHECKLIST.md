# Payment System Setup Checklist

Use this checklist to ensure all components are properly configured before going live.

## Pre-Setup Requirements

### Razorpay Account
- [ ] Razorpay business account created
- [ ] KYC verification completed
- [ ] API keys obtained (Key ID and Key Secret)
- [ ] Webhook secret obtained
- [ ] RazorpayX account set up (for payouts) - Optional

### Server Infrastructure
- [ ] HTTPS domain configured
- [ ] SSL certificate valid
- [ ] MongoDB database accessible
- [ ] Server can receive webhooks from internet
- [ ] Environment variables configured

### Dealer Information
- [ ] Dealer registration process defined
- [ ] Payout credential collection process defined
- [ ] UPI ID validation process defined
- [ ] Bank account validation process defined

## Backend Setup

### Dependencies
- [ ] `razorpay` package installed (`npm install razorpay`)
- [ ] Server dependencies up to date
- [ ] No dependency conflicts

### Environment Variables
- [ ] `RAZORPAY_KEY_ID` set
- [ ] `RAZORPAY_KEY_SECRET` set
- [ ] `RAZORPAY_WEBHOOK_SECRET` set
- [ ] `RAZORPAY_ENV` set (sandbox or production)
- [ ] `COD_CHARGE` set (default: 5)
- [ ] `PAYMENT_TIMEOUT_MINUTES` set (default: 15)
- [ ] `IDEMPOTENCY_KEY_EXPIRY_HOURS` set (default: 24)

### Database
- [ ] MongoDB connection working
- [ ] Payment model will be created automatically
- [ ] WebhookEvent model will be created automatically
- [ ] IdempotencyKey model will be created automatically
- [ ] Dealer model updated with payout field

### API Endpoints
- [ ] Order creation endpoint updated
- [ ] Order status polling endpoint working
- [ ] Webhook endpoint accessible
- [ ] Dealer payout registration endpoint working
- [ ] Admin payout management endpoints working

### Testing
- [ ] Razorpay connection test passes
- [ ] Payment intent creation test passes
- [ ] Webhook signature verification test passes
- [ ] Order creation with COD works
- [ ] Order creation with UPI works

## Frontend Setup

### Navigation
- [ ] PaymentStatusScreen route registered
- [ ] Navigation to PaymentStatus works
- [ ] Navigation from PaymentStatus works

### Components
- [ ] CartScreen updated with payment selector
- [ ] Payment method selection works
- [ ] COD charge displays correctly
- [ ] Dealer info displays correctly
- [ ] Terms & conditions checkbox works
- [ ] Place Order button disabled until requirements met

### Services
- [ ] Order service updated with payment method
- [ ] Idempotency key generation works
- [ ] UPI payment service implemented
- [ ] Payment status polling works

## Webhook Configuration

### Razorpay Dashboard
- [ ] Webhook URL configured: `https://your-domain.com/api/webhooks/razorpay`
- [ ] Webhook events selected:
  - [ ] `payment.captured`
  - [ ] `payment.failed`
  - [ ] `payout.processed` (if using RazorpayX)
  - [ ] `payout.failed` (if using RazorpayX)
- [ ] Webhook secret copied to environment variables
- [ ] Test webhook sent and received successfully

### Server
- [ ] Webhook endpoint accessible from internet
- [ ] Webhook signature verification works
- [ ] Webhook processing is idempotent
- [ ] Webhook errors are logged

## Dealer Onboarding

### Process
- [ ] Dealer registration flow includes payout credential collection
- [ ] UPI ID validation works
- [ ] Bank details validation works
- [ ] Dealer can update payout credentials
- [ ] Admin can view dealer payout credentials

### Testing
- [ ] Dealer can register UPI ID
- [ ] Dealer can register bank details
- [ ] Invalid UPI ID is rejected
- [ ] Invalid IFSC is rejected
- [ ] Invalid account number is rejected

## Testing Scenarios

### COD Flow
- [ ] User can select COD
- [ ] COD charge (₹5) is added to total
- [ ] Order created with PENDING_COD status
- [ ] Order can be confirmed after COD collection

### UPI Flow
- [ ] User can select UPI (if dealer has credentials)
- [ ] UPI option disabled if dealer has no credentials
- [ ] Payment intent created successfully
- [ ] UPI app opens with correct amount
- [ ] Payment completion updates order status
- [ ] Payout initiated after payment confirmation

### Error Handling
- [ ] Payment timeout works (15 minutes)
- [ ] Stock restored on payment failure
- [ ] Duplicate order prevention works
- [ ] Webhook retry works
- [ ] Payout failure handling works

### Edge Cases
- [ ] Multi-dealer cart handling
- [ ] Insufficient stock handling
- [ ] Invalid payment method rejection
- [ ] Missing dealer payout credentials handling

## Security Checklist

- [ ] API keys stored securely (not in code)
- [ ] Webhook secret stored securely
- [ ] Bank details encrypted at rest
- [ ] Webhook signature verification enabled
- [ ] Idempotency keys prevent duplicate orders
- [ ] HTTPS enforced for all payment endpoints
- [ ] Sensitive data not logged
- [ ] Rate limiting on payment endpoints

## Monitoring Setup

- [ ] Payment metrics tracking configured
- [ ] Error logging configured
- [ ] Webhook event logging configured
- [ ] Payout status tracking configured
- [ ] Alerts configured for:
  - [ ] Webhook signature failures
  - [ ] Payout failures
  - [ ] Payment failure spikes

## Documentation

- [ ] Payment system guide created
- [ ] API documentation updated
- [ ] Admin procedures documented
- [ ] Troubleshooting guide created
- [ ] Team trained on payment system

## Go-Live Checklist

### Pre-Launch
- [ ] All tests pass in sandbox
- [ ] Production Razorpay keys obtained
- [ ] Production webhook URL configured
- [ ] All dealers have payout credentials
- [ ] Monitoring and alerts set up
- [ ] Support team trained

### Launch Day
- [ ] Switch to production Razorpay keys
- [ ] Update webhook URL to production
- [ ] Monitor first few transactions
- [ ] Verify webhooks are received
- [ ] Verify payouts are processed
- [ ] Check error logs

### Post-Launch
- [ ] Monitor payment success rate
- [ ] Monitor payout success rate
- [ ] Review failed payments daily
- [ ] Reconcile payments weekly
- [ ] Update documentation as needed

## Rollback Plan

If issues occur:
- [ ] Disable UPI payments (set `RAZORPAY_ENV=disabled`)
- [ ] Keep COD enabled
- [ ] Process pending payments manually
- [ ] Investigate and fix issues
- [ ] Re-enable UPI after fixes

---

**Last Updated:** [Current Date]
**Status:** Ready for Review

