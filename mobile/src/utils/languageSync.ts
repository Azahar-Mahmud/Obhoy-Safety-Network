import { apiRequest } from '../api/client';
import { getLanguage } from '../i18n';

/**
 * Pushes the current language to the backend so server-composed SMS
 * (OTP aside) goes out in the right language.
 *
 * Deliberately fire-and-forget: the UI language must never depend on
 * the network, and this runs in exactly the offline conditions this
 * app is built for. A failure here means SMS stays in the previously
 * synced language until the next successful sync - never a blocked UI.
 */
export async function syncLanguageToBackend(): Promise<void> {
  try {
    await apiRequest('/preferences/language', {
      method: 'PATCH',
      body: JSON.stringify({ language: getLanguage() }),
    });
  } catch {
    // intentionally silent
  }
}