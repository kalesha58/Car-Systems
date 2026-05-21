# Firebase mobile config (required for push)

Download from [Firebase Console](https://console.firebase.google.com/) → project **motonode-d7ed1**:

1. **Android** (`com.motonode`) → `google-services.json` → copy to `client/android/app/google-services.json`
2. **iOS** (`com.motonode`) → `GoogleService-Info.plist` → copy to `client/ios/GoogleService-Info.plist`

Example templates are in this folder. Replace placeholders before building.

APNs: Project Settings → Cloud Messaging → upload your `.p8` key (Key ID + Team ID).
