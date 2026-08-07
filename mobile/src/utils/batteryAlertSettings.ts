import * as SecureStore from 'expo-secure-store';

const KEY = 'obhoy_battery_alert_settings';

export type BatteryAlertSettings = {
  enabled: boolean;
  thresholdPercent: number;
  alreadyFiredThisEpisode: boolean;
};

const DEFAULTS: BatteryAlertSettings = {
  enabled: false,
  thresholdPercent: 20,
  alreadyFiredThisEpisode: false,
};

export async function getBatteryAlertSettings(): Promise<BatteryAlertSettings> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

async function save(settings: BatteryAlertSettings): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(settings));
}

export async function setBatteryAlertEnabled(enabled: boolean): Promise<void> {
  const current = await getBatteryAlertSettings();
  // When enabling, we reset the "already fired" flag so it is ready to go
  await save({ ...current, enabled, alreadyFiredThisEpisode: false });
}

export async function setBatteryAlertThreshold(thresholdPercent: number): Promise<void> {
  const current = await getBatteryAlertSettings();
  await save({ ...current, thresholdPercent });
}

// Mark that the SOS was sent so we don't spam the user's contacts
export async function markEpisodeFired(): Promise<void> {
  const current = await getBatteryAlertSettings();
  await save({ ...current, alreadyFiredThisEpisode: true });
}

// Reset the flag once the phone is charged back up
export async function clearEpisodeFired(): Promise<void> {
  const current = await getBatteryAlertSettings();
  if (current.alreadyFiredThisEpisode) {
    await save({ ...current, alreadyFiredThisEpisode: false });
  }
}