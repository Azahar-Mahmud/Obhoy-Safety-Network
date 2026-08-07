import * as Battery from 'expo-battery';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import {
  getBatteryAlertSettings,
  markEpisodeFired,
  clearEpisodeFired,
} from '../utils/batteryAlertSettings';
import { runSilentSos } from '../utils/silentSos';

export const BATTERY_CHECK_TASK = 'obhoy-battery-check';
const RESET_MARGIN = 10; // percentage points above threshold before re-arming

export default async function batteryCheckTaskHandler(): Promise<BackgroundTask.BackgroundTaskResult> {
  try {
    const settings = await getBatteryAlertSettings();
    if (!settings.enabled) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    const level = await Battery.getBatteryLevelAsync(); 
    if (level < 0) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    
    const percent = Math.round(level * 100);
    const state = await Battery.getBatteryStateAsync();
    
    // RESTORED: Now correctly ignores both CHARGING and FULL states
    const isChargingOrFull =
      state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;

    if (isChargingOrFull || percent >= settings.thresholdPercent + RESET_MARGIN) {
      await clearEpisodeFired();
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    if (percent <= settings.thresholdPercent && !settings.alreadyFiredThisEpisode) {
      await markEpisodeFired();
      await runSilentSos();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Obhoy Auto-Alert',
          body: `Battery reached ${percent}% — your location was automatically sent to your trusted contacts.`,
        },
        trigger: null,
      });
    }

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
}