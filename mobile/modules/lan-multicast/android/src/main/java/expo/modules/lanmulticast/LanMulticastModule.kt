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

    Function("sendUdpBroadcast") { port: Int, message: String ->
      try {
        val socket = java.net.DatagramSocket()
        socket.broadcast = true
        val data = message.toByteArray(Charsets.UTF_8)
        val address = java.net.InetAddress.getByName("255.255.255.255")
        val packet = java.net.DatagramPacket(data, data.size, address, port)
        socket.send(packet)
        socket.close()
        "sent"
      } catch (e: Exception) {
        "error: ${e.message}"
      }
    }
  }
}