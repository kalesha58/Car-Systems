# Push notification E2E verification

Prerequisites: replace placeholder Firebase configs with real files from [client/firebase/README.md](firebase/README.md). Server must log `Firebase Admin SDK initialized successfully`.

## 1. Token registration

1. Run server with `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`.
2. Login on a **physical** device (iOS or Android).
3. Confirm `POST /api/user/fcm-token` returns 200 (server logs / network tab).
4. Confirm MongoDB `SignUp.fcmToken` is set for the user.

## 2. Test greeting (non-production only)

```bash
curl -X POST https://car-systems.onrender.com/api/user/test-greeting-notification \
  -H "Authorization: Bearer YOUR_JWT"
```

Expect a push on the device.

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

## 6. Logout

Logout → `DELETE /api/user/fcm-token` clears server token; device FCM token deleted locally.

## iOS notes

- Use a real device for APNs.
- Release/TestFlight builds use `motonode.release.entitlements` (`aps-environment` = production).
- Xcode: Push Notifications + Background Modes → Remote notifications enabled on target **motonode**.
