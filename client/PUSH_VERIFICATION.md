# Push notification E2E verification

Prerequisites: Firebase configs from [client/firebase/README.md](firebase/README.md). Run `npm run verify:firebase-android` in `client/`. Server must log `Firebase Admin SDK initialized successfully`.

If Android shows `Please set a valid API key`, ensure `google-services.json` `package_name` is `com.motonode` (not `com.carconnect`).

## 1. Token registration

1. Run server with `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`.
2. Login on a **physical** device (iOS or Android).
3. Confirm `POST /api/user/fcm-token` returns 200 (server logs / network tab).
4. Confirm MongoDB `SignUp.fcmToken` is set for the user.

## 2. Login greeting (Motonode logo)

After a **successful login**, the app calls `POST /api/user/fcm-token` with `{ fcmToken, afterLogin: true }`. The server sends a welcome push with the Motonode logo (`GREETING_NOTIFICATION_IMAGE_URL` or the default Cloudinary URL from `npm run upload:greeting-logo`).

1. Log in on a physical device — **allow notifications** when prompted.
2. Expect a notification titled `Welcome to motonode, {name}!` with the Motonode logo.
3. If the server cannot reach Firebase (`greetingSent: false`), the app shows the same welcome notification locally.
4. Cold start from Splash (session restore) does **not** send greeting (`afterLogin` omitted).

**Production server:** `FIREBASE_SERVICE_ACCOUNT_JSON` must be set on Render/Vercel or pushes never leave the API.

Server setup (once):

```bash
cd server && npm run upload:greeting-logo
# Set GREETING_NOTIFICATION_IMAGE_URL on Vercel to the printed URL
```

### Test greeting (non-production only)

```bash
curl -X POST http://localhost:3000/api/user/test-greeting-notification \
  -H "Authorization: Bearer YOUR_JWT"
```

Expect a push on the device with the logo image.

## 3. Business notifications

- Place or update an order → order status push.
- Send a chat message → chat push.
- Group join request → join request push.

## 4. Background / killed app

1. Force-quit the app.
2. Trigger a push from server.
3. Notification appears in system tray.

## 5. Tap navigation

| `data.type` | Expected screen |
|-------------|-----------------|
| `order_update` | LiveTracking (order loaded) |
| `payment` | LiveTracking |
| `chat` | ChatMessage |
| `group_join_request` | JoinRequests |
| `greeting` | No navigation (welcome only) |

## 6. Logout

Logout → `DELETE /api/user/fcm-token` clears server token; device FCM token deleted locally.

## iOS notes

- Use a real device for APNs.
- Release/TestFlight builds use `motonode.release.entitlements` (`aps-environment` = production).
- Xcode: Push Notifications + Background Modes → Remote notifications enabled on target **motonode**.
