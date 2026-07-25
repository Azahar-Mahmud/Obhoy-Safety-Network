package expo.modules.lanmulticast

import android.content.Context
import android.net.wifi.WifiManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LanMulticastModule : Module() {
  private var lock: WifiManager.MulticastLock? = null

  override fun definition() = ModuleDefinition {
    Name("LanMulticast")

    Function("acquireMulticastLock") {
      appContext.reactContext?.let { context ->
        val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        if (lock == null) {
          lock = wifi.createMulticastLock("obhoy-lan-alert")
          lock?.setReferenceCounted(true)
        }
        lock?.acquire()
      }
    }

    Function("releaseMulticastLock") {
      if (lock?.isHeld == true) {
        lock?.release()
      }
    }
  }
}