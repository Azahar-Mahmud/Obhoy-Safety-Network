import * as Battery from 'expo-battery';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import {
  getBatteryAlertSettings,
  markEpisodeFired,
  clearEpisodeFired,
} from '../utils/batteryAlertSettings';
import { runSilentSos } from '../utils/silentSos';
import { loadLanguage, t } from '../i18n';
import { publishLocation } from '../utils/familyLocation'; // <--- ADDED for Obhoy_31 Rung 2

export const BATTERY_CHECK_TASK = 'obhoy-battery-check';
const RESET_MARGIN = 10;

export default async function batteryCheckTaskHandler(): Promise<BackgroundTask.BackgroundTaskResult> {
  try {
    // MUST load language first because background task runs outside React tree
    await loadLanguage();

    // Rung 2: Periodic background location publish
    await publishLocation();

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
          title: t('notif.battery_title'),
          body: t('notif.battery_body'),
        },
        trigger: null,
      });
    }

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
}