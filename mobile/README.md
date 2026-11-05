# Android / Google Play

This project is the Android host for the existing Buryad Ugenuud UI and shared
Pear worker. The UI is built from `../renderer` and loaded from the app's local
Android assets; Pear Mobile runs the P2P worker in a BareKit worklet. Android
updates to executable app code are disabled and are delivered through Google
Play. The worker's P2P data replication and device pairing remain enabled.
The upstream Pear Mobile runtime currently describes itself as experimental, so
complete device and Play internal-track testing before a production rollout.

## Requirements

- Node.js 20.19.4 or newer and npm
- Android Studio with Android SDK platform 36, Build Tools, and an Android 10+
  arm64-v8a device or x86_64 emulator (BareKit requires API 29 or newer)
- A valid Pear upgrade link in the root `package.json`

The Android application ID is `com.erdem.badluev.buryadugenuud`. It is a
permanent Play Store identifier; do not change it after the first Play release.

## Build and run

Install the root app dependencies from the parent directory first, then run
these commands from this directory:

```sh
npm install
npm run android
```

The command builds the existing React UI, bundles the worker for Android
arm64-v8a and x86_64, links the exact worker native addons and their native
dependencies, runs Expo prebuild, then starts the debug app. Release builds
require Play upload signing variables:

```sh
npm run android:release
```

To create an Android App Bundle with the same signing setup:

```sh
npm run android:aab
```

Debug builds load their React Native host JavaScript from Metro. If you install
or open a debug APK separately (for example, from Android Studio), start Metro
in this directory and leave it running:

```sh
npm run start
```

Then reload the app. For a USB-connected physical device, forward Metro's port
with `adb reverse tcp:8081 tcp:8081`. The Android emulator can normally reach
the host at `10.0.2.2:8081`. The standalone release build embeds the JavaScript
bundle and does not need Expo CLI or Metro.

## Debugging a blank screen

Debug builds log native host, WebView load, bridge, worker, JavaScript warning,
and JavaScript error events with the `BuryadAndroid` prefix. With the device
connected, view those messages in Android Studio's Logcat or run:

```sh
adb logcat -v time | grep -E 'BuryadAndroid|ReactNativeJS|chromium|AndroidRuntime|libc|DEBUG|buryadugenuud'
```

Look for WebView load failures, a missing `#root` element, uncaught JavaScript
errors, or a worker startup failure. Native crashes appear under `libc` or
`DEBUG` rather than the `BuryadAndroid` prefix. `prebuild:android` links
version-matched native libraries from the root app dependency tree into
`worker-addons/`; rerun it after changing root dependencies or rebuilding the
worker. The bundle includes arm64-v8a and x86_64 workers. These diagnostic
logs are disabled in release builds.

For Android Studio, run `npm run prebuild:android` first, then open the
`android/` directory in this project. Prebuild creates the native project and
copies in the current web UI and Bare worker bundle.

The release AAB must be signed with the app's Play upload key before upload.
Keep the keystore and its passwords outside source control. Configure these
environment variables before building a release:

```sh
export ANDROID_UPLOAD_KEYSTORE=/absolute/path/to/upload-key.jks
export ANDROID_UPLOAD_STORE_PASSWORD=...
export ANDROID_UPLOAD_KEY_ALIAS=...
export ANDROID_UPLOAD_KEY_PASSWORD=...
npm run android:aab
```

Release tasks fail when any signing variable is missing rather than producing a
debug-signed bundle.

## Remaining Play Console work

Before production publication:

- Configure secure release signing and back up the upload key.
- Verify the final application name, icon, screenshots, and store listing text.
- Publish a privacy policy URL and complete the Data safety form based on the
  app's actual P2P, media, pairing, and optional translation-provider behavior.
- Complete the content rating, target audience, app access, and other Play
  Console declarations.
- Test install, onboarding, language creation/joining, polls, media selection,
  QR/manual device pairing, app lifecycle, and worker persistence on supported
  Android devices.
- Increment `versionCode` for every Play upload and test the signed release
  build, not only the debug build.

This repository does not contain a Play Console account, signing key, privacy
policy URL, store listing, or release approval. Those must be supplied and
verified by the publisher before submission.
