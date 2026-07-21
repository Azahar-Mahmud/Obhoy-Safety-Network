import * as Location from 'expo-location';
import * as SmsManager from 'expo-sms-manager';
import { apiRequest } from '../api/client';

type Contact = { name: string; phone: string };
type NotifyResult = { name: string; phone: string; status: 'sent' | 'failed' };
export type SosResult = { channel: 'backend' | 'native'; contactsNotified: NotifyResult[] };

export async function triggerSos(contacts: Contact[]): Promise<SosResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to send SOS.');
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = position.coords.accuracy ?? 0;

  try {
    const data = await apiRequest('/sos/trigger', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, accuracy }),
    });
    return { channel: 'backend', contactsNotified: data.contactsNotified };
  } catch {
    // No internet, or backend unreachable — send directly from this phone's own SIM instead.
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const message = `Obhoy Alert: I need help. My location: ${mapsLink}`;
    const results: NotifyResult[] = [];
    for (const contact of contacts) {
      try {
        await SmsManager.sendSms(contact.phone, message, {});
        results.push({ name: contact.name, phone: contact.phone, status: 'sent' });
      } catch {
        results.push({ name: contact.name, phone: contact.phone, status: 'failed' });
      }
    }
    return { channel: 'native', contactsNotified: results };
  }
}