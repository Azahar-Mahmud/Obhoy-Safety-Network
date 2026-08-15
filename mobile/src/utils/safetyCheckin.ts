import * as Location from 'expo-location';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { sendMeshAlert } from './meshAlert';
import { t } from '../i18n';

export type SafetyCheckinResult = { channel: 'backend' | 'lan' | 'mesh' | 'failed' };

export async function broadcastSafeCheckin(): Promise<SafetyCheckinResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { channel: 'failed' };

  const position = await Location.getCurrentPositionAsync({});
  const { latitude: lat, longitude: lng } = position.coords;

  try {
    await apiRequest('/safety-checkins', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
    return { channel: 'backend' };
  } catch {
    const lanResult = await sendLanAlert(lat, lng, t('msg.safe_checkin'));
    if (lanResult) return { channel: 'lan' };

    const meshBroadcastSent = await sendMeshAlert(lat, lng, t('msg.safe_checkin'));
    return { channel: meshBroadcastSent ? 'mesh' : 'failed' };
  }
}