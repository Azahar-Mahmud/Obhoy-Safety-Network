import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const FOREGROUND_TASK_NAME = 'OBHOY_FOREGROUND_PROTECTION';

// 1. Define the task in the global scope (Must be outside of any React component)
TaskManager.defineTask(FOREGROUND_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[FOREGROUND] Task Error:', error);
    return;
  }
  // We don't actually need to process the data here.
  // Simply receiving the background ping is enough to keep the app alive 24/7!
});

export async function startForegroundProtection(): Promise<boolean> {
  // Request foreground first
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    Alert.alert('Permission Needed', 'Foreground location is required to run the protection service.');
    return false;
  }

  // Request background permission (Required to run while screen is off)
  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    Alert.alert('Permission Needed', 'Please set Location permission to "Allow all the time" in your Android settings to keep Obhoy awake in the background.');
    return false;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(FOREGROUND_TASK_NAME);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(FOREGROUND_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15000, // Ping every 15 seconds to stay awake
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Obhoy Protection Armed',
        notificationBody: 'Running securely in the background to ensure SOS & Fall Detection are ready.',
        notificationColor: '#6B21A8',
      },
    });
  }
  
  await SecureStore.setItemAsync('obhoy_foreground_enabled', 'true');
  return true;
}

export async function stopForegroundProtection() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(FOREGROUND_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(FOREGROUND_TASK_NAME);
  }
  await SecureStore.setItemAsync('obhoy_foreground_enabled', 'false');
}

export async function autoStartForegroundIfEnabled() {
  const enabled = await SecureStore.getItemAsync('obhoy_foreground_enabled');
  if (enabled === 'true') {
    startForegroundProtection().catch(() => {});
  }
}