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

### Option B — Vercel production (required for `car-systems.vercel.app`)

Vercel serverless uses **dynamic outbound IPs**. If API Security (IP whitelist) is enabled on your MSG91 auth key, requests fail with **error code 418** and you receive an email alert from MSG91.

**Use two auth keys:**

| Setting | Dev key (`server/.env`) | Production key (Vercel env) |
|---------|-------------------------|-----------------------------|
| Name | `Motonode Dev` | `Motonode Vercel Prod` |
| Integration | Server-side / API | Server-side / API |
| **IP Security** | **ON** — whitelist your dev public IPv4 | **OFF** — do not enable IP whitelist |
| Where used | Local `npm run dev` | Vercel project environment variables |

**MSG91 dashboard steps (account e.g. build8):**

1. **SMS → API Failed Logs** — confirm failed requests show **418** and note the rejected source IP (for reference only; do not whitelist Vercel IPs long-term).
2. **Authkey → Create** → name `Motonode Vercel Prod`, integration **Server-side / API**, **IP Security disabled**.
3. Copy the new auth key and your approved **OTP template ID**.
4. In **Vercel** → Project → **Settings → Environment Variables**, set:
   - `MSG91_API_KEY` = production auth key (no IP lock)
   - `MSG91_TEMPLATE_ID` = OTP template id
   - `MSG91_OTP_LENGTH` = `6`
   - `MSG91_COUNTRY_CODE` = `91`
   - `OTP_RESEND_COOLDOWN_SECONDS` = `30`
   - `OTP_EXPIRY_MINUTES` = `5`
5. **Redeploy** the backend after saving env vars.

**Verify production:**

```bash
curl -X POST https://car-systems.vercel.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"YOUR_10_DIGIT_NUMBER"}'
```

Expected: `200` with `"OTP sent"`. If the server returns a message containing `IP not whitelisted`, the Vercel env still uses an IP-locked auth key.

### API returns success but SMS not received

`200` + `"OTP sent"` means **MSG91 accepted the OTP request** (you got a `request_id`). It does **not** guarantee the SMS reached the handset. Delivery can still fail afterward (DLT, template, balance, DND, trial whitelist).

**Check in MSG91 dashboard (account build8):**

1. **SMS → Logs** or **OTP → Reports** — search mobile `917799012154` (country code + number).
2. Look at **delivery status**:
   - **Delivered** — check phone spam/SMS folder; wait 1–2 minutes; try another carrier if ported.
   - **Failed** — open the row and read **failure reason** (DLT template, header, entity, balance, etc.).
3. **API Failed Logs** — should be empty if 418 is fixed; if new codes appear, fix those first.
4. **OTP template** — must be **approved** on MSG91 and registered on **DLT** with correct entity ID and sender/header.
5. **Trial / test accounts** — some plans only deliver to **whitelisted test numbers**. Add `7799012154` under MSG91 test recipients if your plan requires it.
6. **Balance** — error 301 or low credits block delivery.

**Server logs (Vercel):** After deploy, successful sends log `MSG91 send OTP accepted` with `requestId`. Match that `requestId` in MSG91 reports to see delivery outcome.

**Common MSG91 API error codes:**

| Code | Meaning | Fix |
|------|---------|-----|
| 418 | IP not whitelisted | Production auth key with IP Security **off** on Vercel |
| 207 | Invalid auth key | Check `MSG91_API_KEY` in Vercel env |
| 301 | Insufficient balance | Top up MSG91 account |

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
- **Vercel:** use a dedicated prod auth key **without** IP whitelist (see Option B above). IP allowlisting only works with a fixed egress IP (VPS, not serverless).
- OTP sessions expire via MongoDB TTL on `expiresAt`.
- Server logs MSG91 error `code` (e.g. 418) in `msg91OtpService` for easier debugging.

## Tests

```bash
cd server && npm run test:otp
```
