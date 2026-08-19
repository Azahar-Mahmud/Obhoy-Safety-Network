package expo.modules.discreettoggle

import android.content.ComponentName
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DiscreetToggleModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DiscreetToggle")

    Function("enableDisguise") {
      setComponentsDisguised(true)
    }

    Function("disableDisguise") {
      setComponentsDisguised(false)
    }
  }

  private fun setComponentsDisguised(disguised: Boolean) {
    val context = appContext.reactContext ?: return
    val pm = context.packageManager
    val pkg = context.packageName

    // Point to the dedicated default alias rather than disabling the base activity
    val defaultAlias = ComponentName(pkg, "$pkg.MainActivityDefault")
    val calculatorAlias = ComponentName(pkg, "$pkg.CalculatorDisguiseActivity")

    // Disable Default "Obhoy" Icon when disguised, Enable when normal
    pm.setComponentEnabledSetting(
      defaultAlias,
      if (disguised) PackageManager.COMPONENT_ENABLED_STATE_DISABLED
      else PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
      PackageManager.DONT_KILL_APP
    )

    // Enable "Calculator" Disguise Icon when disguised, Disable when normal
    pm.setComponentEnabledSetting(
      calculatorAlias,
      if (disguised) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
      PackageManager.DONT_KILL_APP
    )
  }
}