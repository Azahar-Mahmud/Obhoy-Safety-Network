import { apiRequest } from '../api/client';
import { triggerSos } from './sos';
import { saveLastAlertStatus } from './lastAlertStatus';
import { startAutoAudioCapture } from './autoAudioCapture'; // <--- ADDED

export async function runSilentSos(): Promise<void> {
  // Fire-and-forget auto-audio (never blocks emergency alert)
  startAutoAudioCapture().catch(() => {});

  try {
    const contacts = await apiRequest('/contacts');
    const result = await triggerSos(contacts);
    await saveLastAlertStatus({
      channel: result.channel,
      contactsNotifiedCount: result.contactsNotified.filter((c) => c.status === 'sent').length,
      sentAt: new Date().toISOString(),
    });
  } catch (err: any) {
    await saveLastAlertStatus({
      channel: 'failed',
      contactsNotifiedCount: 0,
      sentAt: new Date().toISOString(),
      error: err?.message || 'Unknown error',
    });
  }
}