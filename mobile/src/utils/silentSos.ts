import { apiRequest } from '../api/client';
import { triggerSos } from './sos';
import { saveLastAlertStatus } from './lastAlertStatus';

export async function runSilentSos(): Promise<void> {
  try {
    // Fetch the user's contacts quietly
    const contacts = await apiRequest('/contacts');
    
    // Fire the SOS (this does everything: SMS, Backend, LAN, Mesh)
    const result = await triggerSos(contacts);
    
    // Save the result silently
    await saveLastAlertStatus({
      channel: result.channel,
      contactsNotifiedCount: result.contactsNotified.filter((c) => c.status === 'sent').length,
      sentAt: new Date().toISOString(),
    });
  } catch (err: any) {
    // If it completely fails, save the error silently
    await saveLastAlertStatus({
      channel: 'failed',
      contactsNotifiedCount: 0,
      sentAt: new Date().toISOString(),
      error: err?.message || 'Unknown error',
    });
  }
}