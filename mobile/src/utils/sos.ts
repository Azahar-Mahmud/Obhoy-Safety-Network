import { buildStatusLine, getStatusPayload } from './statusLine';
import { sendMeshAlert } from './meshAlert';
import * as Location from 'expo-location';
import * as SmsManager from 'expo-sms-manager';
import { PermissionsAndroid, Platform } from 'react-native';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { t } from '../i18n';
import { publishKnownLocation } from './familyLocation'; // <--- ADDED for Obhoy_31 Rung 3

export async function ensureSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ]);
  return granted[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED;
}

type Contact = { name: string; phone: string };
type NotifyResult = { name: string; phone: string; status: 'sent' | 'failed' };

export type SosResult = {
  channel: 'backend' | 'native' | 'lan' | 'mesh';
  contactsNotified: NotifyResult[];
  lanBroadcastSent?: boolean;
  meshBroadcastSent?: boolean;
};

export async function triggerSos(contacts: Contact[]): Promise<SosResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to send SOS.');
  }

  let lat: number, lng: number, accuracy: number;
  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    accuracy = position.coords.accuracy ?? 0;
  } catch {
    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 86400000 });
    if (!lastKnown) {
      throw new Error('Current location is unavailable. Make sure location services are enabled.');
    }
    lat = lastKnown.coords.latitude;
    lng = lastKnown.coords.longitude;
    accuracy = lastKnown.coords.accuracy ?? 0;
  }

  // Rung 3: Opportunistic family publish using fix already obtained (fire-and-forget)
  publishKnownLocation(lat, lng, accuracy);

  // Layer 1: Server / Internet API
  try {
    const statusPayload = await getStatusPayload();
    const data = await apiRequest('/sos/trigger', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, accuracy, ...statusPayload }),
    });
    return { channel: 'backend', contactsNotified: data.contactsNotified };
  } catch {
    // Layer 2: Native Cellular SMS Fallback
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const statusLine = await buildStatusLine();
    
    // Localized alert body for Layer 2
    const message = t('msg.sos_body', { link: mapsLink }) + statusLine;
    
    const results: NotifyResult[] = [];
    const smsAllowed = await ensureSmsPermission();

    if (smsAllowed) {
      for (const contact of contacts) {
        try {
          const result = await SmsManager.sendSms(contact.phone, message, {
            checkSignal: true, 
          });
          const ok = result?.status === 'sent' || result?.status === 'sent_no_confirmation';
          results.push({
            name: contact.name,
            phone: contact.phone,
            status: ok ? 'sent' : 'failed',
          });
        } catch {
          results.push({ name: contact.name, phone: contact.phone, status: 'failed' });
        }
      }
    }

    const allFailed = results.length === 0 || results.every((r) => r.status === 'failed');
    if (!allFailed) {
      return { channel: 'native', contactsNotified: results };
    }

    // Layer 3: Local WiFi/LAN UDP Broadcast Fallback
    const lanBroadcastSent = await sendLanAlert(lat, lng, t('msg.sos_broadcast') + statusLine);
    if (lanBroadcastSent) {
      return { channel: 'lan', contactsNotified: results, lanBroadcastSent };
    }

    // Layer 4: Bluetooth Mesh Relay
    const meshBroadcastSent = await sendMeshAlert(lat, lng, t('msg.sos_broadcast') + statusLine);
    return { channel: 'mesh', contactsNotified: results, lanBroadcastSent: false, meshBroadcastSent };
  }
}