import * as SecureStore from 'expo-secure-store';

const LAST_ALERT_KEY = 'obhoy_last_alert_status';

export type LastAlertStatus = {
  channel: 'backend' | 'native' | 'lan' | 'mesh' | 'failed';
  contactsNotifiedCount: number;
  sentAt: string;
  error?: string;
};

export async function saveLastAlertStatus(status: LastAlertStatus): Promise<void> {
  await SecureStore.setItemAsync(LAST_ALERT_KEY, JSON.stringify(status));
}

export async function getLastAlertStatus(): Promise<LastAlertStatus | null> {
  const raw = await SecureStore.getItemAsync(LAST_ALERT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LastAlertStatus;
  } catch {
    return null;
  }
}