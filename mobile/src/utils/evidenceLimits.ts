import * as FileSystem from 'expo-file-system/legacy';
import * as Battery from 'expo-battery';

const MIN_FREE_STORAGE_BYTES = 200 * 1024 * 1024; // 200MB warning line
const CRITICAL_STORAGE_BYTES = 50 * 1024 * 1024;  // 50MB hard stop
const MIN_BATTERY_PERCENT = 15;
const CRITICAL_BATTERY_PERCENT = 8;

export type LimitStatus = { warning: string | null; mustStop: boolean };

export async function checkLimits(): Promise<LimitStatus> {
  const freeStorage = await FileSystem.getFreeDiskStorageAsync();
  const batteryLevel = await Battery.getBatteryLevelAsync();
  const batteryPercent = batteryLevel >= 0 ? Math.round(batteryLevel * 100) : 100;

  if (freeStorage < CRITICAL_STORAGE_BYTES || batteryPercent <= CRITICAL_BATTERY_PERCENT) {
    return { warning: null, mustStop: true };
  }
  if (freeStorage < MIN_FREE_STORAGE_BYTES) {
    return { warning: 'Storage running low — recording will stop soon.', mustStop: false };
  }
  if (batteryPercent <= MIN_BATTERY_PERCENT) {
    return { warning: 'Battery running low — recording will stop soon.', mustStop: false };
  }
  return { warning: null, mustStop: false };
}