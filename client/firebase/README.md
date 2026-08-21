# Firebase mobile config (required for push)

Download from [Firebase Console](https://console.firebase.google.com/) → project **motonode-d7ed1**:

1. **Android** (`com.motonode.new`) → `google-services.json` → copy to `client/android/app/google-services.json`
2. **iOS** (`com.motonode.new`) → `GoogleService-Info.plist` → copy to `client/ios/GoogleService-Info.plist`

Example templates are in this folder. Replace placeholders before building.

**Critical:** `package_name` in `google-services.json` must match `applicationId` in `android/app/build.gradle` (`com.motonode.new`). A file registered for `com.carconnect` or `com.motonode` causes `Please set a valid API key` on `getToken()`.

Verify locally:

```bash
node scripts/verify-firebase-android-config.js
```

If push still fails after fixing the package name, register **Android app `com.motonode.new`** in Firebase Console and re-download `google-services.json` (do not reuse a `com.carconnect` or `com.motonode` app id).

APNs: Project Settings → Cloud Messaging → upload your `.p8` key (Key ID + Team ID).
