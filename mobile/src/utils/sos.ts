import { getStatusPayload } from './statusLine'; 
import { sendMeshAlert } from './meshAlert';
import * as Location from 'expo-location';
import * as SmsManager from 'expo-sms-manager';
import { PermissionsAndroid, Platform } from 'react-native';
import { apiRequest } from '../api/client';
import { sendLanAlert } from './lanAlert';
import { publishKnownLocation } from './familyLocation';
import { startAutoAudioCapture } from './autoAudioCapture';
import * as SecureStore from 'expo-secure-store';

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
    const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    lat = fresh.coords.latitude;
    lng = fresh.coords.longitude;
    accuracy = fresh.coords.accuracy ?? 0;
  }

  // Request fresh fix in background to publish if it refines
  publishKnownLocation(lat, lng, accuracy);
  Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    .then((refreshed) => {
      if (refreshed) publishKnownLocation(refreshed.coords.latitude, refreshed.coords.longitude, refreshed.coords.accuracy ?? 0);
    })
    .catch(() => {});

  // --- EXACT TIMESTAMP & CUSTOM MESSAGE FIX ---
  const statusPayload = await getStatusPayload().catch(() => ({}));
  
  // STRIP HTTPS:// TO BYPASS TELECOM SPAM FILTERS
  const mapsLink = `google.com/maps?q=${lat},${lng}`;
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const randomId = Math.floor(Math.random() * 10000); // Random salt to prevent duplicate blocking
  
  const customMessage = await SecureStore.getItemAsync('obhoy_custom_sos_message') || "I am in an emergency and need immediate help.";

  // Final Formatted Body without https://
  const smsBody = `[Obhoy SOS - ${timeStr}, ${dateStr}]\n${customMessage}\n\nLive tracking: ${mapsLink} \n(ID:${randomId})`;
  const broadcastMsg = `Obhoy SOS Broadcast at ${timeStr}: Someone nearby needs help!`;

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

  if (backendOutcome.status === 'fulfilled') {
    const data = backendOutcome.value;
    return {
      channel: 'backend',
      contactsNotified: data.contactsNotified || contacts.map((c) => ({ name: c.name, phone: c.phone, status: 'sent' })),
    };
  }

  if (smsOutcome.status === 'fulfilled') {
    return {
      channel: 'native',
      contactsNotified: smsOutcome.value,
    };
  }

  // --- 3. TIER B: Fallback to Offline LAN & Bluetooth Mesh ---
  const lanTask = withTimeout(sendLanAlert(lat, lng, broadcastMsg), 8000);
  const meshTask = withTimeout(sendMeshAlert(lat, lng, broadcastMsg), 8000);

  const [lanOutcome, meshOutcome] = await Promise.allSettled([lanTask, meshTask]);

  const lanSent = lanOutcome.status === 'fulfilled' && !!lanOutcome.value;
  const meshSent = meshOutcome.status === 'fulfilled' && !!meshOutcome.value;

  const failedContacts: NotifyResult[] = contacts.map((c) => ({ name: c.name, phone: c.phone, status: 'failed' }));

  if (lanSent) return { channel: 'lan', contactsNotified: failedContacts, lanBroadcastSent: true };
  if (meshSent) return { channel: 'mesh', contactsNotified: failedContacts, lanBroadcastSent: false, meshBroadcastSent: true };

  return {
    channel: 'failed',
    contactsNotified: failedContacts,
    lanBroadcastSent: false,
    meshBroadcastSent: false,
  };
}