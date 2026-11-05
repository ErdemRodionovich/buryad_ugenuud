package to.holepunch.pear.runtime

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactNativeHostHandler

class PearRuntimePackage : Package {
  companion object {
    @Volatile
    var bundleFileProvider: (() -> String?)? = null
  }

  override fun createReactNativeHostHandlers(context: Context): List<ReactNativeHostHandler> {
    if (bundleFileProvider == null) return emptyList()
    return listOf(PearRuntimeHostHandler())
  }
}

internal class PearRuntimeHostHandler : ReactNativeHostHandler {
  override fun getJSBundleFile(useDeveloperSupport: Boolean): String? {
    if (useDeveloperSupport) return null
    val provider = PearRuntimePackage.bundleFileProvider ?: return null
    return provider() ?: "assets://index.android.bundle"
  }

  override fun onReactInstanceException(useDeveloperSupport: Boolean, exception: Exception) {
    if (!useDeveloperSupport) throw exception
  }
}
