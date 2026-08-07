import * as BackgroundTask from 'expo-background-task';
import { BATTERY_CHECK_TASK } from '../tasks/batteryCheckTask';

export async function enableBatteryAlert(): Promise<void> {
  // minimumInterval: 15 is extremely important! 
  // If we leave this out, Android defaults to checking only once every 12 hours.
  await BackgroundTask.registerTaskAsync(BATTERY_CHECK_TASK, { minimumInterval: 15 });
}

export async function disableBatteryAlert(): Promise<void> {
  await BackgroundTask.unregisterTaskAsync(BATTERY_CHECK_TASK);
}