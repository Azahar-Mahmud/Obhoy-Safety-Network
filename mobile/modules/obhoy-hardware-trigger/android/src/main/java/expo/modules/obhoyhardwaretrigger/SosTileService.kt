package expo.modules.obhoyhardwaretrigger

import android.content.Intent
import android.service.quicksettings.TileService
import androidx.core.content.ContextCompat

class SosTileService : TileService() {
    override fun onClick() {
        super.onClick()
        // When the tile is tapped, start the working background task!
        val intent = Intent(this, HardwareTriggerTaskService::class.java)
        ContextCompat.startForegroundService(this, intent)
    }
}