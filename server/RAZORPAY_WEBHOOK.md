# Razorpay webhook checklist

Production webhook URL (already implemented on the server):

```
POST https://api.motonode.in/api/webhooks/razorpay
```

## Dashboard setup

1. [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Settings** → **Webhooks** → your webhook.
2. **Webhook URL:** `https://api.motonode.in/api/webhooks/razorpay`
3. **Secret:** same value as `RAZORPAY_WEBHOOK_SECRET` on the api.motonode.in host (e.g. `mymotonode123`).
4. **Active events** (Payment section — scroll past Invoice/Subscription):
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Save, then use **Send test webhook** for `payment.captured` and confirm logs show success.

## Production env (api.motonode.in)

Set on your host (Vercel/Render/VPS):

| Variable | Notes |
|----------|--------|
| `RAZORPAY_KEY_ID` | Same mode as dashboard (test vs live) |
| `RAZORPAY_KEY_SECRET` | Matching secret |
| `RAZORPAY_WEBHOOK_SECRET` | Must match dashboard webhook secret |
| `RAZORPAY_ENV` | `test` or `live` |

## Deploy

`api.motonode.in` must run **this** server build (see `app.post('/api/webhooks/razorpay', ...)` in `src/index.ts`).  
If the route returns `404 Route not found`, redeploy the server and set the Razorpay env vars on that host.

Before deploy, on the server host:

```bash
cd server
cp .env.example .env   # if needed
# Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
npm run verify:razorpay
npm run build && npm start
```

After deploy, UPI orders must return `paymentAction.type === "RAZORPAY_CHECKOUT"`, `keyId` starting with `rzp_`, and `paymentIntentId` starting with `order_`.  
Pending orders with legacy ids can call `POST /api/user/orders/:id/payment-action` to regenerate a Razorpay order.

Until then, webhooks only work on hosts that already have the route (e.g. Render during migration).

## Verify

```bash
# After deploy: expect 200 with body {"success":true,"message":"Webhook received"} (signature checked async)
# Before deploy / invalid sig: may be 401 or 404 depending on host version
curl -s -w "\nHTTP %{http_code}\n" -X POST \
  https://api.motonode.in/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -d '{}'
```

Then in Razorpay Dashboard → **Send test webhook** for `payment.captured` and check server logs.

App: place a test order → Razorpay checkout → order should show paid (client verify and/or webhook).
