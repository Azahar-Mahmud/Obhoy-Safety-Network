import * as Location from 'expo-location';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { sendMeshAlert } from './meshAlert';

export type SafetyCheckinResult = { channel: 'backend' | 'lan' | 'mesh' | 'failed' };

export async function broadcastSafeCheckin(): Promise<SafetyCheckinResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { channel: 'failed' };

  const position = await Location.getCurrentPositionAsync({});
  const { latitude: lat, longitude: lng } = position.coords;

  try {
    // 1. Try sending via the normal internet connection
    await apiRequest('/safety-checkins', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
    return { channel: 'backend' };
  } catch {
    // 2. If internet fails, fallback to Local Area Network (WiFi without internet)
    const lanResult = await sendLanAlert(lat, lng, 'Obhoy: Someone nearby just checked in as safe.');
    if (lanResult.sent) return { channel: 'lan' };

    // 3. If LAN fails, fallback to Bluetooth Mesh
    const meshBroadcastSent = await sendMeshAlert(lat, lng, 'Obhoy: Someone nearby just checked in as safe.');
    return { channel: meshBroadcastSent ? 'mesh' : 'failed' };
  }
}