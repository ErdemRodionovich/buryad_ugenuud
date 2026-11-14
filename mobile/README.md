# iOS App Store and Android / Google Play

This Expo project hosts the shared Buryad Ugenuud UI and Pear worker on iOS and
Android. The UI is built from `../renderer`; Android loads it from Android
assets, while iOS loads it as a bundled local HTML asset. Pear Mobile runs the
P2P worker in a BareKit worklet. Store builds update executable app code through
the corresponding app store; P2P data replication and device pairing remain
enabled. Pear Mobile currently describes itself as experimental, so test
thoroughly on physical devices before release.

## Apple App Store status

The iOS bundle identifier is `com.erdem.badluev.buryadugenuud`. The worker
bundle targets iOS arm64 device and arm64/x64 simulators; CocoaPods invokes
BareKit's linker to generate the worker's iOS native addon XCFrameworks.
Complete the signed-device and TestFlight checks below before App Store
submission. The publisher must provide an Apple Developer team, store listing,
privacy disclosures, export-compliance answers, and a public privacy policy URL.

## Requirements

- Node.js 20.19.4 or newer and npm
- Xcode with iOS SDK and CocoaPods for iOS builds
- Android Studio with Android SDK platform 36, Build Tools, and an Android 10+
  arm64-v8a device or x86_64 emulator (BareKit requires API 29 or newer)
- A valid Pear upgrade link in the root `package.json`

The Android application ID is `com.erdem.badluev.buryadugenuud`. It is a
permanent Play Store identifier; do not change it after the first Play release.
The Android launcher icon uses the PNG rendition of
[`../buryad_ugenuud_icon.svg`](../buryad_ugenuud_icon.svg), configured in
`app.config.js`.

## Build and run

Install the root app dependencies from `app/` and the Expo dependencies from
this directory, then run the platform command from this directory:

```sh
npm install
npm run ios
npm run android
```

Both prebuild commands create the Vite UI and bundle the current source from the
sibling `worker/` repository. A temporary `worker/node_modules` link reuses the
root app dependency tree during bundling and addon linking, then is removed.
Android additionally links native `.so` addons. On iOS, CocoaPods links matching
worker addon XCFrameworks. This keeps both package manifests and lockfiles
unchanged while ensuring the bundle contains the profile and language handlers
used by this UI.

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

For iOS, `npm run ios:release` builds and installs a Release configuration on a
selected device or simulator. To create an Xcode archive for App Store Connect,
configure the Apple Developer team and automatic signing for the generated
`BuryadUgenuud` target in Xcode, then run:

```sh
npm run ios:archive
```

The archive is written to `build/BuryadUgenuud.xcarchive`. Export and upload it
with Xcode Organizer or App Store Connect after completing signing and store
metadata. Signing identities, provisioning, and the App Store Connect account
are publisher-managed and must not be committed.

Debug builds load their React Native host JavaScript from Metro. `npm run ios`
and `npm run android` start Metro automatically. If you launch a Debug app
directly from Xcode, Android Studio, or an already-installed app icon, start the
Expo development server in this directory first and leave it running:

```sh
npm run start
```

Then reload the app. The iOS simulator and USB-connected iPhone use the Mac's
Metro server on port 8081; for a physical device, ensure it can reach the Mac on
the same network. For Android, forward Metro's port with
`adb reverse tcp:8081 tcp:8081`; the emulator can normally reach the host at
`10.0.2.2:8081`. The standalone Release build embeds the JavaScript bundle and
does not need Metro.

If the app displays “No script URL provided,” it is a Debug build that cannot
reach Metro. Start `npm run start` and reload, or build/install a Release version
with `npm run ios:release` for a standalone test.

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

## Store submission checklist

Before App Store or Play publication:

- Configure platform signing and preserve signing keys outside source control.
- Verify the final application name, icon, screenshots, and store listing text.
- Publish the local privacy policy at a public URL after replacing publisher and
  privacy-contact placeholders, then complete each store's privacy disclosures
  based on P2P, media, pairing, and translation-provider behavior.
- Complete age/content ratings, audience, app access, export compliance, and
  other store-specific declarations.
- Test onboarding, language creation/joining, polls, media selection,
  QR/manual device pairing, app lifecycle, and worker persistence on physical
  iPhones and Android devices. Provide App Review a reliable path through P2P
  features.
- Increment `ios.buildNumber` and Android `versionCode` for each store upload;
  test signed Release builds, not only debug builds.

This repository does not contain Apple/Google developer accounts, signing
credentials, a published privacy-policy URL, store listings, or release
approval. The publisher must supply and verify those before submission.
