package expo.modules.obhoyhardwaretrigger

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.KeyguardManager
import android.content.Intent
import android.os.PowerManager
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent
import androidx.core.content.ContextCompat

class VolumeTriggerAccessibilityService : AccessibilityService() {

    private var pressCount = 0
    private var firstPressTime = 0L
    private val windowMs = 2000L
    private val requiredPresses = 3

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = serviceInfo
        info.flags = info.flags or AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS
        serviceInfo = info
    }

    override fun onKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN && event.action == KeyEvent.ACTION_DOWN) {
            val powerManager = getSystemService(POWER_SERVICE) as PowerManager
            val keyguardManager = getSystemService(KEYGUARD_SERVICE) as KeyguardManager
            val now = System.currentTimeMillis()

            val isScreenOn = powerManager.isInteractive
            val isLocked = keyguardManager.isKeyguardLocked

            if (now - firstPressTime > windowMs) {
                if (isScreenOn && !isLocked) {
                    pressCount = 0
                    return false 
                }
                
                firstPressTime = now
                pressCount = 1
                return true
            } else {
                pressCount++
            }

            if (pressCount >= requiredPresses) {
                pressCount = 0
                firstPressTime = 0L 
                val intent = Intent(this, HardwareTriggerTaskService::class.java)
                ContextCompat.startForegroundService(this, intent)
                return true
            }

            return true
        }
        return false
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}
}