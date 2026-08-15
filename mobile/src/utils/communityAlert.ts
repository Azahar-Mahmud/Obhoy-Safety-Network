import * as Location from 'expo-location';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { sendMeshAlert } from './meshAlert';
import { t } from '../i18n';

export type AlertCategory = 'mugging' | 'harassment' | 'checkpost_harassment';
export type CommunityAlertResult = { channel: 'backend' | 'lan' | 'mesh' | 'failed' };

export async function broadcastCommunityAlert(category: AlertCategory): Promise<CommunityAlertResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { channel: 'failed' };

  const position = await Location.getCurrentPositionAsync({});
  const { latitude: lat, longitude: lng } = position.coords;

  const categoryLabel = t(`category.${category}` as any);
  const message = t('msg.community_alert', { category: categoryLabel });

  try {
    await apiRequest('/community-alerts', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, category }), // DB Enum value stays in English
    });
    return { channel: 'backend' };
  } catch {
    const lanResult = await sendLanAlert(lat, lng, message);
    if (lanResult) return { channel: 'lan' };

    const meshBroadcastSent = await sendMeshAlert(lat, lng, message);
    return { channel: meshBroadcastSent ? 'mesh' : 'failed' };
  }
}