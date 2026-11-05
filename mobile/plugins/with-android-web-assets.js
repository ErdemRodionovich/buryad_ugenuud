const fs = require('fs')
const path = require('path')
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod
} = require('@expo/config-plugins')

function withAndroidWebAssets(config) {
  config = withAppBuildGradle(config, (modConfig) => {
    const addonMarker = '// PEAR_WORKER_NATIVE_ADDONS'
    if (!modConfig.modResults.contents.includes(addonMarker)) {
      modConfig.modResults.contents += `

${addonMarker}
android {
    sourceSets {
        main {
            jniLibs.srcDir(new File(rootProject.projectDir.parentFile, "worker-addons"))
        }
    }
}
`
    }

    const signingMarker = '// PLAY_UPLOAD_SIGNING_CONFIG'
    if (!modConfig.modResults.contents.includes(signingMarker)) {
      modConfig.modResults.contents += `

${signingMarker}
android {
    signingConfigs {
        release {
            def uploadStoreFile = System.getenv("ANDROID_UPLOAD_KEYSTORE")
            def uploadStorePassword = System.getenv("ANDROID_UPLOAD_STORE_PASSWORD")
            def uploadKeyAlias = System.getenv("ANDROID_UPLOAD_KEY_ALIAS")
            def uploadKeyPassword = System.getenv("ANDROID_UPLOAD_KEY_PASSWORD")
            if (uploadStoreFile && uploadStorePassword && uploadKeyAlias && uploadKeyPassword) {
                storeFile file(uploadStoreFile)
                storePassword uploadStorePassword
                keyAlias uploadKeyAlias
                keyPassword uploadKeyPassword
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

gradle.taskGraph.whenReady { graph ->
    def releasePackagingTasks = ["assembleRelease", "bundleRelease", "installRelease"]
    if (graph.allTasks.any { releasePackagingTasks.contains(it.name) }) {
        def requiredSigningVariables = [
            "ANDROID_UPLOAD_KEYSTORE",
            "ANDROID_UPLOAD_STORE_PASSWORD",
            "ANDROID_UPLOAD_KEY_ALIAS",
            "ANDROID_UPLOAD_KEY_PASSWORD"
        ]
        def missingSigningVariables = requiredSigningVariables.findAll { !System.getenv(it) }
        if (!missingSigningVariables.isEmpty()) {
            throw new GradleException(
                "Release builds require Play upload signing variables: " +
                missingSigningVariables.join(", ")
            )
        }
    }
}
`
    }
    return modConfig
  })

  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest
    const permissions = manifest['uses-permission'] ?? []
    const hasCameraPermission = permissions.some(
      (permission) => permission.$['android:name'] === 'android.permission.CAMERA'
    )
    if (!hasCameraPermission) {
      permissions.push({ $: { 'android:name': 'android.permission.CAMERA' } })
    }
    manifest['uses-permission'] = permissions
    manifest['uses-feature'] ??= []

    const hasOptionalCameraFeature = manifest['uses-feature'].some(
      (feature) =>
        feature.$['android:name'] === 'android.hardware.camera.any' &&
        feature.$['android:required'] === 'false'
    )
    if (!hasOptionalCameraFeature) {
      manifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.camera.any',
          'android:required': 'false'
        }
      })
    }
    return modConfig
  })

  return withDangerousMod(config, [
    'android',
    (modConfig) => {
      const { projectRoot } = modConfig.modRequest
      const source = path.resolve(projectRoot, 'web')
      const destination = path.resolve(projectRoot, 'android/app/src/main/assets/buryad-web')

      if (!fs.existsSync(path.join(source, 'index.html'))) {
        throw new Error('Android web assets are missing. Run `npm run build:web` first.')
      }

      fs.rmSync(destination, { recursive: true, force: true })
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.cpSync(source, destination, { recursive: true })
      return Promise.resolve(modConfig)
    }
  ])
}

module.exports = withAndroidWebAssets
