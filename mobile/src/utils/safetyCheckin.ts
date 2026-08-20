import * as Location from 'expo-location';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { sendMeshAlert } from './meshAlert';

export type SafetyCheckinResult = { channel: 'backend' | 'lan' | 'mesh' | 'failed' };

export async function broadcastSafeCheckin(overrideLat?: number, overrideLng?: number): Promise<SafetyCheckinResult> {
  let lat = overrideLat;
  let lng = overrideLng;

  if (lat == null || lng == null) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { channel: 'failed' };

    const position = await Location.getCurrentPositionAsync({});
    lat = position.coords.latitude;
    lng = position.coords.longitude;
  }

  try {
    await apiRequest('/safety-checkins', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
    return { channel: 'backend' };
  } catch {
    const lanResult = await sendLanAlert(lat, lng, 'Obhoy: Someone nearby just checked in as safe.');
    if (lanResult) return { channel: 'lan' };

    const meshBroadcastSent = await sendMeshAlert(lat, lng, 'Obhoy: Someone nearby just checked in as safe.');
    return { channel: meshBroadcastSent ? 'mesh' : 'failed' };
  }
}