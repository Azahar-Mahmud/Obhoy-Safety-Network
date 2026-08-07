import * as SecureStore from 'expo-secure-store';

const SILENT_MODE_KEY = 'obhoy_silent_mode_enabled';

export async function getSilentModeEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(SILENT_MODE_KEY);
  return value === 'true';
}

export async function setSilentModeEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(SILENT_MODE_KEY, enabled ? 'true' : 'false');
}