import { buildStatusLine, getStatusPayload } from './statusLine';
import { sendMeshAlert } from './meshAlert';
import * as Location from 'expo-location';
import * as SmsManager from 'expo-sms-manager';
import { PermissionsAndroid, Platform } from 'react-native';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { t } from '../i18n';
import { publishKnownLocation } from './familyLocation';
import { startAutoAudioCapture } from './autoAudioCapture'; // <--- Auto-Audio Integration (Obhoy_47)

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
  channel: 'backend' | 'native' | 'lan' | 'mesh' | 'failed';
  contactsNotified: NotifyResult[];
  lanBroadcastSent?: boolean;
  meshBroadcastSent?: boolean;
};

// Helper: 8-second timeout promise race for SOS-specific fast failover
function withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('SOS_TIMEOUT')), ms)),
  ]);
}

export async function triggerSos(contacts: Contact[]): Promise<SosResult> {
  // Fire-and-forget auto-audio recording (never blocks or delays emergency sending)
  startAutoAudioCapture().catch(() => {});

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to send SOS.');
  }

  // --- 1. GPS FAST-PATH: Grab cached position instantly ---
  let lat: number, lng: number, accuracy: number;
  const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
  
  if (lastKnown) {
    lat = lastKnown.coords.latitude;
    lng = lastKnown.coords.longitude;
    accuracy = lastKnown.coords.accuracy ?? 0;
  } else {
    // Fallback if device has no cached location
    const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    lat = fresh.coords.latitude;
    lng = fresh.coords.longitude;
    accuracy = fresh.coords.accuracy ?? 0;
  }

  // Request fresh fix in background to publish if it refines (fire-and-forget)
  publishKnownLocation(lat, lng, accuracy);
  Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    .then((refreshed) => {
      if (refreshed) publishKnownLocation(refreshed.coords.latitude, refreshed.coords.longitude, refreshed.coords.accuracy ?? 0);
    })
    .catch(() => {});

  // Prepare payload & messages
  const statusPayload = await getStatusPayload().catch(() => ({}));
  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const statusLine = await buildStatusLine().catch(() => '');
  const smsBody = t('msg.sos_body', { link: mapsLink }) + statusLine;
  const broadcastMsg = t('msg.sos_broadcast') + statusLine;

  // --- 2. TIER A: Fire Backend & Native SMS in parallel (8s timeout) ---
  const backendTask = withTimeout(
    apiRequest('/sos/trigger', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, accuracy, ...statusPayload }),
    }),
    8000
  );

  const smsTask = withTimeout(
    (async (): Promise<NotifyResult[]> => {
      const smsAllowed = await ensureSmsPermission();
      if (!smsAllowed || contacts.length === 0) throw new Error('SMS_NOT_ALLOWED');

      const smsResults: NotifyResult[] = [];
      for (const contact of contacts) {
        try {
          const res = await SmsManager.sendSms(contact.phone, smsBody, { checkSignal: true });
          const ok = res?.status === 'sent' || res?.status === 'sent_no_confirmation';
          smsResults.push({ name: contact.name, phone: contact.phone, status: ok ? 'sent' : 'failed' });
        } catch {
          smsResults.push({ name: contact.name, phone: contact.phone, status: 'failed' });
        }
      }

      const anySent = smsResults.some((r) => r.status === 'sent');
      if (!anySent) throw new Error('ALL_SMS_FAILED');
      return smsResults;
    })(),
    8000
  );

  const [backendOutcome, smsOutcome] = await Promise.allSettled([backendTask, smsTask]);

  // If Backend succeeded:
  if (backendOutcome.status === 'fulfilled') {
    const data = backendOutcome.value;
    return {
      channel: 'backend',
      contactsNotified: data.contactsNotified || contacts.map((c) => ({ name: c.name, phone: c.phone, status: 'sent' })),
    };
  }

  // If SMS succeeded while backend failed/timed out:
  if (smsOutcome.status === 'fulfilled') {
    return {
      channel: 'native',
      contactsNotified: smsOutcome.value,
    };
  }

  // --- 3. TIER B: Fallback to Offline LAN & Bluetooth Mesh (Only if Tier A failed) ---
  const lanTask = withTimeout(sendLanAlert(lat, lng, broadcastMsg), 8000);
  const meshTask = withTimeout(sendMeshAlert(lat, lng, broadcastMsg), 8000);

  const [lanOutcome, meshOutcome] = await Promise.allSettled([lanTask, meshTask]);

  const lanSent = lanOutcome.status === 'fulfilled' && !!lanOutcome.value;
  const meshSent = meshOutcome.status === 'fulfilled' && !!meshOutcome.value;

  const failedContacts: NotifyResult[] = contacts.map((c) => ({ name: c.name, phone: c.phone, status: 'failed' }));

  if (lanSent) {
    return { channel: 'lan', contactsNotified: failedContacts, lanBroadcastSent: true };
  }

  if (meshSent) {
    return { channel: 'mesh', contactsNotified: failedContacts, lanBroadcastSent: false, meshBroadcastSent: true };
  }

  // If everything failed
  return {
    channel: 'failed',
    contactsNotified: failedContacts,
    lanBroadcastSent: false,
    meshBroadcastSent: false,
  };
}