package expo.modules.lockscreendisplay

import android.os.Build
import android.view.WindowManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LockScreenDisplayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LockScreenDisplay")

    Function("showOverLockScreen") {
      val activity = appContext.currentActivity
      if (activity != null) {
        activity.runOnUiThread {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            activity.setShowWhenLocked(true)
            activity.setTurnScreenOn(true)
          } else {
            activity.window.addFlags(
              WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
              WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
              WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
          }
        }
      }
    }

    Function("hideOverLockScreen") {
      val activity = appContext.currentActivity
      if (activity != null) {
        activity.runOnUiThread {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            activity.setShowWhenLocked(false)
            activity.setTurnScreenOn(false)
          } else {
            activity.window.clearFlags(
              WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
              WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
          }
        }
      }
    }
  }
}