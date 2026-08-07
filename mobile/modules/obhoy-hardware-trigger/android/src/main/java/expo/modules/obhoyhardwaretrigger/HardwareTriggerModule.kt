package expo.modules.obhoyhardwaretrigger

import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HardwareTriggerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("HardwareTrigger")

        Function("simulateTrigger") {
            val context = appContext.reactContext
            if (context != null) {
                val intent = Intent(context, HardwareTriggerTaskService::class.java)
                ContextCompat.startForegroundService(context, intent)
            }
        }
    }
}