# MSG91 Phone OTP Authentication

Phone login for the Motonode mobile app uses MSG91 on the server only. The React Native client never receives `MSG91_API_KEY`.

## Dashboard setup

1. Create an account at [MSG91](https://msg91.com/).
2. Create an **OTP template** and note the `template_id`.
3. Copy your **Auth Key** from the control panel.
4. For testing, add your number as a test recipient in MSG91 if required by your plan.

### Option A — Development (recommended)

1. In MSG91: **Create Authkey** → Name: `Motonode Dev`.
2. **Where integrating:** Server-side / API / Backend.
3. **IP security ON** → Whitelisted IPs: add your dev machine **public IPv4** (not `127.0.0.1`):
   ```bash
   curl -4 https://ifconfig.me/ip
   ```
   Example format: `49.205.253.69` (no port, no `http://`). Re-run and update MSG91 if your ISP changes your IP.
4. Copy the auth key into `server/.env`:
   ```env
   MSG91_API_KEY=<paste auth key here>
   MSG91_TEMPLATE_ID=<your OTP template id>
   ```
5. Restart the API: `cd server && npm run dev`.
6. Test send OTP (use a real 10-digit Indian mobile registered for SMS on your MSG91 plan):
   ```bash
   curl -X POST http://localhost:3000/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone":"9876543210"}'
   ```

If MSG91 still rejects requests, the error usually means the outbound IP seen by MSG91 is not whitelisted (VPN, different Wi‑Fi, or server running elsewhere).

## Environment variables

Add to `server/.env` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `MSG91_API_KEY` | MSG91 auth key (header `authkey`) |
| `MSG91_TEMPLATE_ID` | OTP template ID |
| `MSG91_OTP_LENGTH` | OTP digits (default `6`) |
| `MSG91_COUNTRY_CODE` | Country prefix without `+` (default `91`) |
| `OTP_EXPIRY_MINUTES` | Session expiry (default `5`) |
| `OTP_SEND_LIMIT` | Max sends per phone per window (default `3`) |
| `OTP_SEND_WINDOW_MINUTES` | Send window (default `5`) |
| `OTP_RESEND_COOLDOWN_SECONDS` | Min seconds between sends (default `30`) |
| `OTP_MAX_VERIFY_ATTEMPTS` | Max wrong OTPs per session (default `5`) |
| `OTP_REGISTRATION_TOKEN_EXPIRES_IN` | JWT for new-user signup step (default `15m`) |
| `JWT_SECRET` | JWT signing secret |
| `MONGODB_URI` | MongoDB connection string |

Install dependencies:

```bash
cd server && npm install
```

## API endpoints

Base path: `/api/auth` (e.g. `http://localhost:3000/api/auth`).

### Send OTP

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

**200**

```json
{
  "success": true,
  "Response": {
    "message": "OTP sent",
    "resendAfterSeconds": 30
  }
}
```

### Verify OTP (existing user)

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'
```

**200**

```json
{
  "success": true,
  "isNewUser": false,
  "Response": { "id": "...", "name": "...", "phone": "9876543210", "role": ["user"] },
  "token": "eyJ..."
}
```

### Verify OTP (new user)

**200**

```json
{
  "success": true,
  "isNewUser": true,
  "phone": "9876543210",
  "registrationToken": "eyJ..."
}
```

### Complete phone signup

```bash
curl -X POST http://localhost:3000/api/auth/complete-phone-signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <registrationToken>" \
  -d '{
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "termsAccepted": true,
    "privacyAccepted": true,
    "termsVersion": "2026-05",
    "privacyVersion": "2026-05"
  }'
```

**201** — same shape as login (`Response` + `token`).

## Mobile app

- Token storage uses **MMKV** (`tokenStorage` in `client/src/state/storage.tsx`), not AsyncStorage.
- Point `BASE_URL` in `client/src/service/config.tsx` to your API (local IP for dev).
- Flow: Customer Login → **Login with phone** → OTP screen → (new users) profile screen.

## Production notes

- Rotate `MSG91_API_KEY` and `JWT_SECRET` on a schedule.
- Monitor 429 responses (per-phone and per-IP limits).
- Use MSG91 IP allowlisting if your deployment has a fixed egress IP.
- OTP sessions expire via MongoDB TTL on `expiresAt`.

## Tests

```bash
cd server && npm run test:otp
```
