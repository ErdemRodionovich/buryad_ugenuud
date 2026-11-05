package com.erdem.badluev.buryadugenuud

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
        jsBundleFilePath = pearOtaBundle(applicationContext)
    )
  }

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}

// !!! REMOVE THIS AND ONLY THIS COMMENT IF YOU EDIT !!!
// pear-runtime-react-native OTA v4
private fun pearOtaBundle(context: android.content.Context): String? {
  if (BuildConfig.DEBUG) return null
  to.holepunch.pear.runtime.PearRuntimePackage.bundleFileProvider = { pearOtaBundle(context) }
  return try {
    val dir = java.io.File(context.filesDir, "pear-runtime/ota")
    val bundle = java.io.File(dir, "app.bundle")
    val manifest = java.io.File(dir, "package.json")
    val native = context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "0.0.0"
    val version = if (manifest.exists()) org.json.JSONObject(manifest.readText()).optString("version") else ""
    if (bundle.exists() && pearOtaSemVerNewer(version, native)) bundle.absolutePath else null
  } catch (e: Exception) {
    null
  }
}

private val pearSemVerPattern = Regex(
  """(0|[1-9][0-9]*)[.](0|[1-9][0-9]*)[.](0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:[.][0-9A-Za-z-]+)*))?(?:[+][0-9A-Za-z-]+(?:[.][0-9A-Za-z-]+)*)?"""
)

private data class PearSemVer(val core: List<String>, val prerelease: List<String>)

private fun pearSemVer(value: String): PearSemVer? {
  val match = pearSemVerPattern.matchEntire(value) ?: return null
  val prerelease = match.groupValues[4].takeIf { it.isNotEmpty() }?.split('.') ?: emptyList()
  if (prerelease.any { part ->
    part.length > 1 && part[0] == '0' && part.all { it in '0'..'9' }
  }) return null
  return PearSemVer(match.groupValues.slice(1..3), prerelease)
}

private fun pearNumericCompare(a: String, b: String): Int {
  if (a.length != b.length) return a.length.compareTo(b.length)
  return a.compareTo(b)
}

private fun pearSemVerCompare(a: PearSemVer, b: PearSemVer): Int {
  for (i in 0..2) {
    val result = pearNumericCompare(a.core[i], b.core[i])
    if (result != 0) return result
  }

  if (a.prerelease.isEmpty()) return if (b.prerelease.isEmpty()) 0 else 1
  if (b.prerelease.isEmpty()) return -1

  for (i in 0 until minOf(a.prerelease.size, b.prerelease.size)) {
    val x = a.prerelease[i]
    val y = b.prerelease[i]
    if (x == y) continue

    val xNumeric = x.all { it in '0'..'9' }
    val yNumeric = y.all { it in '0'..'9' }
    val result = when {
      xNumeric && yNumeric -> pearNumericCompare(x, y)
      xNumeric -> -1
      yNumeric -> 1
      else -> x.compareTo(y)
    }
    if (result != 0) return result
  }

  return a.prerelease.size.compareTo(b.prerelease.size)
}

private fun pearOtaSemVerNewer(a: String, b: String): Boolean {
  val x = pearSemVer(a) ?: return false
  val y = pearSemVer(b) ?: return false
  return pearSemVerCompare(x, y) > 0
}

// pear-runtime-react-native OTA v4 end
