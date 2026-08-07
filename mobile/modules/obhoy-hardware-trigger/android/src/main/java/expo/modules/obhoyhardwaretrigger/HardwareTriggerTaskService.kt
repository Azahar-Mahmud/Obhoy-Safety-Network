package expo.modules.obhoyhardwaretrigger

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class HardwareTriggerTaskService : HeadlessJsTaskService() {

    override fun onCreate() {
        super.onCreate()
        val channelId = "obhoy_background"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(channelId, "Obhoy", NotificationManager.IMPORTANCE_MIN)
            manager.createNotificationChannel(channel)
        }
        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Obhoy")
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
        startForeground(9201, notification)
    }

    // FIXED: Added ? to Intent to match Android's strict null-safety signature
    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras: Bundle? = intent?.extras
        return HeadlessJsTaskConfig(
            "ObhoyHardwareTrigger",
            if (extras != null) Arguments.fromBundle(extras) else Arguments.createMap(),
            10000, 
            true   
        )
    }
}