import * as SecureStore from 'expo-secure-store';

const KEY = 'obhoy_last_active_at';

export async function recordLastActive(): Promise<void> {
  await SecureStore.setItemAsync(KEY, new Date().toISOString());
}

export async function getLastActive(): Promise<Date | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? new Date(raw) : null;
}