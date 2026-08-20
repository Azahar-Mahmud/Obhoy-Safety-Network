import * as Location from 'expo-location';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { sendMeshAlert } from './meshAlert';

export type AlertCategory = 'mugging' | 'harassment' | 'checkpost_harassment';
export type CommunityAlertResult = { channel: 'backend' | 'lan' | 'mesh' | 'failed' };

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  mugging: 'a mugging',
  harassment: 'harassment',
  checkpost_harassment: 'checkpost harassment',
};

export async function broadcastCommunityAlert(category: AlertCategory, overrideLat?: number, overrideLng?: number): Promise<CommunityAlertResult> {
  let lat = overrideLat;
  let lng = overrideLng;

  if (lat == null || lng == null) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { channel: 'failed' };

    const position = await Location.getCurrentPositionAsync({});
    lat = position.coords.latitude;
    lng = position.coords.longitude;
  }

  const message = `Obhoy: Anonymous alert — ${CATEGORY_LABELS[category]} reported nearby.`;

  try {
    await apiRequest('/community-alerts', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, category }),
    });
    return { channel: 'backend' };
  } catch {
    const lanResult = await sendLanAlert(lat, lng, message);
    if (lanResult) return { channel: 'lan' };

    const meshBroadcastSent = await sendMeshAlert(lat, lng, message);
    return { channel: meshBroadcastSent ? 'mesh' : 'failed' };
  }
}