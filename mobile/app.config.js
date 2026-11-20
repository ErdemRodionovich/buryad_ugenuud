const packageJson = require('../package.json')

module.exports = {
  expo: {
    name: 'Buryad Ugenuud',
    slug: 'buryad-ugenuud',
    version: packageJson.version,
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: '../buryad_ugenuud_icon.png',
    plugins: [
      'pear-runtime-react-native',
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 29,
            compileSdkVersion: 36,
            targetSdkVersion: 36
          }
        }
      ],
      './plugins/with-android-web-assets',
      './plugins/with-ios-worker-addons'
    ],
    ios: {
      bundleIdentifier: 'com.erdem.badluev.buryadugenuud',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription:
          'Allow Buryad Ugenuud to use the camera to scan a device-pairing QR code.'
      }
    },
    android: {
      package: 'com.erdem.badluev.buryadugenuud',
      versionCode: 4,
      adaptiveIcon: {
        foregroundImage: '../buryad_ugenuud_icon.png',
        backgroundColor: '#fbfcf8'
      },
      permissions: ['CAMERA'],
      blockedPermissions: [
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE'
      ]
    }
  }
}
